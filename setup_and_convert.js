// setup_and_convert.js

import { exec } from "child_process";
import { promisify } from "util";
import { resolve } from "path";

// 将 exec 方法 Promise 化，以便使用 async/await
const execPromise = promisify(exec);

/**
 * 使用 apt-get 安装 dos2unix 工具
 * 注意：此函数需要 root 权限才能运行。
 */
async function installDos2Unix() {
  console.log("正在检查并安装 dos2unix...");
  try {
    // 使用 'which' 检查 dos2unix 是否已安装
    await execPromise("which dos2unix");
    console.log("dos2unix 已经安装，跳过安装步骤。");
  } catch (error) {
    // 'which dos2unix' 失败表示程序未安装，error.code 通常是 1
    console.log("dos2unix 未找到，开始安装...");
    try {
      // -y 标志会自动回答 "yes" 来确认安装
      // 注意：这个命令需要  权限
      const { stdout, stderr } = await execPromise(
        " apt-get update &&  apt-get install -y dos2unix"
      );
      console.log({ stdout, stderr });
      console.log("dos2unix 安装成功！");
      // apt-get 的输出通常在 stderr，即使成功也是如此
      // if (stderr) console.log('安装日志:', stderr);
    } catch (installError) {
      console.error("安装 dos2unix 失败。请检查网络连接和权限。");
      console.error("错误详情:", installError.message);
      // 如果安装失败，直接终止程序
      process.exit(1);
    }
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

  try {
    // 使用 find 和 xargs 是处理大量文件最高效和最安全的方式
    // -print0 和 -0 配合可以正确处理文件名中包含空格或特殊字符的情况
    const command = `find "${absolutePath}" -type f -name "*.sh" -print0 | xargs -0 dos2unix`;

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
