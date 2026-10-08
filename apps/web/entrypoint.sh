#!/bin/sh
set -e

# Default to production backend URL on Render
TARGET_URL="${API_URL:-${VITE_API_URL:-${VITE_API_BASE_URL:-https://abhisaran-api.onrender.com}}}"
# Strip trailing slashes
TARGET_URL="$(echo "$TARGET_URL" | sed 's:/*$::')"

# Extract hostname without protocol and port
TARGET_HOST="$(echo "$TARGET_URL" | sed -e 's|^[^/]*//||' -e 's|/.*$||' -e 's|:.*$||')"

echo "Configuring Nginx backend upstream: $TARGET_URL (Host: $TARGET_HOST)"

sed -i "s|__BACKEND_URL__|${TARGET_URL}|g" /etc/nginx/conf.d/default.conf
sed -i "s|__BACKEND_HOST__|${TARGET_HOST}|g" /etc/nginx/conf.d/default.conf

exec nginx -g "daemon off;"
