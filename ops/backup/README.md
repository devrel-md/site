# Database backups

`backup.sh` runs nightly at 03:17 UTC from the crontab of ubuntu-4gb-fsn1, the server that hosts the database (ubuntu-8gb-hel1 until 7 Oct 2026). It dumps the `devrelmd-prod-db` container with `pg_dump -Fc`, encrypts the stream with [age](https://github.com/FiloSottile/age) to a public key, and uploads the ciphertext to the R2 bucket `devrelmd-db-backups` using curl's AWS SigV4 signing. No plaintext dump touches disk. Any failure is logged to `~/devrelmd/backup.log` and emailed to hello@devrel.md.

- Objects: `daily/YYYY-MM-DD/devrelmd-<timestamp>.dump.age`, plus `monthly/YYYY-MM/...` on the 1st.
- Retention: set R2 lifecycle rules on the bucket (daily 35 days, monthly 400 days). The backup keys are bucket-scoped and can't manage rules.
- Keys: the private key is only in Infisical (devrel.md project, prod) as `DEVRELMD_DB_BACKUP_AGE_SECRET_KEY`. The host holds only the public key, so it can encrypt but never decrypt.

## Install on the host

1. `age` in `~/.local/bin` (release binary, SHA256 checked against the GitHub release digest).
2. Copy `backup.sh` to `~/devrelmd/backup.sh` (mode 700).
3. Write `~/devrelmd/backup.env` (mode 600) from Infisical prod: `R2_BACKUP_ACCESS_KEY_ID`, `R2_BACKUP_SECRET_ACCESS_KEY`, `R2_BACKUP_ENDPOINT`, `R2_BACKUP_BUCKET`, `AGE_RECIPIENT` (= `DEVRELMD_DB_BACKUP_AGE_PUBLIC_KEY`), `RESEND_API_KEY`, `ALERT_TO`, `ALERT_FROM`.
4. Crontab: `17 3 * * * $HOME/devrelmd/backup.sh >> $HOME/devrelmd/backup.log 2>&1`

## Restore

Restore into a throwaway container on the host, never on a laptop.

1. Download the object from R2 with the same curl SigV4 call the script uses.
2. Pipe `DEVRELMD_DB_BACKUP_AGE_SECRET_KEY` from Infisical into a mode-600 temp file. Never put it on a command line.
3. `age -d -i <keyfile> -o backup.dump backup.dump.age`, then `shred -u` the key file.
4. `docker run -d --name devrelmd-restore --memory 256m -e POSTGRES_USER=devrelmd -e POSTGRES_DB=devrelmd -e POSTGRES_PASSWORD=<temp> postgres:16-alpine`, copy the dump in, then `pg_restore -U devrelmd -d devrelmd --no-owner /tmp/backup.dump`.
5. Check the data, then remove the container and `shred -u` the dump.

Last tested: 7 Oct 2026 on ubuntu-4gb-fsn1, after the move: the newest daily object restored into a throwaway container with the same row count as production in every table. Before that, 29 Sep 2026 on ubuntu-8gb-hel1 (a sentinel row came back intact from R2).
