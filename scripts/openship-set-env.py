#!/usr/bin/env python3
"""Copy named variables from an Infisical prod export into the devrel.md OpenShip project.

Runs on the OpenShip control plane box (ubuntu-8gb-hel1), reading `infisical export --env=prod --format=json` from stdin, so no
value is ever printed, put on a command line or written to disk. The exact command to run it from a
Mac is in README.md, under Configuration.

Refuses empty values (a disabled variable must be absent, not "") and the development defaults
from .env.example. Setting variables does not redeploy: the next deploy picks them up.
"""

import json
import os
import sys
import urllib.error
import urllib.request

API = os.environ.get("OPENSHIP_API", "http://127.0.0.1:4000")
TOKEN_PATH = os.path.expanduser("~/.config/linkintel/openship.token")
PROJECT = "proj_VTooQP1XM66SYDDZ"

# Matches how production stores them today; everything else is stored as a secret.
NOT_SECRET = {"DAILY_SPEND_CAP_USD", "EMAIL_FROM", "EMAIL_REPLY_TO", "RESEND_AUDIENCE_ID",
              "SERIES_ENABLED", "SITE_URL", "TURNSTILE_SITE_KEY"}
DEV_DEFAULTS = {"local-dev-salt", "local-dev-cron-secret", "http://localhost:3000",
                "1x00000000000000000000AA", "1x0000000000000000000000000000000AA"}


def load_export(text: str) -> dict:
    data = json.loads(text)
    if isinstance(data, dict):
        return data
    return {item["key"]: item["value"] for item in data}


def main() -> None:
    names = sys.argv[1:]
    if not names:
        sys.exit("Name at least one variable to copy.")
    secrets = load_export(sys.stdin.read())

    upserts = []
    for name in names:
        value = secrets.get(name)
        if value is None or value.strip() == "":
            sys.exit(f"{name} is missing or empty in the Infisical export; nothing was changed.")
        if value.strip() in DEV_DEFAULTS:
            sys.exit(f"{name} is still a development default in Infisical prod; nothing was changed.")
        upserts.append({"key": name, "value": value, "isSecret": name not in NOT_SECRET})

    with open(TOKEN_PATH) as handle:
        token = handle.read().strip()
    body = json.dumps({"environment": "production", "upserts": upserts, "deletes": []}).encode()
    request = urllib.request.Request(
        f"{API}/api/projects/{PROJECT}/env",
        data=body,
        method="PATCH",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=30):
            pass
    except urllib.error.HTTPError as exc:
        sys.exit(f"OpenShip refused the update: HTTP {exc.code}; nothing is confirmed set.")
    print("Set in OpenShip production: " + ", ".join(names) + ". Redeploy to apply.")


if __name__ == "__main__":
    main()
