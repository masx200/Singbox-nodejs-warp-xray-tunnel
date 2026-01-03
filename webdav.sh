##!/bin/bash
set -e

echo "webdav start"

# 从 config.js 读取配置
WEBDAV_PORT=$(node -e "import('./config.js').then(m => console.log(m.getconfig().WEBDAV_PORT))")
WEBDAV_PATH=$(node -e "import('./config.js').then(m => console.log(m.getconfig().WEBDAV_PATH))")
WEBDAV_USERNAME=$(node -e "import('./config.js').then(m => console.log(m.getconfig().WEBDAV_USERNAME))")
WEBDAV_PASSWORD=$(node -e "import('./config.js').then(m => console.log(m.getconfig().WEBDAV_PASSWORD))")

while true; do

    npx -y @masx200/webdav-cli --port "$WEBDAV_PORT" --path="$WEBDAV_PATH" --username="$WEBDAV_USERNAME" --password="$WEBDAV_PASSWORD"

    sleep 10
done
