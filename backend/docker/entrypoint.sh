#!/bin/sh
set -e

PORT="${PORT:-8080}"

envsubst '${PORT}' < /etc/nginx/http.d/default.conf.template > /etc/nginx/http.d/default.conf

php artisan package:discover --no-interaction 2>/dev/null || true

if [ -n "$APP_KEY" ] && [ "$APP_KEY" != "base64:" ] && [ "$APP_KEY" != "generated" ]; then
    php artisan migrate --force --no-interaction 2>&1 || echo "Migration skipped or failed: continuing startup"
else
    echo "APP_KEY not set or not a valid key. Skipping migrations (will fail if DB init required). Set APP_KEY and redeploy."
fi

php artisan config:clear --no-interaction 2>/dev/null || true
php artisan view:cache --no-interaction 2>/dev/null || true
php artisan storage:link --force --no-interaction 2>/dev/null || true

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
