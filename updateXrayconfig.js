import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { vless_port, xhttp_host /* xhttp_path */ } from "./index.js";
// import { getconfig } from path.resolve("./config.js";
/**
 * Update xray-config.json with vless configuration
 */
export function updateXrayConfig({
  vless_uuid,
  vless_encryption,
  vless_decryption,
  xhttp_path,
  vless_selectedAuth,
}) {
  const configPath = path.resolve("./xray-config.json");
  const xrayconfig = JSON.parse(readFileSync(configPath, "utf8"));

  // Find the vless inbound by protocol
  const vlessInbound = xrayconfig.inbounds.find(
    (inbound) => inbound.protocol === "vless",
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
  writeFileSync(configPath, JSON.stringify(xrayconfig, null, 2), "utf8");
  console.log("xray-config.json updated successfully");
}
