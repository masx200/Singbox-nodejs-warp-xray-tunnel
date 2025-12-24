# CLAUDE-CN.md

本文件包含额外的上下文信息，帮助 Claude Code 代理在此代码库中更高效地工作。

## 概述

这是一个 Node.js 项目，实现了使用 sing-box 的网络代理服务，支持多种代理协议（TUIC、Hysteria2 和 Reality）。项目专为低内存环境设计（128MB+ RAM），并包含自动每日重启功能以清除缓存。

## 架构和结构

### 核心组件

1. **index.js** - 主 Node.js 入口点，协调执行 bash 脚本
   - 执行 `warp.sh` 下载并运行 masque-plus 代理工具
   - 执行 `start.sh` 配置并运行 sing-box 多协议服务
   - 下载 xray 核心
   - 生成 VLESS 加密密钥
   - 更新 xray 配置

2. **warp.sh** - 下载并运行代理工具
   - 从 CDN 下载 `masque-plus` 和 `usque` 二进制文件
   - 以无限循环运行 masque-plus，使用特定配置
   - 连接到 Cloudflare WARP 端点 (162.159.198.2:443)

3. **start.sh** - 主配置和服务脚本
   - 根据系统架构下载 sing-box 二进制文件
   - 生成并持久化 UUID 和 Reality 密钥对
   - 创建 SSL 证书（自签名或 OpenSSL 生成）
   - 配置并启动 sing-box 多协议服务
   - 在北京时间 00:03 实现每日自动重启
   - 为客户端生成订阅 URL

4. **h3_fingerprint.go** - HTTP/3 证书指纹提取工具
   - 连接到 HTTP/3 端点并提取 TLS 证书 SHA256 指纹
   - 用于 Hysteria2 协议配置中的证书验证

5. **generateVlessKeys.js** - VLESS 加密密钥生成模块
   - 使用 xray-core 生成 ML-KEM-768 后量子加密密钥
   - 为 VLESS 认证生成随机 UUID
   - 生成随机 50 字符 xhttp_path（数字和小写字母）
   - 实现缓存机制将密钥持久化到 cache.json
   - 如果缓存可用则返回缓存值，否则生成新值

6. **generateRandomPath.js** - 随机路径生成工具
   - 为 xhttp_path 生成 50 字符随机字符串
   - 使用数字 (0-9) 和小写字母 (a-z)
   - 返回以 "/" 开头的路径用于 HTTP 混淆

7. **updateXrayconfig.js** - Xray 配置更新器
   - 使用生成的 VLESS 凭证更新 xray-config.json
   - 集成 vless_uuid、加密密钥和 xhttp_path
   - 支持 ML-KEM-768 后量子认证

8. **downloadXray.js** - Xray 核心二进制下载器
   - 下载平台特定的 xray-core 二进制文件
   - 确保在密钥生成前 xray 可用

9. **generateVlessSubscription.js** - VLESS 订阅 URL 生成器
   - 从 VLESS 配置生成订阅 URL
   - 输出到 vless.txt 供客户端导入
   - 支持标准 VLESS 协议格式

### 协议配置

服务支持三种代理协议：

- **TUIC** - 基于 QUIC 的代理协议，具有拥塞控制 (BBR)
- **Hysteria2** - 高速 UDP 代理，具有伪装功能
- **Reality** - VLESS 协议，具有 TLS 混淆

所有协议共享相同的 UUID 进行认证，并使用自定义 TLS 证书。

## 开发环境

### 前置要求

- Node.js 18+（必需）
- Bash/shell 环境 (Linux/Unix)
- wget 或 curl 用于下载
- OpenSSL（可选，用于更好的证书生成）

### 项目结构

```
/
├── index.js                     # Node.js 主入口文件
├── package.json                 # Node.js 项目配置
├── config.js                    # 配置常量
├── generateVlessKeys.js         # VLESS 密钥生成模块
├── generateRandomPath.js        # 随机路径生成工具
├── updateXrayconfig.js          # Xray 配置更新器
├── downloadXray.js              # Xray 二进制下载器
├── generateVlessSubscription.js # 订阅 URL 生成器
├── warp.sh                      # 代理工具下载和执行
├── start.sh                     # 主服务配置脚本
├── h3_fingerprint.go            # 证书指纹工具
├── go.mod                       # Go 模块依赖
├── .gitignore                   # Git 忽略规则
├── README.md                    # 用户文档
├── CLAUDE.md                    # AI 助手上下文（英文）
├── CLAUDE-CN.md                 # AI 助手上下文（中文）
├── cache.json                   # VLESS 密钥缓存（生成）
├── xray-config.json             # Xray 配置（生成）
├── vless.txt                    # VLESS 订阅 URL（生成）
└── .npm/                        # 运行时目录（运行时创建）
    ├── uuid.txt                 # 持久化 UUID 存储
    ├── key.txt                  # Reality 密钥对存储
    ├── config.json              # sing-box 配置
    ├── list.txt                 # 订阅 URL
    └── sub.txt                  # Base64 编码的订阅
```

### 环境变量

- `TUIC_PORT` - TUIC 协议端口（可选，默认为空）
- `HY2_PORT` - Hysteria2 协议端口（可选，默认为空）
- `REALITY_PORT` - Reality 协议端口（可选，默认为空）

### VLESS 配置

项目现在支持具有高级安全功能的 VLESS 协议：

