下面是一篇**完整的 Markdown 博客文章**，系统性地分析了
**为什么日志轮转失败**，以及
**如何通过“写入字节计数”而不是“文件大小检查”来彻底修复这个 Bug**。
内容已结合你给出的 `logger.js` 最终代码实现，可直接发布。

---

# 🐛 一次失败的日志轮转：Node.js 中一个经典但隐蔽的 Bug 分析与修复

在 `singbox-nodejs-warp-xray-tunnel`
项目中，我遇到了一个**看似正常、实则长期潜伏的日志轮转 Bug**：

> **日志文件已经超过 `maxLogSize`，但轮转并没有发生。**

本文将从 **问题现象 → 根因分析 → 错误设计 → 正确方案 → 最终实现**
五个层面，完整拆解这个问题。

---

## 一、问题现象

项目中实现了一个简单的日志系统：

- 使用 `fs.createWriteStream` 写入日志
- 配置了：

  - `maxLogSize`
  - `maxLogFiles`
- 期望行为：

  - 当 `app.log` 超过 2MB 时自动轮转为 `app-时间戳.log`

**但实际情况是：**

- 日志文件持续增长
- 即使远超 2MB
- `rotateLogs()` 从未被触发

---

## 二、最初的实现思路（错误但常见）

问题代码的核心逻辑是：

```js
fs.statSync(currentLogPath).size >= maxLogSize;
```

也就是说：

> **依赖文件系统返回的文件大小，来判断是否需要轮转**

这是一个**非常常见，但在 Node.js 中非常危险的设计**。

---

## 三、Bug 的真正原因（核心）

### 1️⃣ `WriteStream` 是有缓冲的

`fs.createWriteStream` 并不是「写一行 → 文件立刻增长」。

实际过程是：

```
log() → write() → 内存 buffer → 系统 flush → 文件大小更新
```

这意味着：

- `stream.write()` 返回时
- **文件大小很可能还没变**
- `fs.statSync()` 得到的是「旧大小」

➡️ **你在检查一个尚未同步的状态**

---

### 2️⃣ “写完再检查文件大小”是逻辑错误

原始设计：

```text
写入日志
↓
stat 文件大小
↓
判断是否轮转
```

问题在于：

- 写入是异步的
- stat 是同步的
- 两者之间 **没有因果保证**

---

### 3️⃣ 日志轮转时没有正确关闭流（隐患）

即使轮转逻辑偶尔被触发：

- 旧的 `WriteStream` 没有 `end()`
- 文件句柄仍然被占用
- Windows 下尤其容易出问题（rename 失败 / 静默失败）

---

## 四、正确的设计思路（关键转变）

### ✅ **不要依赖文件系统**

### ✅ **相信你自己写了多少字节**

> **日志系统最可靠的信息，不是“文件现在多大”， 而是“我刚刚写了多少”。**

---

### 新的核心策略

1. **在内存中维护一个计数器**

```js
let currentLogSize = 0;
```

2. **每次写入前判断是否需要轮转**

```js
if (currentLogSize >= maxLogSize) {
  rotateLogs();
}
```

3. **写入成功后，精确累计字节数**

```js
currentLogSize += Buffer.byteLength(logEntry, "utf8");
```

> 使用 `Buffer.byteLength` 而不是 `string.length` ✅
> 正确处理中文、Emoji、多字节字符

---

## 五、关键修复点拆解

### ✅ 1. 在 `getLogWriteStream()` 初始化真实大小

```js
if (fs.existsSync(currentLogPath)) {
  currentLogSize = fs.statSync(currentLogPath).size;
}
```

保证：

- 重启程序后
- 不会从 0 重新计算

---

### ✅ 2. 轮转时**先关闭流，再重命名**

```js
if (logWriteStream) {
  logWriteStream.end();
  logWriteStream = null;
}
```

这是一个**必须的步骤**：

- 防止文件句柄泄漏
- 确保 Windows / Linux 行为一致
- 让 `renameSync` 成为确定行为

---

### ✅ 3. 写入前轮转，而不是写入后

```js
checkLogRotation();
const stream = getLogWriteStream();
stream.write(logEntry);
```

这样可以保证：

- 单条日志不会“写爆”文件
- 轮转边界可预测

---

## 六、为什么这个 Bug 很隐蔽？

这个问题之所以容易被忽略，是因为：

| 场景        | 结果               |
| ----------- | ------------------ |
| 日志量小    | 永远触发不到       |
| SSD + Linux | 偶尔“看起来没问题” |
| Windows     | 更容易失败         |
| 高并发      | 必现               |

👉 **它不是逻辑错误，而是时序错误**

---

## 七、最终收益

修复后的日志系统具备：

- ✅ 精确的日志大小控制
- ✅ 与文件系统解耦
- ✅ 正确的流生命周期管理
- ✅ 可预测、可测试、可维护

---

## 八、一句话总结

> **日志轮转不是“文件系统问题”，而是“写入语义问题”。**
>
> **永远不要问磁盘“你现在多大”， 而要问自己“我刚刚写了多少”。**

---

如果你愿意，下一步我可以帮你：

- ✨ 把这个 logger 封装成独立 npm 包
- ✨ 支持 gzip 压缩轮转日志
- ✨ 或对接 `pino / winston` 的最佳实践

只要一句话 👍
