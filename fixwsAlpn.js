import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(__dirname, "xray-config.json");

console.log("正在读取 xray-config.json...");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

let modifiedCount = 0;

// 遍历 outbounds 数组
if (config.outbounds && Array.isArray(config.outbounds)) {
  config.outbounds.forEach((outbound, index) => {
    // 检查是否有 streamSettings
    if (outbound.streamSettings) {
      const { streamSettings } = outbound;

      // 检查 network 是否为 "ws" 且存在 tlsSettings
      if (streamSettings.network === "ws" && streamSettings.tlsSettings) {
        const { tlsSettings } = streamSettings;

        // 检查是否有 alpn 字段
        if (tlsSettings.alpn && Array.isArray(tlsSettings.alpn)) {
          const oldAlpn = tlsSettings.alpn;

          // 将 alpn 改为只包含 ["http/1.1"]
          tlsSettings.alpn = ["http/1.1"];

          console.log(`outbound[${index}] 已修改 alpn:`);
          console.log(`  旧值: ${JSON.stringify(oldAlpn)}`);
          console.log(`  新值: ${JSON.stringify(tlsSettings.alpn)}`);

          modifiedCount++;
        }
      }
    }
  });
}

if (modifiedCount > 0) {
  console.log(`\n共修改了 ${modifiedCount} 个 outbound 配置`);
  console.log("正在写入修改后的配置文件...");

  // 写回文件，保持格式化（2空格缩进）
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");

  console.log("✓ 配置文件已更新");
} else {
  console.log("没有找到需要修改的配置");
}
