#!/bin/bash
set -e

echo "tunnel start"


cloudflared_url="https://gh-proxy.com/https://github.com/cloudflare/cloudflared/releases/download/2025.11.1/cloudflared-linux-amd64"




# 检查并下载 cloudflared
if [ ! -f "./cloudflared" ]; then
    echo "下载 cloudflared..."

    wget -v -O cloudflared "$cloudflared_url"

    chmod +x ./cloudflared
    echo "cloudflared 下载并设置完成"
else
    # 检查文件大小
    file_size=$(stat -c%s "./cloudflared" 2>/dev/null || stat -f%z "./cloudflared" 2>/dev/null || echo "0")
    if [ "$file_size" -eq 0 ]; then
        echo "cloudflared 文件大小为0，删除并重新下载..."
        rm -f ./cloudflared
        wget -v -O cloudflared "$cloudflared_url"
        chmod +x ./cloudflared
        echo "cloudflared 重新下载完成"
    else
        echo "cloudflared 已存在且文件正常 (大小: $file_size bytes)，跳过下载"
    fi
fi





while true; do




    ./cloudflared tunnel run --protocol http2



    sleep 10
done
