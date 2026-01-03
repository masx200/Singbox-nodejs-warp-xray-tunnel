##!/bin/bash
set -e

echo "webdav start"

# 从环境变量读取配置(由 index.js 传入)
WEBDAV_PORT=${WEBDAV_PORT:-33333}
WEBDAV_PATH=${WEBDAV_PATH:-/}
WEBDAV_USERNAME=${WEBDAV_USERNAME:-}
WEBDAV_PASSWORD=${WEBDAV_PASSWORD:-}

while true; do

    npx -y @masx200/webdav-cli --port "$WEBDAV_PORT" --path="$WEBDAV_PATH" --username="$WEBDAV_USERNAME" --password="$WEBDAV_PASSWORD"

    sleep 10
done
