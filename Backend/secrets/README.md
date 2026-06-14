# Production secret files

Create these files before `docker compose up -d --build`. Do not commit their contents:

- `mongo_root_username.txt`
- `mongo_root_password.txt`
- `mongo_app_username.txt`
- `mongo_app_password.txt`
- `jwt_secret.txt`
- `otp_hash_secret.txt`
- `refresh_token_secret.txt`
- `csrf_secret.txt`
- `password_pepper.txt`
- `data_encryption_key.txt`
- `mfa_encryption_key.txt`
- `redis_password.txt`
- `gemini_api_key.txt`
- `smtp_password.txt`

Generate secrets, for example:

```bash
openssl rand -hex 64 > secrets/jwt_secret.txt
openssl rand -hex 64 > secrets/otp_hash_secret.txt
openssl rand -hex 64 > secrets/refresh_token_secret.txt
openssl rand -hex 64 > secrets/csrf_secret.txt
openssl rand -hex 64 > secrets/password_pepper.txt
openssl rand -hex 32 > secrets/data_encryption_key.txt
openssl rand -hex 32 > secrets/mfa_encryption_key.txt
openssl rand -hex 32 > secrets/redis_password.txt
chmod 600 secrets/*.txt
```

Keep encrypted off-site backups of the encryption keys. Losing `DATA_ENCRYPTION_KEY` or `MFA_ENCRYPTION_KEY` makes protected data unrecoverable. Rotating those keys requires a controlled migration.
