import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';

const SALT_BYTES = 16;
const KEY_BYTES = 64;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, KEY_BYTES, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

@Injectable()
export class PasswordService {
  async hash(plain: string): Promise<string> {
    const length = Array.from(plain).length;
    if (length < MIN_PASSWORD_LENGTH || length > MAX_PASSWORD_LENGTH) {
      throw new Error('密码长度必须为 8 到 128 个字符。');
    }

    const salt = randomBytes(SALT_BYTES);
    const derivedKey = await deriveKey(plain, salt);
    return `scrypt$${salt.toString('base64url')}$${derivedKey.toString('base64url')}`;
  }

  async verify(plain: string, encoded: string): Promise<boolean> {
    const [algorithm, saltText, keyText, ...extra] = encoded.split('$');
    if (algorithm !== 'scrypt' || !saltText || !keyText || extra.length > 0 || encoded.length > 256) return false;

    try {
      const salt = Buffer.from(saltText, 'base64url');
      const expected = Buffer.from(keyText, 'base64url');
      if (salt.length !== SALT_BYTES || expected.length !== KEY_BYTES) return false;

      const actual = await deriveKey(plain, salt);
      return timingSafeEqual(actual, expected);
    } catch {
      return false;
    }
  }
}
