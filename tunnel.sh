#!/bin/bash
set -e

echo "warp start"


cloudflared_url="https://gh-proxy.com/https://github.com/cloudflare/cloudflared/releases/download/2025.11.1/cloudflared-linux-amd64"




# 检查并下载 cloudflared
if [ ! -f "./cloudflared" ]; then
    echo "下载 cloudflared..."

    wget -v -O cloudflared "$cloudflared_core_url"

    chmod +x ./cloudflared
    echo "cloudflared 下载并设置完成"
else
    echo "cloudflared 已存在，跳过下载"
fi





while true; do
    
    
    
    
    ./cloudflared tunnel run
    
    
    
    sleep 10
done