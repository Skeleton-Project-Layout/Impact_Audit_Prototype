#!/bin/sh
set -e

# Prefer explicit API_URL, then VITE_API_URL, then public production default
TARGET_URL="${API_URL:-${VITE_API_URL:-https://abhisaran-api.onrender.com}}"

# If someone passed an empty string or relative path, fall back to production API
if [ -z "$TARGET_URL" ] || [ "$TARGET_URL" = "/api/v1" ] || [ "$TARGET_URL" = "/api" ]; then
  TARGET_URL="https://abhisaran-api.onrender.com"
fi

# Ensure scheme exists (default to https:// unless localhost/docker service name)
case "$TARGET_URL" in
  http://*|https://*)
    ;;
  localhost*|127.0.0.1*|abhisaran-api:*)
    TARGET_URL="http://${TARGET_URL}"
    ;;
  *)
    TARGET_URL="https://${TARGET_URL}"
    ;;
esac

# Strip any trailing /api/v1, /api, or trailing slashes so TARGET_URL is strictly the origin
TARGET_URL="$(echo "$TARGET_URL" | sed -e 's|/api/v1/*$||' -e 's|/api/*$||' -e 's:/*$::')"

# Extract hostname without protocol and port
TARGET_HOST="$(echo "$TARGET_URL" | sed -e 's|^[^/]*//||' -e 's|/.*$||' -e 's|:.*$||')"

echo "Configuring Nginx backend upstream: $TARGET_URL (Host: $TARGET_HOST)"

sed -i "s|__BACKEND_URL__|${TARGET_URL}|g" /etc/nginx/conf.d/default.conf
sed -i "s|__BACKEND_HOST__|${TARGET_HOST}|g" /etc/nginx/conf.d/default.conf

exec nginx -g "daemon off;"
