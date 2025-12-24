#!/usr/bin/env node
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { getconfig } from "./config.js";
import { downloadXray } from "./downloadXray.js";
import { generateVlessKeys } from "./generateVlessKeys.js";
import { generateVlessSubscription } from "./generateVlessSubscription.js";
import { updateXrayConfig } from "./updateXrayconfig.js";
export { getconfig as config };
export const vless_port = getconfig().vless_port ?? "20143";

export var vless_selectedAuth = getconfig().vless_selectedAuth ??
  "ML-KEM-768, Post-Quantum";

export const xhttp_host = getconfig().xhttp_host ??
  "6ph52d3svb3e71q.6ph52d3svb3e71q.qzz.io";

export const xhttp_path = generateVlessKeys().xhttp_path ??
  "/p7su4vcy2evvtcrvb3d2fcyw8sx62jqrx5s9r7h14d04q46nxv";

// Download xray first (needed for key generation)
downloadXray();

// Generate or load vless keys and UUID
var { vless_uuid, vless_encryption, vless_decryption, vless_selectedAuth } =
  generateVlessKeys(vless_selectedAuth);

// Export vless_uuid for other modules to use
export { vless_uuid };

// Update xray config before running scripts
updateXrayConfig({
  vless_uuid,
  vless_encryption,
  vless_decryption,
  xhttp_path,
  vless_selectedAuth,
});
// Download xray before running scripts
const links = generateVlessSubscription(path.resolve("./xray-config.json"));

console.log("=== VLESS 订阅链接 ===");
links.forEach((link, index) => {
  console.log(`\n[节点 ${index + 1}]`);
  console.log(link);
});
fs.writeFileSync(path.resolve("./vless_subscription.txt"), links.join("\n"), {
  encoding: "utf-8",
});
const scripts = ["warp.sh", "xray.sh", "start.sh", "tunnel.sh"];

// 存储所有进程引用
const processes = new Map();

// 启动脚本的函数
function startScript(script) {
  console.log(`启动脚本: ${script}`);

  const bashProcess = spawn("bash", [script], {
    stdio: "inherit",
    env: {
      HY2_PORT: getconfig().HY2_PORT ?? 20143,

      TUNNEL_TOKEN: getconfig().TUNNEL_TOKEN ??
        "bzqtevdz0gcd0fianl5wrv2rar56jixjzgrkacc8xnx7ge1ub6",
    },
  });

  // 存储进程引用
  processes.set(script, bashProcess);

  bashProcess.on("error", (error) => {
    console.error(`启动 ${script} 失败:`, error);
    // 5秒后重启
    console.log(`5秒后尝试重启 ${script}...`);
    setTimeout(() => startScript(script), 5000);
  });

  bashProcess.on("close", (code) => {
    if (code !== 0) {
      console.error(`${script} 异常退出，退出码: ${code}`);
      // 5秒后重启
      console.log(`5秒后尝试重启 ${script}...`);
      setTimeout(() => startScript(script), 5000);
    } else {
      console.log(`${script} 正常完成`);
      // 正常退出也重启（保持服务运行）
      console.log(`5秒后重启 ${script}...`);
      setTimeout(() => startScript(script), 5000);
    }
  });
}

// 启动所有脚本
for (const script of scripts) {
  startScript(script);
}

// 处理主进程退出信号
process.on("SIGINT", () => {
  console.log("\n收到 SIGINT 信号，正在关闭所有进程...");
  for (const [script, proc] of processes) {
    console.log(`停止 ${script}...`);
    proc.kill();
  }
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n收到 SIGTERM 信号，正在关闭所有进程...");
  for (const [script, proc] of processes) {
    console.log(`停止 ${script}...`);
    proc.kill();
  }
  process.exit(0);
});
