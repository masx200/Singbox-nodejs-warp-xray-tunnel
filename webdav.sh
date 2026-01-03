##!/bin/bash
set -e

echo "webdav start"

# 从 config.js 读取配置
WEBDAV_PORT=$(npm run config:webdav-port --silent)
WEBDAV_PATH=$(npm run config:webdav-path --silent)
WEBDAV_USERNAME=$(npm run config:webdav-username --silent)
WEBDAV_PASSWORD=$(npm run config:webdav-password --silent)

while true; do

    npx -y @masx200/webdav-cli --port "$WEBDAV_PORT" --path="$WEBDAV_PATH" --username="$WEBDAV_USERNAME" --password="$WEBDAV_PASSWORD"

    sleep 10
done
