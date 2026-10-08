#!/bin/sh
set -e

# Default to public Render URL for seamless zero-config communication
TARGET_URL="${API_URL:-${VITE_API_URL:-${VITE_API_BASE_URL:-https://abhisaran-api.onrender.com}}}"
# Strip any trailing slash
TARGET_URL="$(echo "$TARGET_URL" | sed 's:/*$::')"

echo "Configuring Nginx backend upstream to: $TARGET_URL"
sed -i "s|__BACKEND_URL__|${TARGET_URL}|g" /etc/nginx/conf.d/default.conf

exec nginx -g "daemon off;"
