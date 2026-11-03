#!/bin/sh
set -e
mkdir -p /data/uploads/products /data/uploads/avatars
chown node:node /data/uploads /data/uploads/products /data/uploads/avatars
exec su-exec node "$@"
