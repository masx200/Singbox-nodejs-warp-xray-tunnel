// 生成50位随机字符串（数字和小写字母）
export function generateRandomPath() {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  let result = "/";
  for (let i = 0; i < 50; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
