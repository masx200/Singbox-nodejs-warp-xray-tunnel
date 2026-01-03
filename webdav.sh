##!/bin/bash
set -e

echo "webdav start"

# 从环境变量读取配置(由 index.js 传入)
WEBDAV_PORT=${WEBDAV_PORT:-33333}
WEBDAV_PATH=${WEBDAV_PATH:-/}
WEBDAV_USERNAME=${WEBDAV_USERNAME:-}
WEBDAV_PASSWORD=${WEBDAV_PASSWORD:-}
echo "WEBDAV_PORT=$WEBDAV_PORT"
echo "WEBDAV_PATH=$WEBDAV_PATH"
echo "WEBDAV_USERNAME=$WEBDAV_USERNAME"
echo "WEBDAV_PASSWORD=$WEBDAV_PASSWORD"
echo "WEBDAV_NODE=$WEBDAV_NODE"

while true; do

  $WEBDAV_NODE  ./node_modules/@masx200/webdav-cli/dist/index.js --port "$WEBDAV_PORT" --path="$WEBDAV_PATH" --username="$WEBDAV_USERNAME" --password="$WEBDAV_PASSWORD"

    sleep 10
done
