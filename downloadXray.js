import { execSync } from "child_process";
import { existsSync } from "fs";

/**
 * Download xray binary using bash commands
 */
export function downloadXray() {
  const xrayCoreUrl =
    "https://gh-proxy.com/https://github.com/XTLS/Xray-core/releases/download/v25.12.8/Xray-linux-64.zip";

  // Check if xray already exists
  if (existsSync("./xray")) {
    console.log("xray 已存在，跳过下载");
    return;
  }

  console.log("下载 xray...");

  try {
    // Download commands using bash -c
    const commands = [
      `rm -f xray.zip || true`,
      `wget -v -O xray.zip "${xrayCoreUrl}"`,
      `unzip -o xray.zip`,
      `rm xray.zip`,
      `chmod +x ./xray`,
    ];

    // Execute each command synchronously
    for (const cmd of commands) {
      console.log(execSync(cmd, { stdio: "inherit" ,encoding: "utf8" })?.toString());
    }

    console.log("xray 下载并设置完成");
  } catch (error) {
    console.error(error);
    throw new Error(`下载 xray 失败: ${error.message}`);
  }
}
