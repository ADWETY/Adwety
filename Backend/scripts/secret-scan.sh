#!/usr/bin/env sh
set -eu
if command -v gitleaks >/dev/null 2>&1; then
  exec gitleaks detect --source . --redact --no-banner
fi
echo "gitleaks is required. Install it or run the GitHub security workflow." >&2
exit 2
