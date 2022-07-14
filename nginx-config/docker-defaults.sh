#!/usr/bin/env sh
set -eu

# As of version 1.19, the official Nginx Docker image supports templates with
# variable substitution. But that uses `envsubst`, which does not allow for
# defaults for missing variables. Here, first use the regular command shell
# to set the defaults:
export NGINX_INSTANCE_NAME=${NGINX_INSTANCE_NAME:-defaut}
export NGINX_INSTANCE_PORT=${NGINX_INSTANCE_PORT:-3000}

# Due to `set -u` this would fail if not defined and no default was set above
echo "Will proxy requests for /api/* to ${NGINX_INSTANCE_NAME}*"

# Finally, let the original Nginx entry point do its work, passing whatever is
# set for CMD. Use `exec` to replace the current process, to trap any signals
# (like Ctrl+C) that Docker may send it:
exec /docker-entrypoint.sh "$@"