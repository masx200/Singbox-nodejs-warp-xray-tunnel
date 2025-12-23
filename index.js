#!/usr/bin/env node
import { spawn } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { execSync } from "child_process";

const vless_uuid = "1d5c6d92-9ffd-496a-b11c-bfcfffad6afc";

const vless_port = "20143";

const vless_selectedAuth = "ML-KEM-768, Post-Quantum";

const xhttp_host = "6ph52d3svb3e71q.6ph52d3svb3e71q.qzz.io";

const xhttp_path = "/p7su4vcy2evvtcrvb3d2fcyw8sx62jqrx5s9r7h14d04q46nxv";

/**
 * Download xray binary using bash commands
 */
function downloadXray() {
  const xrayCoreUrl = "https://gh-proxy.com/https://github.com/XTLS/Xray-core/releases/download/v25.12.8/Xray-linux-64.zip";

  // Check if xray already exists
  if (existsSync("./xray")) {
    console.log("xray 已存在，跳过下载");
    return;
  }

  console.log("下载 xray...");

  // Download commands using bash -c
  const commands = [
    `rm -f xray.zip|| true`,
    `wget -v -O xray.zip "${xrayCoreUrl}"`,
    `unzip -o xray.zip`,
    `rm xray.zip`,
    `chmod +x ./xray`
  ];

  for (const cmd of commands) {
    const result = spawn("bash", ["-c", cmd], { stdio: "inherit" });
    const exitCode = result.waitForSync();
    if (exitCode !== 0) {
      throw new Error(`Command failed: ${cmd}`);
    }
  }

  console.log("xray 下载并设置完成");
}

/**
 * Generate vless encryption keys using xray
 */
function generateVlessKeys() {
  const cachePath = "./cache.json";

  // Check if cache exists
  if (existsSync(cachePath)) {
    console.log("从缓存读取 vless 配置");
    const cache = JSON.parse(readFileSync(cachePath, "utf8"));
    return {vless_selectedAuth,
      vless_encryption: cache.vless_encryption,
      vless_decryption: cache.vless_decryption
    };
  }

  console.log("生成新的 vless 密钥...");

  // Generate keys using xray vlessenc command
  try {
    const output = execSync("./xray vlessenc", { encoding: "utf8" });

    // Find the line with ML-KEM-768, Post-Quantum authentication
    const authMarker = "Authentication: ML-KEM-768, Post-Quantum";
    const authIndex = output.indexOf(authMarker);

    if (authIndex === -1) {
      throw new Error("无法在 xray 输出中找到 ML-KEM-768 Post-Quantum 认证");
    }

    // Extract the section after the auth marker
    const section = output.substring(authIndex);

    // Parse encryption and decryption keys from the Post-Quantum section
    const encryptionMatch = section.match(/"encryption":\s*"([^"]+)"/);
    const decryptionMatch = section.match(/"decryption":\s*"([^"]+)"/);

    if (!encryptionMatch || !decryptionMatch) {
      throw new Error("无法从 xray 输出中解析 Post-Quantum 密钥");
    }

    const vless_encryption = encryptionMatch[1];
    const vless_decryption = decryptionMatch[1];

    // Save to cache
    const cache = {
      vless_encryption,
      vless_decryption,
      vless_selectedAuth,
      generated_at: new Date().toISOString()
    };
    writeFileSync(cachePath, JSON.stringify(cache, null, 2), "utf8");
    console.log("vless 密钥生成完成并已缓存");

    return { vless_encryption, vless_decryption,vless_selectedAuth };
  } catch (error) {
    console.error("生成 vless 密钥失败:", error.message);
    throw error;
  }
}

// Download xray first (needed for key generation)
downloadXray();

// Generate or load vless keys
const { vless_encryption, vless_decryption } = generateVlessKeys();

/**
 * Update xray-config.json with vless configuration
 */
function updateXrayConfig() {
  const configPath = "./xray-config.json";
  const config = JSON.parse(readFileSync(configPath, "utf8"));

  // Find the vless inbound by protocol
  const vlessInbound = config.inbounds.find(
    (inbound) => inbound.protocol === "vless"
  );
  if (!vlessInbound) {
    throw new Error("VLESS inbound configuration not found");
  }

  // Update port
  vlessInbound.port = parseInt(vless_port, 10);

  // Update client id
  vlessInbound.settings.clients = [
    { email: "tjtjzynol7rsfvt@123.com", flow: "", id: vless_uuid },
  ];

  // Update encryption settings
  vlessInbound.settings.encryption = vless_encryption;
  vlessInbound.settings.selectedAuth = vless_selectedAuth;
  vlessInbound.settings.decryption = vless_decryption;

  // Update splithttp settings
  vlessInbound.streamSettings.splithttpSettings.host = xhttp_host;
  vlessInbound.streamSettings.splithttpSettings.path = xhttp_path;

  // Write back to file
  writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
  console.log("xray-config.json updated successfully");
}

// Update xray config before running scripts
updateXrayConfig();

// Download xray before running scripts


const scripts = ["warp.sh", "xray.sh", "start.sh"];
for (const script of scripts) {
  const bashProcess = spawn("bash", [script], {
    stdio: "inherit",
    env: { HY2_PORT: 20143 },
  });
  // bashProcess.stdout?.on("data", (data) => {
  //   console.log(`data to start ${script}:`, data);
  // });
  // bashProcess.stderr?.on("data", (data) => {
  //   console.error(`stderr to start ${script}:`, data);
  // });
  bashProcess.on("error", (error) => {
    console.error(`Failed to start ${script}:`, error);
  });

  bashProcess.on("close", (code) => {
    if (code !== 0) {
      console.error(`${script} exited with code ${code}`);
    } else {
      console.log(`${script} completed successfully`);
    }
  });
}
