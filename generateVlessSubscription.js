import { readFileSync } from "fs";
/**
 * 从 Xray 配置文件生成 VLESS 订阅链接
 * @param {string} configPath - Xray 配置文件路径
 * @returns {string[]} VLESS 订阅链接数组
 */

export function generateVlessSubscription(configPath) {
  // 读取并解析配置文件
  const config = JSON.parse(readFileSync(configPath, "utf8"));

  const vlessLinks = [];

  // 遍历所有 inbound
  for (const inbound of config().inbounds) {
    // 只处理 vless 协议
    if (inbound.protocol !== "vless") continue;

    const settings = inbound.settings || {};
    const streamSettings = inbound.streamSettings || {};

    // 提取基础参数
    const port = inbound.port;
    const security = streamSettings.security || "none";
    const type = streamSettings.network || "tcp";

    // 遍历所有客户端
    for (const client of settings.clients || []) {
      const { id, flow, email } = client;

      // 构建 VLESS URL 参数
      const params = new URLSearchParams();

      if (flow) params.set("flow", flow);
      if (settings.encryption) params.set("encryption", settings.encryption);
      if (settings.decryption) params.set("decryption", settings.decryption);
      params.set("security", security);
      params.set("type", type);

      // 根据传输类型添加特定参数
      if (type === "splithttp" && streamSettings.splithttpSettings) {
        const splithttp = streamSettings.splithttpSettings;
        if (splithttp.host) params.set("host", splithttp.host);
        if (splithttp.path) params.set("path", splithttp.path);

        if (splithttp.mode) params.set("mode", splithttp.mode);
        params.set("type", "xhttp");
      } else if (type === "ws" && streamSettings.wsSettings) {
        const ws = streamSettings.wsSettings;
        if (ws.path) params.set("path", ws.path);
      } else if (type === "grpc" && streamSettings.grpcSettings) {
        const grpc = streamSettings.grpcSettings;
        params.set("serviceName", grpc.serviceName || "");
        params.set("mode", grpc.mode || "gun");
      } else if (type === "http" && streamSettings.httpSettings) {
        const http = streamSettings.httpSettings;
        if (http.host) params.set("host", http.host.join(","));
        if (http.path) params.set("path", http.path.join(","));
      }

      // 如果有 TLS/Reality
      if (security === "tls" && streamSettings.tlsSettings) {
        const tls = streamSettings.tlsSettings;
        params.set("sni", tls.serverName || "");
        params.set("fp", tls.fingerprint || "chrome");
        if (tls.alpn && tls.alpn.length) params.set("alpn", tls.alpn.join(","));
      } else if (security === "reality" && streamSettings.realitySettings) {
        const reality = streamSettings.realitySettings;
        params.set("sni", reality.serverName || "");
        params.set("fp", reality.fingerprint || "chrome");
        params.set("pbk", reality.publicKey || "");
        params.set("sid", reality.shortId || "");
        if (reality.spiderX) params.set("spx", reality.spiderX);
      }

      // 构建 VLESS URI
      const address = streamSettings.network === "splithttp"
        ? streamSettings.splithttpSettings?.host ||
          inbound.listen ||
          "127.0.0.1"
        : inbound.listen || "127.0.0.1";

      const vlessUrl = `vless://${id}@${address}:${port}?${params.toString()}#${
        encodeURIComponent(
          email || "vless",
        )
      }`;
      vlessLinks.push(vlessUrl);
    }
  }

  return vlessLinks;
}
if (import.meta.main) {
  // 使用示例
  try {
    const links = generateVlessSubscription("./xray-config().json");

    console.log("=== VLESS 订阅链接 ===");
    links.forEach((link, index) => {
      console.log(`\n[节点 ${index + 1}]`);
      console.log(link);
    });

    // 也可以输出 base64 格式的订阅内容
    // const base64Links = Buffer.from(links.join("\n")).toString("base64");
    // console.log(`\n=== Base64 订阅内容 ===\n${base64Links}`);
  } catch (error) {
    console.error("处理失败:", error.message);
  }
}
