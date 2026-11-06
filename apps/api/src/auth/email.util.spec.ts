import { normalizeEmail } from './email.util';

describe('normalizeEmail', () => {
  it('去除首尾空格并将邮箱转换为小写', () => {
    expect(normalizeEmail('  Shopper@Example.COM  ')).toBe('shopper@example.com');
  });

  it('拒绝空邮箱', () => {
    expect(() => normalizeEmail('   ')).toThrow('邮箱不能为空。');
  });
});
