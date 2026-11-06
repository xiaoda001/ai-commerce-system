export function normalizeEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (!normalized) throw new Error('邮箱不能为空。');
  return normalized;
}
