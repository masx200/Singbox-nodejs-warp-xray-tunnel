// setup_and_convert.js

import convertShFiles from "./dos2unix.js";

/**
 * 主函数 - 转换所有 .sh 文件
 */
async function main() {
  console.log("--- 脚本开始执行 ---");
  console.log("使用纯 Node.js 实现的 dos2unix 进行转换");

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