- **后量子加密**：使用 ML-KEM-768（基于模格的密钥封装机制）
- **动态路径生成**：每次安装生成随机的 50 字符 xhttp_path
- **密钥缓存**：加密密钥和路径缓存到 cache.json 以持久化
- **Xray 集成**：利用 xray-core 的 vlessenc 进行安全密钥生成

**生成的凭证**：
- `vless_uuid`：VLESS 认证的唯一标识符
- `vless_encryption`：加密公钥
- `vless_decryption`：解密私钥
- `xhttp_path`：用于混淆的随机 HTTP 路径（50 字符，a-z0-9）

**配置文件**：
- `xray-config.json`：具有 VLESS 设置的 Xray 核心配置
- `cache.json`：生成密钥和路径的持久化存储
- `vless.txt`：用于客户端导入的订阅 URL

## 常用开发命令

### 运行应用程序

```bash
# 安装依赖（本项目最小依赖）
npm install

# 启动服务
npm start
# 或
node index.js
```

### 开发任务

```bash
# 构建 Go 指纹工具
go build -o h3_fingerprint.exe h3_fingerprint.go

# 运行指纹工具获取证书 SHA256
./h3_fingerprint.exe
```

### 测试协议连接

```bash
# 使用自定义指纹测试 HTTP/3 连接
go run h3_fingerprint.go

# 生成后测试 sing-box 配置
.npm/sing-box check -c .npm/config.json
```

## 关键技术细节

### 端口配置

- 端口可在协议间共享（TCP/UDP）
- index.js 中的默认环境变量：REALITY_PORT=20143, HY2_PORT=20143
- 如果不需要，TUIC 需要空端口来禁用

### 证书管理

- 为没有 OpenSSL 的系统硬编码自签名证书
- OpenSSL 生成的证书使用 "www.bing.com" 作为 CN
- 证书存储在 .npm/ 目录中，权限为 600
- SHA256 指纹提取用于 Hysteria2 固定

### UUID 和密钥持久化

- UUID 生成一次并持久化到 .npm/uuid.txt
- Reality 密钥对生成一次并持久化到 .npm/key.txt
- 两个文件权限均为 600 以确保安全

### VLESS 密钥管理

- 使用 xray-core 的 vlessenc 命令生成 VLESS 密钥
- ML-KEM-768 后量子加密提供前向保密
- 密钥缓存到 cache.json 以在重启间持久化
- xhttp_path 随机生成（50 字符，a-z0-9）用于混淆
- 如果 cache.json 存在，密钥将被重用而不是重新生成
- 删除 cache.json 以强制重新生成所有密钥

### 架构检测和下载

- 自动检测 ARM64、AMD64 和 S390x 架构
- 从架构特定的 URL 下载 sing-box
- 下载的文件使用随机名称以确保安全

### 每日重启机制

- 在北京时间 00:03（UTC+8）自动重启
- 终止并重启 sing-box 进程
- 旨在清除缓存并保持稳定性

### 订阅生成

- 为所有启用的协议生成客户端配置 URL
- Base64 编码的订阅保存到 .npm/sub.txt
- 包括 ISP 信息和协议标识符

## 安全考虑

1. **硬编码凭证** - warp.sh 包含硬编码的 WARP 凭证
2. **权限管理** - 敏感文件使用 600 权限
3. **TLS 配置** - 自签名证书使用 InsecureSkipVerify
4. **进程管理** - 正确的 PID 跟踪以实现优雅重启

## 部署说明

- 专为低内存环境设计（128MB+ RAM）
- 不推荐用于 64MB 环境（如 freecloudpanel）
- 需要出站互联网访问进行下载
- .npm 目录需要持久化存储
- 需要 Bash 环境执行脚本

## 故障排除

### 常见问题

1. **下载失败** - 检查互联网连接和 CDN 可用性
2. **权限错误** - 确保脚本具有执行权限
3. **端口冲突** - 验证端口未被其他服务使用
4. **内存问题** - 在低内存系统上监控 RAM 使用

### 调试命令

```bash
# 检查 sing-box 进程
ps aux | grep sing-box

# 查看生成的配置
cat .npm/config.json

# 检查订阅 URL
cat .npm/list.txt

# 测试单个协议
curl -v --http3 https://[IP]:[PORT]

# 检查 VLESS 密钥缓存
cat cache.json

# 查看 xray 配置
cat xray-config.json

# 查看 VLESS 订阅 URL
cat vless.txt
```

## VLESS 开发指南

### 重新生成密钥

如果需要重新生成所有 VLESS 密钥和路径：

```bash
# 删除缓存文件
rm cache.json

# 重新运行程序
node index.js
```

### 修改路径长度

编辑 [generateRandomPath.js](generateRandomPath.js)：

```javascript
// 修改循环次数以更改路径长度
for (let i = 0; i < 50; i++) {  // 将 50 改为所需长度
  result += chars.charAt(Math.floor(Math.random() * chars.length));
}
```

### 自定义字符集

编辑 [generateRandomPath.js](generateRandomPath.js) 中的 `chars` 变量：

```javascript
const chars = "0123456789abcdefghijklmnopqrstuvwxyz";  // 添加或删除字符
```

## 更新日志

### 最新更新

- 添加了 VLESS 协议支持，具有 ML-KEM-768 后量子加密
- 实现了随机 xhttp_path 生成（50 字符）
- 添加了密钥缓存机制到 cache.json
- 创建了模块化的密钥生成和配置更新系统
- 改进了错误处理和日志记录
- 更新了项目文档
