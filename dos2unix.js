/**
 * dos2unix.js - 纯 Node.js 实现的行尾符转换工具
 * 不依赖任何外部二进制文件或第三方库
 */

import { readdir, readFile, stat, writeFile } from "fs/promises";
import { join, resolve } from "path";
import { existsSync } from "fs";

/**
 * 转换文本的行尾符
 * @param {string} content - 原始文本内容
 * @param {boolean} toUnix - true: 转换为Unix格式, false: 转换为DOS格式
 * @returns {string} - 转换后的文本内容
 */
export function convertLineEndings(content, toUnix = true) {
  if (toUnix) {
    // DOS to Unix: 将 \r\n 和 \r 都替换为 \n
    return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  } else {
    // Unix to DOS: 先将所有格式统一为 \n，再将 \n 替换为 \r\n
    // 这样可以避免将已有的 \r\n 重复转换成 \r\r\n
    return content
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\n/g, "\r\n");
  }
}

/**
 * 转换单个文件
 * @param {string} filePath - 文件路径
 * @param {boolean} toUnix - 是否转换为 Unix 格式
 * @returns {Promise<void>}
 */
export async function convertFile(filePath, toUnix = true) {
  try {
    const content = await readFile(filePath, "utf8");
    const convertedContent = convertLineEndings(content, toUnix);
    await writeFile(filePath, convertedContent, "utf8");
    return true;
  } catch (error) {
    throw new Error(`转换文件 ${filePath} 失败: ${error.message}`);
  }
}

/**
 * 递归获取目录下所有匹配的文件
 * @param {string} dir - 目录路径
 * @param {string} extension - 文件扩展名（如 'sh'）
 * @returns {Promise<string[]>} - 文件路径数组
 */
async function getFilesRecursively(dir, extension = "sh") {
  const files = [];

  async function traverse(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // 跳过 node_modules 和 .git 目录
        if (entry.name !== "node_modules" && entry.name !== ".git") {
          await traverse(fullPath);
        }
      } else if (entry.isFile()) {
        // 检查文件扩展名
        if (entry.name.endsWith(`.${extension}`)) {
          files.push(fullPath);
        }
      }
    }
  }

  await traverse(dir);
  return files;
}

/**
 * 递归转换目录下所有匹配的文件
 * @param {string} directory - 目录路径
 * @param {string} extension - 文件扩展名（如 'sh'）
 * @param {boolean} toUnix - 是否转换为 Unix 格式
 * @returns {Promise<{success: number, failed: number, errors: Array<string>}>}
 */
export async function convertFilesInDirectory(
  directory = ".",
  extension = "sh",
  toUnix = true,
) {
  const absolutePath = resolve(directory);

  if (!existsSync(absolutePath)) {
    throw new Error(`目录不存在: ${absolutePath}`);
  }

  const stats = await stat(absolutePath);
  if (!stats.isDirectory()) {
    throw new Error(`路径不是目录: ${absolutePath}`);
  }

  const files = await getFilesRecursively(absolutePath, extension);
  const result = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const file of files) {
    try {
      await convertFile(file, toUnix);
      result.success++;
      console.log(`✓ 已转换: ${file}`);
    } catch (error) {
      result.failed++;
      result.errors.push(error.message);
      console.error(`✗ 转换失败: ${file} - ${error.message}`);
    }
  }

  return result;
}

/**
 * 主函数 - 转换目录下所有 .sh 文件
 * @param {string} directory - 目录路径
 * @returns {Promise<void>}
 */
export async function convertShFiles(directory = ".") {
  console.log(
    `正在 "${resolve(directory)}" 中递归查找并转换所有 .sh 文件...\n`,
  );

  const result = await convertFilesInDirectory(directory, "sh", true);

  console.log(`\n转换完成: 成功 ${result.success} 个文件`);
  if (result.failed > 0) {
    console.warn(`失败 ${result.failed} 个文件:`);
    result.errors.forEach((error) => console.warn(`  - ${error}`));
  }

  return result;
}

// 如果直接运行此脚本
if (import.meta.main) {
  const directory = process.argv[2] || ".";
  convertShFiles(directory).catch((err) => {
    console.error("发生错误:", err);
    process.exit(1);
  });
}

export default convertShFiles;
