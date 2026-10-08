#!/usr/bin/env bash
# Nightly encrypted backup of the devrel.md production database to Cloudflare R2.
#
# pg_dump runs inside the database container (same Postgres version), streams into
# age (public key only, so this host can encrypt but never decrypt), and the
# ciphertext is uploaded with curl's built-in AWS SigV4 signing. No plaintext dump
# touches disk. Any failure is logged and emailed.
#
# Config: ~/devrelmd/backup.env (mode 600). Install: see ops/backup/README.md.
set -euo pipefail

ENV_FILE="${ENV_FILE:-$HOME/devrelmd/backup.env}"
LOG="${LOG:-$HOME/devrelmd/backup.log}"
AGE="${AGE:-$HOME/.local/bin/age}"
CONTAINER="${CONTAINER:-devrelmd-prod-db}"
MIN_BYTES="${MIN_BYTES:-1024}"

log() { echo "$(date -u +%FT%TZ) $*" >> "$LOG"; }

alert() {
  if [ -z "${RESEND_API_KEY:-}" ]; then log "ALERT NOT SENT: RESEND_API_KEY is not set"; return 0; fi
  local body status
  body=$(python3 -c 'import json,sys; print(json.dumps({"from": sys.argv[1], "to": [sys.argv[2]], "subject": "devrel.md database backup FAILED", "text": sys.argv[3]}))' \
    "${ALERT_FROM:-DEVREL.md <hello@mail.devrel.md>}" "${ALERT_TO:-hello@devrel.md}" \
    "The nightly devrel.md database backup failed on $(hostname) at $(date -u +%FT%TZ): $1. See ~/devrelmd/backup.log.")
  # Resend's answer is checked and logged, so a rejected alert (bad key, unverified
  # sender) shows up in the log instead of failing silently.
  status=$(curl -s -m 20 -o /dev/null -w '%{http_code}' https://api.resend.com/emails \
    -H "Authorization: Bearer ${RESEND_API_KEY}" -H "Content-Type: application/json" -d "$body") || true
  case "$status" in
    2??) log "ALERT SENT to ${ALERT_TO:-hello@devrel.md}" ;;
    *) log "ALERT NOT SENT: Resend answered HTTP ${status:-000}" ;;
  esac
}

fail() { log "FAIL $1"; alert "$1"; exit 1; }
trap 'fail "unexpected error on line $LINENO"' ERR

# Checked explicitly: bash exits without running the ERR trap when `.` cannot
# find its file, so a missing env file would otherwise go unlogged.
[ -r "$ENV_FILE" ] || fail "cannot read $ENV_FILE"
set -a; . "$ENV_FILE"; set +a

for v in R2_BACKUP_ACCESS_KEY_ID R2_BACKUP_SECRET_ACCESS_KEY R2_BACKUP_ENDPOINT R2_BACKUP_BUCKET AGE_RECIPIENT; do
  [ -n "${!v:-}" ] || fail "missing $v in $ENV_FILE"
done

TS=$(date -u +%Y-%m-%dT%H%M%SZ)
DAY=$(date -u +%Y-%m-%d)
TMP=$(mktemp); trap 'rm -f "$TMP"' EXIT

docker exec "$CONTAINER" pg_dump -U devrelmd -Fc devrelmd | "$AGE" -r "$AGE_RECIPIENT" -o "$TMP"
SIZE=$(stat -c %s "$TMP")
[ "$SIZE" -ge "$MIN_BYTES" ] || fail "encrypted dump is only $SIZE bytes"

put() {
  local key="$1" url="${R2_BACKUP_ENDPOINT%/}/${R2_BACKUP_BUCKET}/$1"
  curl -sS -f -m 300 --aws-sigv4 "aws:amz:auto:s3" \
    --user "${R2_BACKUP_ACCESS_KEY_ID}:${R2_BACKUP_SECRET_ACCESS_KEY}" \
    -T "$TMP" "$url" -o /dev/null
  local remote
  remote=$(curl -sS -f -m 60 -I --aws-sigv4 "aws:amz:auto:s3" \
    --user "${R2_BACKUP_ACCESS_KEY_ID}:${R2_BACKUP_SECRET_ACCESS_KEY}" "$url" \
    | tr -d '\r' | awk 'tolower($1)=="content-length:"{print $2}')
  [ "$remote" = "$SIZE" ] || fail "uploaded $key but R2 reports $remote bytes, expected $SIZE"
  log "OK $key $SIZE bytes"
}

put "daily/$DAY/devrelmd-$TS.dump.age"
if [ "$(date -u +%d)" = "01" ]; then
  put "monthly/$(date -u +%Y-%m)/devrelmd-$TS.dump.age"
fi
