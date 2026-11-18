import { Injectable } from '@nestjs/common';
import { argon2id, hash } from 'argon2';

/** Mức OWASP khuyến nghị cho argon2id, phù hợp máy chủ ít RAM. */
const HASH_OPTIONS = {
  type: argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} satisfies Parameters<typeof hash>[1];

@Injectable()
export class PasswordService {
  hash(password: string): Promise<string> {
    return hash(password, HASH_OPTIONS);
  }
}
