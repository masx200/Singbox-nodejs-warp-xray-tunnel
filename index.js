#!/usr/bin/env node
import { spawn } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";

const vless_uuid = "1d5c6d92-9ffd-496a-b11c-bfcfffad6afc";

const vless_port = "20143";


downloadXray();
/* xray.exe  vlessenc
Choose one Authentication to use, do not mix them. Ephemeral key exchange is Post-Quantum safe anyway.

Authentication: X25519, not Post-Quantum
"decryption": "mlkem768x25519plus.native.600s.6D_EgNNkoIUXjkxKIkwWhJihk9yQUqqALQvzQ762FUA"
"encryption": "mlkem768x25519plus.native.0rtt.WqJQPNZVgXJnbyjxBsz4QmIMpQ1xA9PUGInnVaBzIFQ"

Authentication: ML-KEM-768, Post-Quantum
"decryption": "mlkem768x25519plus.native.600s.G272iZot6fUYusTwXnc4Hzd7lLGYI22iuIh5ZGfzhUbbE_27bm-lj6eAGkPZ1KmrQ9Pv3Ypo65a4im1WHX2YSA"
"encryption": "mlkem768x25519plus.native.0rtt.KfG-_Ai76ZGGWSgEZMOhuHM4r-sMJvMGh9wogqQxAQMtZ5ArBHAA2MQwktWEmdq6U4qCXrCdN5i0ArwqciMlqZXEjRkGLQsFFFE00UGnT7IBOQeCR4C8KopY6vZN8_SR-aCDw_c4z1lr5cmLtDSXYrSf9IAmCUEfONO6XQsSlFKbVYUKvIDHrOgjSZotZ8LG4voxDpm0KRwFNKIjeckInKF2bSiZwowxUrC6wPW-TJYiNQNuWbqXPwVCK5R9AVtxtjrK5cJF7atCF_qbNxsybDQtexZCieoVpBOsJLlfn7ud2paX0fI-hICcSQZyGIxlu8RG4UkEzPkrubx5MuY9NgRe_hoBbGO08SiCNep0Hget9QHMruurOdhquUCPk2ok17qU4OQd1gSYrCdRgRnNGXaH6TEjAzZVKJhIrTVmC3ubgeN8bfevEEY2mCyNsze3ZzCgumgmOEAh_bK98eXHQUCFkKEG2Kxdc8Wva-xUdShF68ZGcYlk0ORwlMKH28NbHasX_YhQBUwhukxLCDiL0uQuHkMdwQZwz1ZetJQ4YmUq7VZ9TlVFh4sISuGPswRnv-F0rFOYzDJBgMpn_Jxai-BWvPMRw9JNPSJ11wY0gJQjuOBGLBtkRaVCl9XIeJYfJ5usgZxKuPSs3FkSMuWqTPYU1XFXbZxk0DdBnqib2xe_s-UpX4YH4gxRsrsh1xqAN0ZIXnIgXKQHUMEja8sV0YswnqCyWbXKhBiOffMf1xeiOjh0XIS_a8Es6NImShKvANoVDTqCOwOpzXo-_gQSRkkTgrPME_p2J2UsLbvNsgNLT6Wpp_ZTJHd0gKgGibZf22LCVGSAYXy1gBaReWktTaw40JoaRkcjKXStXFTBgWhFwIsKXigqBdsgevFeTblhFpQ5veK0i0PInydb5VEJjyQcyWSWgmq5muq0XIKZ36FeChOO0DgeluMP2VUjbLWXkwsi4eWwGpQaQXi4_9RfXxLAdVo3zvdUXFkquFZhkbAxiBREgzi2KBgQxGI-GmSngYyyYSdVaQJi1LU0MzpJd1CYL6cGNDNMynMi4KFRmjsqu4Jv3MlWUEdk6BHL7pcJr6wyPlm4AOR5JgJTBRATXHAngnYGFCNbVVHKOsId7BcklbIj6GxhGOxNX7w1zXipufGYmmIp9Qwjn0u9SFLCLmoKF1VzQlx0_gjMscQ11UoVPoyz_tENvCJ7JiYnymcuqalqBTldd4g2WoQ6YHtk3ok-CTekKhqYKQmLlYMIoEALsUXAXkygjKBDbDAHuCYsFiKvedIGagk2ang9WwBJM-xjO_C4s2Y3hvrPZyyH_Nwx_2UBPbkVMSLOVWqYosFMXCIjvqtZ-NK4dyIh9sUsuexnxhWlU0B-8xlsFDWuvXWUfIQyZXMeBKQN6YBwlRyYS8JZmWWAeqRja1illMcKebGJkhkHTDds4PF870GI7KetvOSTvMY3S5k6DhcOqLq-BPAaBHGK9Sx_rXdoQayJ9QWsv5BVZyZ8ofs6fVFoOdA_IpBssetnGht4GFuAg7cEn8cUZoz2OWtoCn0Tmx0PRsliFG-iwm3SG_CgSJUK0CU" */
const vless_encryption =
  "mlkem768x25519plus.native.0rtt.KfG-_Ai76ZGGWSgEZMOhuHM4r-sMJvMGh9wogqQxAQMtZ5ArBHAA2MQwktWEmdq6U4qCXrCdN5i0ArwqciMlqZXEjRkGLQsFFFE00UGnT7IBOQeCR4C8KopY6vZN8_SR-aCDw_c4z1lr5cmLtDSXYrSf9IAmCUEfONO6XQsSlFKbVYUKvIDHrOgjSZotZ8LG4voxDpm0KRwFNKIjeckInKF2bSiZwowxUrC6wPW-TJYiNQNuWbqXPwVCK5R9AVtxtjrK5cJF7atCF_qbNxsybDQtexZCieoVpBOsJLlfn7ud2paX0fI-hICcSQZyGIxlu8RG4UkEzPkrubx5MuY9NgRe_hoBbGO08SiCNep0Hget9QHMruurOdhquUCPk2ok17qU4OQd1gSYrCdRgRnNGXaH6TEjAzZVKJhIrTVmC3ubgeN8bfevEEY2mCyNsze3ZzCgumgmOEAh_bK98eXHQUCFkKEG2Kxdc8Wva-xUdShF68ZGcYlk0ORwlMKH28NbHasX_YhQBUwhukxLCDiL0uQuHkMdwQZwz1ZetJQ4YmUq7VZ9TlVFh4sISuGPswRnv-F0rFOYzDJBgMpn_Jxai-BWvPMRw9JNPSJ11wY0gJQjuOBGLBtkRaVCl9XIeJYfJ5usgZxKuPSs3FkSMuWqTPYU1XFXbZxk0DdBnqib2xe_s-UpX4YH4gxRsrsh1xqAN0ZIXnIgXKQHUMEja8sV0YswnqCyWbXKhBiOffMf1xeiOjh0XIS_a8Es6NImShKvANoVDTqCOwOpzXo-_gQSRkkTgrPME_p2J2UsLbvNsgNLT6Wpp_ZTJHd0gKgGibZf22LCVGSAYXy1gBaReWktTaw40JoaRkcjKXStXFTBgWhFwIsKXigqBdsgevFeTblhFpQ5veK0i0PInydb5VEJjyQcyWSWgmq5muq0XIKZ36FeChOO0DgeluMP2VUjbLWXkwsi4eWwGpQaQXi4_9RfXxLAdVo3zvdUXFkquFZhkbAxiBREgzi2KBgQxGI-GmSngYyyYSdVaQJi1LU0MzpJd1CYL6cGNDNMynMi4KFRmjsqu4Jv3MlWUEdk6BHL7pcJr6wyPlm4AOR5JgJTBRATXHAngnYGFCNbVVHKOsId7BcklbIj6GxhGOxNX7w1zXipufGYmmIp9Qwjn0u9SFLCLmoKF1VzQlx0_gjMscQ11UoVPoyz_tENvCJ7JiYnymcuqalqBTldd4g2WoQ6YHtk3ok-CTekKhqYKQmLlYMIoEALsUXAXkygjKBDbDAHuCYsFiKvedIGagk2ang9WwBJM-xjO_C4s2Y3hvrPZyyH_Nwx_2UBPbkVMSLOVWqYosFMXCIjvqtZ-NK4dyIh9sUsuexnxhWlU0B-8xlsFDWuvXWUfIQyZXMeBKQN6YBwlRyYS8JZmWWAeqRja1illMcKebGJkhkHTDds4PF870GI7KetvOSTvMY3S5k6DhcOqLq-BPAaBHGK9Sx_rXdoQayJ9QWsv5BVZyZ8ofs6fVFoOdA_IpBssetnGht4GFuAg7cEn8cUZoz2OWtoCn0Tmx0PRsliFG-iwm3SG_CgSJUK0CU";
const vless_selectedAuth = "ML-KEM-768, Post-Quantum";
const vless_decryption =
  "mlkem768x25519plus.native.600s.G272iZot6fUYusTwXnc4Hzd7lLGYI22iuIh5ZGfzhUbbE_27bm-lj6eAGkPZ1KmrQ9Pv3Ypo65a4im1WHX2YSA";

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
