#!/usr/bin/env sh
set -eu

: "${STAGING_BASE_URL:?Set STAGING_BASE_URL, for example https://staging-api.example.com}"
REPORT_DIR="${DAST_REPORT_DIR:-./security-reports}"
SPEC_SOURCE="${DAST_OPENAPI_SPEC:-./docs/security-openapi.yaml}"
mkdir -p "$REPORT_DIR"

case "$STAGING_BASE_URL" in
  https://*) ;;
  *) echo "STAGING_BASE_URL must use HTTPS" >&2; exit 2 ;;
esac

RUNTIME_SPEC="$REPORT_DIR/security-openapi-runtime.yaml"
sed "s#https://staging.invalid#${STAGING_BASE_URL%/}#g" "$SPEC_SOURCE" > "$RUNTIME_SPEC"

# Passive spider/header/cookie scan of the canonical API entry point.
docker run --rm \
  -v "$(pwd)/$REPORT_DIR:/zap/wrk:rw" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py \
  -t "${STAGING_BASE_URL%/}/api/v1/meta" \
  -r zap-baseline.html \
  -J zap-baseline.json \
  -w zap-baseline.md \
  -I

# OpenAPI-driven active scan of security-relevant canonical routes. Protected
# operations are expected to return 401/403 without an authenticated context;
# role/tenant abuse is covered by the MongoDB integration suite and pentest gate.
docker run --rm \
  -v "$(pwd)/$REPORT_DIR:/zap/wrk:rw" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-api-scan.py \
  -t /zap/wrk/security-openapi-runtime.yaml \
  -f openapi \
  -r zap-api-scan.html \
  -J zap-api-scan.json \
  -w zap-api-scan.md \
  -I

echo "ZAP baseline and API scan reports written to $REPORT_DIR"
