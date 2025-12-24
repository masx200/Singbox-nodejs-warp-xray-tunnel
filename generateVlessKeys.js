import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { v4 as uuidv4 } from "uuid";
// // import { getconfig } from "./config.js";
// var vless_selectedAuth = getconfig().vless_selectedAuth ??
//   "ML-KEM-768, Post-Quantum";

// 生成50位随机字符串（数字和小写字母）
import { generateRandomPath } from "./generateRandomPath.js";

/**
 * Generate vless encryption keys using xray
 */
export function generateVlessKeys(vless_selectedAuth) {
  const cachePath = "./cache.json";

  // Check if cache exists
  if (existsSync(cachePath)) {
    console.log("从缓存读取 vless 配置");
    try {
      const cache = JSON.parse(readFileSync(cachePath, "utf8"));
      return {
        vless_uuid: cache.vless_uuid,
        vless_selectedAuth,
        vless_encryption: cache.vless_encryption,
        vless_decryption: cache.vless_decryption,
        xhttp_path: cache.xhttp_path,
      };
    } catch (error) {
      console.error("读取缓存失败:", error.message);
      console.log("缓存文件已损坏，将生成新的密钥和 UUID");
      // 继续执行，生成新的密钥
    }
  } else {
    console.log("缓存文件不存在，将生成新的密钥和 UUID");
  }

  console.log("生成新的 vless 密钥和 UUID...");

  // Generate random UUID
  const vless_uuid = uuidv4();
  console.log("生成的 UUID:", vless_uuid);

  // Generate random xhttp_path
  const xhttp_path = generateRandomPath();
  console.log("生成的 xhttp_path:", xhttp_path);

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
      vless_uuid,
      vless_encryption,
      vless_decryption,
      vless_selectedAuth,
      xhttp_path,
      generated_at: new Date().toISOString(),
    };
    writeFileSync(cachePath, JSON.stringify(cache, null, 2), "utf8");
    console.log("vless 密钥和 UUID 生成完成并已缓存");

    return {
      vless_uuid,
      vless_encryption,
      vless_decryption,
      vless_selectedAuth,
      xhttp_path,
    };
  } catch (error) {
    console.error("生成 vless 密钥失败:", error.message);
    console.error(error);
    throw error;
  }
}
