#!/bin/sh
set -e

# No URL replacement needed - frontend uses relative URLs /api
# which are proxied by nginx

exec "$@"
