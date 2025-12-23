#!/bin/bash
set -e

echo "xray start"


xray_core_url="https://gh-proxy.com/https://github.com/XTLS/Xray-core/releases/download/v25.12.8/Xray-linux-64.zip"




# 检查并下载 xray
if [ ! -f "./xray" ]; then
    echo "下载 xray..."
    rm xray.zip || true
    wget -v -O xray.zip "$xray_core_url"
    unzip -o xray.zip
    rm xray.zip
    chmod +x ./xray
    echo "xray 下载并设置完成"
else
    echo "xray 已存在，跳过下载"
fi



while true; do
    
    
    
    
    ./xray run -c xray-config.json
    
    
    
    sleep 10
done