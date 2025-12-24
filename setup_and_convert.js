// setup_and_convert.js

import { exec } from "child_process";
import { promisify } from "util";
import { resolve } from "path";
import { existsSync, mkdirSync } from "fs";
import https from "https";
import http from "http";
import { createWriteStream, createReadStream } from "fs";
import { unlink } from "fs/promises";
import unzipper from "unzipper";

// 将 exec 方法 Promise 化，以便使用 async/await
const execPromise = promisify(exec);

/**
 * 下载文件到本地路径
 * @param {string} url - 下载URL
 * @param {string} destPath - 目标文件路径
 */
async function downloadFile(url, destPath) {
  return new Promise((resolveDownload, rejectDownload) => {
    const protocol = url.startsWith("https") ? https : http;

    protocol
      .get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // 处理重定向
          downloadFile(response.headers.location, destPath)
            .then(resolveDownload)
            .catch(rejectDownload);
          return;
        }

        if (response.statusCode !== 200) {
          rejectDownload(new Error(`下载失败，状态码: ${response.statusCode}`));
          return;
        }

        const fileStream = createWriteStream(destPath);
        response.pipe(fileStream);

        fileStream.on("finish", () => {
          fileStream.close();
          resolveDownload();
        });

        fileStream.on("error", (err) => {
          unlink(destPath).catch(() => {});
          rejectDownload(err);
        });
      })
      .on("error", rejectDownload);
  });
}

/**
 * 解压 zip 文件到指定目录
 * @param {string} zipPath - zip 文件路径
 * @param {string} destDir - 目标目录
 */
async function extractZip(zipPath, destDir) {
  return new Promise((resolveExtract, rejectExtract) => {
    createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: destDir }))
      .on("close", resolveExtract)
      .on("error", rejectExtract);
  });
}

/**
 * 从 CDN 下载并安装 dos2unix 工具
 * 无需 root 权限，直接下载到本地目录
 */
async function installDos2Unix() {
  console.log("正在检查并安装 dos2unix...");

  const dos2unixPath = resolve("./usr/bin/dos2unix");
  const dos2unixZipPath = resolve("dos2unix.zip");
  const usrBinDir = resolve("./usr/bin");

  // 检查 dos2unix 是否已存在
  if (existsSync(dos2unixPath)) {
    console.log("dos2unix 已经存在，跳过安装步骤。");
    return;
  }

  console.log("dos2unix 未找到，开始从 CDN 下载...");

  try {
    // 创建目标目录
    if (!existsSync(usrBinDir)) {
      mkdirSync(usrBinDir, { recursive: true });
      console.log(`创建目录: ${usrBinDir}`);
    }

    // CDN 下载地址
    const downloadUrl =
      "https://cdn.jsdelivr.net/gh/masx200/singbox-nodejs-warp-xray-tunnel@main/dos2unix.zip";

    console.log(`正在从 ${downloadUrl} 下载...`);
    await downloadFile(downloadUrl, dos2unixZipPath);
    console.log("下载完成！");

    console.log(`正在解压到 ${usrBinDir}...`);
    await extractZip(dos2unixZipPath, usrBinDir);
    console.log("解压完成！");

    // 删除下载的 zip 文件
    await unlink(dos2unixZipPath);
    console.log("清理临时文件完成。");

    // 给 dos2unix 添加执行权限（Linux/Unix 系统）
    try {
      await execPromise(`chmod +x "${dos2unixPath}"`);
      console.log("已设置 dos2unix 执行权限。");
    } catch (chmodError) {
      // Windows 系统可能不支持 chmod，忽略错误
      console.log("注意: 无法设置执行权限（可能在 Windows 系统上运行）");
    }

    console.log("dos2unix 安装成功！");
  } catch (installError) {
    console.error("安装 dos2unix 失败。请检查网络连接。");
    console.error("错误详情:", installError.message);
    // 如果安装失败，直接终止程序
    process.exit(1);
  }
}

/**
 * 递归查找并转换指定目录下的所有 .sh 文件
 * @param {string} directory - 要搜索的根目录，默认为当前目录 '.'
 */
async function convertShFiles(directory = ".") {
  // 将相对路径转换为绝对路径，避免路径问题
  const absolutePath = resolve(directory);
  console.log(`正在 "${absolutePath}" 中递归查找并转换所有 .sh 文件...`);

  // 使用本地下载的 dos2unix 路径
  const dos2unixPath = resolve("./usr/bin/dos2unix");

  try {
    // 使用 find 和 xargs 是处理大量文件最高效和最安全的方式
    // -print0 和 -0 配合可以正确处理文件名中包含空格或特殊字符的情况
    const command = `find "${absolutePath}" -type f -name "*.sh" -print0 | xargs -0 "${dos2unixPath}"`;

    const { stdout, stderr } = await execPromise(command);
    console.log({ stdout, stderr });
    console.log("所有 .sh 文件转换完成。");
    // dos2unix 在成功时通常没有输出，所以 stdout 应该是空的
    // if (stdout) console.log('dos2unix 输出:', stdout);
    // if (stderr) console.log('dos2unix 错误/警告:', stderr);
  } catch (error) {
    console.error("转换 .sh 文件时出错。");
    console.error("错误详情:", error.message);
    // 不一定需要终止程序，可以继续执行其他操作
  }
}

/**
 * 主函数，按顺序执行安装和转换任务
 */
async function main() {
  console.log("--- 脚本开始执行 ---");

  // 1. 安装 dos2unix
  await installDos2Unix();

  // 2. 转换 .sh 文件
  // 你可以在这里指定一个特定的目录，例如 await convertShFiles('./my_scripts');
  await convertShFiles(); // 默认处理当前目录

  console.log("--- 脚本执行完毕 ---");
}
if (import.meta.main) {
  // 运行主函数并捕获顶层异常
  main().catch((err) => {
    console.error("脚本运行时发生未捕获的异常:", err);
    process.exit(1);
  });
}
export default main;
