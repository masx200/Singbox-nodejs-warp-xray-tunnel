#!/usr/bin/env node
import { spawn } from "child_process";
import { config } from "./config.js";
import { downloadXray } from "./downloadXray.js";
import { generateVlessKeys } from "./generateVlessKeys.js";
import { generateVlessSubscription } from "./generateVlessSubscription.js";
import { updateXrayConfig } from "./updateXrayconfig.js";
export { config };
export const vless_port = config().vless_port ?? "20143";

export var vless_selectedAuth = config().vless_selectedAuth ??
  "ML-KEM-768, Post-Quantum";

export const xhttp_host = config().xhttp_host ??
  "6ph52d3svb3e71q.6ph52d3svb3e71q.qzz.io";

export const xhttp_path = config().xhttp_path ??
  "/p7su4vcy2evvtcrvb3d2fcyw8sx62jqrx5s9r7h14d04q46nxv";

// Download xray first (needed for key generation)
downloadXray();

// Generate or load vless keys and UUID
var { vless_uuid, vless_encryption, vless_decryption, vless_selectedAuth } =
  generateVlessKeys();

// Export vless_uuid for other modules to use
export { vless_uuid };

// Update xray config before running scripts
updateXrayConfig({
  vless_uuid,
  vless_encryption,
  vless_decryption,
  vless_selectedAuth,
});
// Download xray before running scripts
const links = generateVlessSubscription("./xray-config.json");

console.log("=== VLESS 订阅链接 ===");
links.forEach((link, index) => {
  console.log(`\n[节点 ${index + 1}]`);
  console.log(link);
});

const scripts = ["warp.sh", "xray.sh", "start.sh", "tunnel.sh"];
for (const script of scripts) {
  const bashProcess = spawn("bash", [script], {
    stdio: "inherit",
    env: {
      HY2_PORT: config().HY2_PORT ?? 20143,

      TUNNEL_TOKEN: config().TUNNEL_TOKEN ??
        "bzqtevdz0gcd0fianl5wrv2rar56jixjzgrkacc8xnx7ge1ub6",
    },
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
