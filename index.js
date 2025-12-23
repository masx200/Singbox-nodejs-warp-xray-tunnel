#!/usr/bin/env node
import { spawn } from "child_process";
import { readFileSync, writeFileSync } from "fs";

const vless_uuid = "1d5c6d92-9ffd-496a-b11c-bfcfffad6afc";

const vless_port = "20143";

const vless_encryption =
  "mlkem768x25519plus.native.0rtt.qHphLlUiMul5FwpY2qDESGoIDml_R0tLR_S1W7S8UMhjqgnMPWII7zDN7paKvqQdH8mri3c6ePpFWjGqoup6qhutsghHuGK8mjhhvnkPrEwN0Uyr-bKue8cNf0ujzCl4Loys-pgk3FHK62N1bYku9hKfprugd4GJJSF5ttYVrupiu5vL55p_G2pzE3oEaXa-0kTJpQVga-W54emEt1YkTzYV2PF--JN_qndGAPpbGLRwJ1ocsglqdTxGaPs-2tE8diNm5Ja2TnuCItGakHAVxQNZr2Sfp7fNAPVnDQgs1rApwvvK49sxgnNuuXM5jtMqF0EexftN_wgifPS-9skNA8HKdaecpOyoQzJW7VkfzjYQcZsbxdgZcAqLaHZFAZeN1mzF32DFKGwLHEAG4JC9fwgo61IpguEBlHyJmvkZNfagmXh6FLmsOeWf83EL27SoWsyqjUYZJig3Hgcz3pSAKfuMb2GvHcZlzhpKRDOYJFEzb_M3W7IUm3MUR0bFryWqaXIHrnNWpleRaUQjo8d01UZ5VXaM7RQSUXBOk5N241oYxcsifGCzBNxPKHVWjvh8GuNQV0daXyKTBMm5HoRGChPL2DS4PcWfp8askuYN8fEpFVhcf7mZUWxyLFo9lwwl_4Si-8S_q7KjDvdSnqpSfRCOOxpgk1N-lgN1G_A7WrleGNdkEHIySzqIDlLJhPtrx1quuMi4-3AiRyqICVS_OmMy2EOF5TZqd5YnLQwu3FwPrVcp_2SPK_AW1nQyWgaFQ1gr_gB3P5HA5ggZ9vVL9wk6cGvMk6C25LWsMfplOVeBnoNMaMZrNns6K5a1cjckbHxDSHooOuk0J1BUvjEeVXAoU3XHOKFeEdAJ4Wlw6SV00LAmq-E6o5wvaSO7G-if6bOdOGxw6RJ_5Lxgf3EHCiVzZqpXw4YTQLVht0e0zYDJVqc9ohABi3WDcuGFq0auijQb7Kanpfl3lZrD2zBNssE3qsrNtpG62LcxERi1EJelezh8bPlaFHnLxdW77dg_HIeVZbObkopUCEoc9GuZWGYIO-RCkYme3NDA6SIjdhSBvmWrloRxS4luwBQlArA1gOQmsvIC4PJUamXG4QmKk1CBBdouXfCOqhKlFBdEaNkgOqlbEKlC01QlkOeFsTRkvhcDcCijc-a-CcnNLzyvEId9tlhlRJJ5DQlieYS67RYvyScpF7O4EtlWKitOh-uaGYhKv-BNUSFEWkV5HtCSB3Ix-cILcrPFUmpBkWSXBFk0DQG_kvKwVfgUCzmK2VJkrZlq0FaTf9lRR5oTl6WpKrEKk5C-tpzHm-vOjBsu-6mJscHNkAypy-HByyErvrYzIRh1hSI4HgglUsiA57qykDt1ESLCz6tCWTSqQ8M1k2JbOCFLrqGhAdpH4pG-RtFtcmUUykAVpAWXfKmPJrmCK7lzIUiOdCRBU_wBoaZpw7ceHWzMbnYW6kqut_RfSnyLDwFXhYd1gaHETUdKOFcwSqhJ3fqj4zFPvaWAweylFuoRNRE_XjxnBJY3VxpmjkEoOH6eWSbLEQPAlyL6RqKr62vxRS_zvtpxS8ttfYcuHRI";
const vless_selectedAuth = "ML-KEM-768, Post-Quantum";
const vless_decryption =
  "mlkem768x25519plus.native.600s.h5ka3vz-BdLZVV0mzfco0z-aFMOPR5HmvDzqU2fmD4qS6DexZoJltaftOtucWDHobzpomNP93s3ofFeUcxiCww";

const xhttp_host = "6ph52d3svb3e71q.6ph52d3svb3e71q.qzz.io";

const xhttp_path = "/p7su4vcy2evvtcrvb3d2fcyw8sx62jqrx5s9r7h14d04q46nxv";

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
