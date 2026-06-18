#!/usr/bin/env bash
set -euo pipefail

OUTPUT_DIR="${1:-backups}"
KEY_FILE="${BACKUP_KEY_FILE:-secrets/backup_encryption_key.txt}"
APP_USER_FILE="${MONGO_APP_USERNAME_FILE:-secrets/mongo_app_username.txt}"
APP_PASSWORD_FILE="${MONGO_APP_PASSWORD_FILE:-secrets/mongo_app_password.txt}"
DATABASE="${MONGO_DATABASE:-adwety}"

for file in "$KEY_FILE" "$APP_USER_FILE" "$APP_PASSWORD_FILE"; do
  if [[ ! -s "$file" ]]; then
    echo "Required secret file is missing or empty: $file" >&2
    exit 1
  fi
done

mkdir -p "$OUTPUT_DIR"
chmod 700 "$OUTPUT_DIR"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUTPUT_FILE="$OUTPUT_DIR/adwety-${TIMESTAMP}.archive.gz.enc"
MONGO_USER="$(cat "$APP_USER_FILE")"
MONGO_PASSWORD="$(cat "$APP_PASSWORD_FILE")"

# The archive is streamed directly into encryption; no plaintext backup is written to disk.
docker compose exec -T mongo mongodump \
  --db "$DATABASE" \
  --authenticationDatabase "$DATABASE" \
  --username "$MONGO_USER" \
  --password "$MONGO_PASSWORD" \
  --archive \
  --gzip \
| openssl enc -aes-256-cbc -salt -pbkdf2 -iter 200000 \
    -pass "file:$KEY_FILE" \
    -out "$OUTPUT_FILE"

chmod 600 "$OUTPUT_FILE"
echo "Encrypted backup created: $OUTPUT_FILE"
