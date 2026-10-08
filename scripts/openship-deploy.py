#!/usr/bin/env python3
"""Deploy a commit of main to the devrel.md OpenShip project and verify it is live.

Runs on the self-hosted runner on the OpenShip control plane box (ubuntu-8gb-hel1), because the
OpenShip API listens on 127.0.0.1 and is reachable from nowhere else. The app itself runs on the
OpenShip server ubuntu-4gb-fsn1 (SERVER below). Adapted from LinkIntel's scripts/openship-deploy.py.

The API token is read from the box's local credential store, never from GitHub secrets.

Also sets GIT_COMMIT_SHA before building, because OpenShip injects no build identity of its own and
/healthz reports it. The health check then waits until devrel.md serves exactly this commit.

A live deploy whose /healthz reports `config: invalid` still finishes, then fails the job loudly
with the variable names, so a missing production secret cannot go unnoticed.
"""

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

API = "http://127.0.0.1:4000"
TOKEN_PATH = os.path.expanduser("~/.config/linkintel/openship.token")
PROJECT = "proj_VTooQP1XM66SYDDZ"
SERVER = "0cdb5d96-2de1-4254-a04f-bc5e807db20f"
HEALTH_URL = "https://devrel.md/healthz"

POLL_SECONDS = 10
TIMEOUT_SECONDS = 900
TERMINAL_OK = {"ready"}
TERMINAL_BAD = {"failed", "error", "cancelled"}
STATE_PATH = Path("~/.local/state/devrelmd/openship-main-deployment-id").expanduser()


def token() -> str:
    try:
        value = Path(TOKEN_PATH).read_text().strip()
    except OSError as exc:
        sys.exit(f"Cannot read the OpenShip token at {TOKEN_PATH}: {exc}")
    if not value:
        sys.exit(f"The OpenShip token at {TOKEN_PATH} is empty.")
    return value


def call(method: str, path: str, body: dict | None = None) -> dict:
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(
        f"{API}{path}",
        data=data,
        method=method,
        headers={"Authorization": f"Bearer {token()}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.loads(response.read() or "{}")
    except urllib.error.HTTPError as exc:
        sys.exit(f"{method} {path} failed: HTTP {exc.code}")
    except urllib.error.URLError as exc:
        sys.exit(f"{method} {path} could not reach the OpenShip API: {exc.reason}")


def unwrap(payload: dict) -> dict:
    inner = payload.get("data", payload)
    return inner.get("deployment", inner) if isinstance(inner, dict) else inner


def refuse_overlap() -> None:
    """Never start a build while the previous one is still running."""
    try:
        deployment_id = STATE_PATH.read_text().strip()
    except FileNotFoundError:
        return
    except OSError as exc:
        sys.exit(f"Cannot read OpenShip deployment state: {exc}")
    if deployment_id == "request-pending" or not deployment_id:
        sys.exit("A previous deployment request had an uncertain outcome. Check OpenShip, then delete "
                 f"{STATE_PATH}.")
    status = unwrap(call("GET", f"/api/deployments/{deployment_id}")).get("status")
    if status not in TERMINAL_OK | TERMINAL_BAD:
        sys.exit(f"Deployment {deployment_id} is still '{status}'; refusing to overlap it.")
    STATE_PATH.unlink(missing_ok=True)


def remember(value: str) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    temporary = STATE_PATH.with_name(f".{STATE_PATH.name}.tmp")
    temporary.write_text(f"{value}\n")
    os.replace(temporary, STATE_PATH)


def verify_health(sha: str) -> dict:
    deadline = time.monotonic() + 120
    while time.monotonic() < deadline:
        try:
            request = urllib.request.Request(
                f"{HEALTH_URL}?revision={sha}",
                # Our own user agent: Cloudflare's Browser Integrity Check rejects Python's default.
                headers={"Cache-Control": "no-cache", "User-Agent": "devrelmd-deploy/1.0"})
            with urllib.request.urlopen(request, timeout=15) as response:
                health = json.load(response)
            if health.get("status") == "ok" and health.get("build_sha") == sha:
                return health
        except (OSError, ValueError):
            pass
        time.sleep(5)
    sys.exit(f"devrel.md did not serve the expected healthy revision {sha}")


def report_config(health: dict) -> None:
    if health.get("config") != "invalid":
        return
    names = ", ".join(health.get("config_problems") or []) or "unknown"
    print(f"::error title=Production configuration invalid::{names}")
    sys.exit(f"{health.get('build_sha', '')[:12]} is live, but these production variables are missing "
             f"or on a development default: {names}. Set them in OpenShip (README, Configuration) "
             "and redeploy.")


def main() -> None:
    sha = os.environ.get("SHA", "").strip()
    if not re.fullmatch(r"[0-9a-f]{40}", sha):
        sys.exit("SHA must be a full Git commit SHA.")
    print(f"Deploying main ({sha[:12]}) to {PROJECT}")
    refuse_overlap()

    # Set the revision before deploying: the build bakes the environment in.
    call(
        "PATCH",
        f"/api/projects/{PROJECT}/env",
        {
            "environment": "production",
            "upserts": [{"key": "GIT_COMMIT_SHA", "value": sha, "isSecret": False}],
            "deletes": [],
        },
    )

    # Persist before POST: a lost response must not let the next run overlap a build that
    # OpenShip accepted but whose id we never received.
    remember("request-pending")
    deployment = unwrap(call("POST", "/api/deployments", {
        "projectId": PROJECT,
        "serverId": SERVER,
        "branch": "main",
        "commitSha": sha,
        "environment": "production",
    }))
    deployment_id = deployment.get("id")
    if not deployment_id:
        sys.exit(f"OpenShip did not return a deployment id: {json.dumps(deployment)[:300]}")
    remember(deployment_id)
    print(f"Deployment {deployment_id} queued")

    deadline = time.monotonic() + TIMEOUT_SECONDS
    status = None
    while time.monotonic() < deadline:
        status = unwrap(call("GET", f"/api/deployments/{deployment_id}")).get("status")
        print(f"  status: {status}")
        if status in TERMINAL_OK:
            health = verify_health(sha)
            STATE_PATH.unlink(missing_ok=True)
            print(f"Deployed and health-verified {sha[:12]} on devrel.md")
            report_config(health)
            return
        if status in TERMINAL_BAD:
            STATE_PATH.unlink(missing_ok=True)
            sys.exit(f"Deployment {deployment_id} finished as '{status}'")
        time.sleep(POLL_SECONDS)

    sys.exit(f"Deployment {deployment_id} still '{status}' after {TIMEOUT_SECONDS}s")


if __name__ == "__main__":
    main()
