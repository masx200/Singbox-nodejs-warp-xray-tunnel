import { readFileSync, writeFileSync } from "fs";
import {
  vless_port,
  vless_uuid,
  xhttp_host,
  xhttp_path,
} from "./index.js";

/**
 * Update xray-config.json with vless configuration
 */
export function updateXrayConfig({
  vless_encryption,
  vless_decryption,
  vless_selectedAuth,
}) {
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
