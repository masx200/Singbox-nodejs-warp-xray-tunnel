import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 日志配置
const LOG_CONFIG = {
  logDir: path.resolve(__dirname, "logs"), // 日志目录
  maxLogSize: 10 * 1024 * 1024, // 最大日志文件大小（10MB）
  maxLogFiles: 10, // 保留的日志文件数量
  currentLog: "app.log", // 当前日志文件名
};

// 确保日志目录存在
function ensureLogDir() {
  if (!fs.existsSync(LOG_CONFIG.logDir)) {
    fs.mkdirSync(LOG_CONFIG.logDir, { recursive: true });
    console.log(`日志目录创建成功: ${LOG_CONFIG.logDir}`);
  }
}

// 获取日志文件路径
function getLogPath(filename) {
  return path.join(LOG_CONFIG.logDir, filename);
}

// 检查并执行日志轮转
function checkLogRotation() {
  const currentLogPath = getLogPath(LOG_CONFIG.currentLog);

  // 如果当前日志文件不存在，无需轮转
  if (!fs.existsSync(currentLogPath)) {
    return;
  }

  const stats = fs.statSync(currentLogPath);

  // 如果日志文件大小超过最大值，执行轮转
  if (stats.size >= LOG_CONFIG.maxLogSize) {
    rotateLogs();
  }
}

// 执行日志轮转
function rotateLogs() {
  const currentLogPath = getLogPath(LOG_CONFIG.currentLog);
  const now = new Date();

  // 生成带时间戳的日志文件名
  const timestamp = now.toISOString().replace(/[:.]/g, "-");
  const archivedLog = `app-${timestamp}.log`;
  const archivedLogPath = getLogPath(archivedLog);

  // 重命名当前日志文件
  fs.renameSync(currentLogPath, archivedLogPath);

  console.log(`日志已轮转: ${archivedLog}`);

  // 清理旧日志文件
  cleanupOldLogs();
}

// 清理旧的日志文件
function cleanupOldLogs() {
  const logDir = LOG_CONFIG.logDir;
  const files = fs.readdirSync(logDir);

  // 过滤出归档的日志文件（app-开头的.log文件）
  const logFiles = files
    .filter((file) => file.startsWith("app-") && file.endsWith(".log"))
    .map((file) => ({
      name: file,
      path: path.join(logDir, file),
      mtime: fs.statSync(path.join(logDir, file)).mtime,
    }))
    .sort((a, b) => b.mtime - a.mtime); // 按修改时间降序排列

  // 如果日志文件数量超过限制，删除最旧的
  while (logFiles.length >= LOG_CONFIG.maxLogFiles) {
    const oldestLog = logFiles.pop();
    fs.unlinkSync(oldestLog.path);
    console.log(`删除旧日志: ${oldestLog.name}`);
  }
}

// 创建写入流
let logWriteStream = null;

function getLogWriteStream() {
  if (!logWriteStream) {
    ensureLogDir();
    const currentLogPath = getLogPath(LOG_CONFIG.currentLog);
    logWriteStream = fs.createWriteStream(currentLogPath, { flags: "a" });
  }
  return logWriteStream;
}

// 格式化日志时间
function formatTime() {
  const now = new Date();
  return now.toISOString().replace("T", " ").substring(0, 19);
}

// 自定义日志输出函数
function log(level, message, ...args) {
  const timestamp = formatTime();
  const formattedMessage = args.length > 0
    ? `${message} ${
      args.map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg) : String(arg)
      ).join(" ")
    }`
    : String(message);

  const logEntry = `[${timestamp}] [${level}] ${formattedMessage}\n`;

  // 输出到控制台
  if (level === "ERROR" || level === "WARN") {
    console[level === "ERROR" ? "error" : "warn"](logEntry.trim());
  } else {
    console.log(logEntry.trim());
  }

  // 写入日志文件
  try {
    const stream = getLogWriteStream();
    stream.write(logEntry);

    // 检查是否需要日志轮转
    checkLogRotation();
  } catch (error) {
    console.error("写入日志文件失败:", error);
  }
}

// 导出日志函数
export function info(message, ...args) {
  log("INFO", message, ...args);
}

export function warn(message, ...args) {
  log("WARN", message, ...args);
}

export function error(message, ...args) {
  log("ERROR", message, ...args);
}

export function debug(message, ...args) {
  log("DEBUG", message, ...args);
}

// 包装console.log和console.error，使其同时写入日志
export function setupConsoleLogging() {
  // 保存原始的console方法
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  // 重写console.log
  console.log = function (...args) {
    originalLog.apply(console, args);
    const message = args.map((arg) =>
      typeof arg === "object" ? JSON.stringify(arg) : String(arg)
    ).join(" ");
    log("INFO", message);
  };

  // 重写console.error
  console.error = function (...args) {
    originalError.apply(console, args);
    const message = args.map((arg) =>
      typeof arg === "object" ? JSON.stringify(arg) : String(arg)
    ).join(" ");
    log("ERROR", message);
  };

  // 重写console.warn
  console.warn = function (...args) {
    originalWarn.apply(console, args);
    const message = args.map((arg) =>
      typeof arg === "object" ? JSON.stringify(arg) : String(arg)
    ).join(" ");
    log("WARN", message);
  };
}

// 关闭日志写入流
export function closeLogStream() {
  if (logWriteStream) {
    logWriteStream.end();
    logWriteStream = null;
  }
}

// 获取日志统计信息
export function getLogStats() {
  ensureLogDir();
  const files = fs.readdirSync(LOG_CONFIG.logDir);
  const logFiles = files.filter((file) => file.endsWith(".log"));

  let totalSize = 0;
  const fileStats = logFiles.map((file) => {
    const filePath = path.join(LOG_CONFIG.logDir, file);
    const stats = fs.statSync(filePath);
    totalSize += stats.size;
    return {
      name: file,
      size: (stats.size / 1024 / 1024).toFixed(2) + " MB",
      mtime: stats.mtime,
    };
  });

  return {
    totalFiles: logFiles.length,
    totalSize: (totalSize / 1024 / 1024).toFixed(2) + " MB",
    files: fileStats,
  };
}

// 初始化日志系统
export function initLogger() {
  ensureLogDir();
  setupConsoleLogging();
  console.log("日志系统已初始化");
  console.log(`日志目录: ${LOG_CONFIG.logDir}`);
  console.log(`最大日志文件大小: ${LOG_CONFIG.maxLogSize / 1024 / 1024} MB`);
  console.log(`保留日志文件数量: ${LOG_CONFIG.maxLogFiles}`);
}

// 手动触发日志轮转（可用于测试或定时任务）
export function manualRotate() {
  console.log("手动触发日志轮转...");
  rotateLogs();
}

export default {
  info,
  warn,
  error,
  debug,
  initLogger,
  closeLogStream,
  getLogStats,
  manualRotate,
};
