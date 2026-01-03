#!/usr/bin/env node
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { getconfig } from "./config.js";
import { downloadXray } from "./downloadXray.js";
import { generateVlessKeys } from "./generateVlessKeys.js";
import { generateVlessSubscription } from "./generateVlessSubscription.js";
import { updateXrayConfig } from "./updateXrayconfig.js";
import { closeLogStream, error, info, initLogger, warn } from "./logger.js";
export { getconfig as config };

// 初始化日志系统
initLogger();

import main from "./setup_and_convert.js";
await main();
export const vless_port = getconfig().vless_port ?? "20143";

export var vless_selectedAuth = getconfig().vless_selectedAuth ??
  "ML-KEM-768, Post-Quantum";

export function get_xhttp_host() {
  return getconfig().xhttp_host ?? "**************************************";
}
export const xhttp_path = generateVlessKeys().xhttp_path ??
  "/**************************************************";

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

info("=== VLESS 订阅链接 ===");
links.forEach((link, index) => {
  info(`节点 ${index + 1}: ${link}`);
});
fs.writeFileSync(path.resolve("./vless_subscription.txt"), links.join("\n"), {
  encoding: "utf-8",
});
const scripts = ["warp.sh", "xray.sh", "start.sh", "tunnel.sh", "webdav.sh"];

// 存储所有进程引用
const processes = new Map();

// 启动脚本的函数
function startScript(script) {
  info(`启动脚本: ${script}`);

  const bashProcess = spawn("bash", [script], {
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      HY2_PORT: getconfig().HY2_PORT ?? 20143,
      TUNNEL_TOKEN: getconfig().TUNNEL_TOKEN ??
        "**************************************************",
      WEBDAV_PORT: getconfig().WEBDAV_PORT ?? 33333,
      WEBDAV_PATH: getconfig().WEBDAV_PATH ?? "/",
      WEBDAV_USERNAME: getconfig().WEBDAV_USERNAME ?? "",
      WEBDAV_PASSWORD: getconfig().WEBDAV_PASSWORD ?? "",
    },
  });

  // 存储进程引用
  processes.set(script, bashProcess);

  // 用于累积输出行的缓冲区
  let stdoutBuffer = "";
  let stderrBuffer = "";

  // 处理子进程 stdout 输出
  bashProcess.stdout.on("data", (data) => {
    const text = data.toString();
    stdoutBuffer += text;

    // 按行处理日志
    let lineIndex;
    while ((lineIndex = stdoutBuffer.indexOf("\n")) !== -1) {
      const line = stdoutBuffer.substring(0, lineIndex + 1);
      stdoutBuffer = stdoutBuffer.substring(lineIndex + 1);

      // 输出到控制台和日志
      process.stdout.write(`[${script}] ${line}`);
      info(`[${script}] ${line.trimEnd()}`);
    }
  });

  // 处理子进程 stderr 输出
  bashProcess.stderr.on("data", (data) => {
    const text = data.toString();
    stderrBuffer += text;

    // 按行处理日志
    let lineIndex;
    while ((lineIndex = stderrBuffer.indexOf("\n")) !== -1) {
      const line = stderrBuffer.substring(0, lineIndex + 1);
      stderrBuffer = stderrBuffer.substring(lineIndex + 1);

      // 输出到控制台和日志（作为错误）
      process.stderr.write(`[${script}] ${line}`);
      error(`[${script}] ${line.trimEnd()}`);
    }
  });

  bashProcess.on("error", (err) => {
    error(`启动 ${script} 失败: ${err.message}`);
    // 5秒后重启
    warn(`5秒后尝试重启 ${script}...`);
    setTimeout(() => startScript(script), 5000);
  });

  bashProcess.on("close", (code) => {
    // 处理缓冲区中剩余的输出
    if (stdoutBuffer.trim()) {
      process.stdout.write(`[${script}] ${stdoutBuffer}`);
      info(`[${script}] ${stdoutBuffer.trimEnd()}`);
    }
    if (stderrBuffer.trim()) {
      process.stderr.write(`[${script}] ${stderrBuffer}`);
      error(`[${script}] ${stderrBuffer.trimEnd()}`);
    }

    if (code !== 0) {
      error(`${script} 异常退出，退出码: ${code}`);
      // 5秒后重启
      warn(`5秒后尝试重启 ${script}...`);
      setTimeout(() => startScript(script), 5000);
    } else {
      info(`${script} 正常完成`);
      // 正常退出也重启（保持服务运行）
      info(`5秒后重启 ${script}...`);
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
  info("收到 SIGINT 信号，正在关闭所有进程...");
  for (const [script, proc] of processes) {
    info(`停止 ${script}...`);
    proc.kill();
  }
  closeLogStream();
  process.exit(0);
});

process.on("SIGTERM", () => {
  info("收到 SIGTERM 信号，正在关闭所有进程...");
  for (const [script, proc] of processes) {
    info(`停止 ${script}...`);
    proc.kill();
  }
  closeLogStream();
  process.exit(0);
});
