import { randomBytes } from 'node:crypto';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { argon2id, hash, verify } from 'argon2';

/** Mức OWASP khuyến nghị cho argon2id, phù hợp máy chủ ít RAM. */
const HASH_OPTIONS = {
  type: argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} satisfies Parameters<typeof hash>[1];

@Injectable()
export class PasswordService implements OnModuleInit {
  private dummyHash = '';

  async onModuleInit(): Promise<void> {
    this.dummyHash = await this.hash(randomBytes(32).toString('hex'));
  }

  hash(password: string): Promise<string> {
    return hash(password, HASH_OPTIONS);
  }

  /** Không có hash vẫn chạy verify, để thời gian phản hồi không lộ email có tồn tại hay không. */
  async verify(passwordHash: string | null, password: string): Promise<boolean> {
    const matches = await verify(passwordHash ?? this.dummyHash, password);
    return passwordHash !== null && matches;
  }
}
