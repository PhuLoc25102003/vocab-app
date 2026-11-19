import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { API_DIR, useE2eDatabase } from './database.mjs';

// Chỉ dùng để dựng tình huống test mà giao diện không tạo được, ví dụ thẻ đã đến hạn.
useE2eDatabase();
const result = spawnSync('npx prisma db execute --stdin', {
  cwd: API_DIR,
  shell: true,
  input: readFileSync(0),
  stdio: ['pipe', 'inherit', 'inherit'],
});
process.exit(result.status ?? 1);
