import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('仅接受与保存摘要匹配的密码', async () => {
    const encoded = await service.hash('correct horse battery staple');

    await expect(service.verify('correct horse battery staple', encoded)).resolves.toBe(true);
    await expect(service.verify('incorrect password', encoded)).resolves.toBe(false);
  });

  it('同一密码每次使用不同随机盐', async () => {
    const first = await service.hash('correct horse battery staple');
    const second = await service.hash('correct horse battery staple');

    expect(first).not.toBe(second);
  });

  it('拒绝不符合长度范围的密码', async () => {
    await expect(service.hash('short')).rejects.toThrow('密码长度必须为 8 到 128 个字符。');
    await expect(service.hash('a'.repeat(129))).rejects.toThrow('密码长度必须为 8 到 128 个字符。');
  });

  it('对损坏的摘要返回验证失败', async () => {
    await expect(service.verify('any password', 'invalid-hash')).resolves.toBe(false);
  });
});
