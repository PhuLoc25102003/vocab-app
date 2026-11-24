import { Injectable } from '@nestjs/common';

const ONLINE_WINDOW_MS = 15 * 60 * 1000; // 15 phút được coi là đang online

/** Quản lý trạng thái hoạt động online/offline của người dùng theo thời gian thực */
@Injectable()
export class UserPresenceService {
  private readonly lastSeen = new Map<string, number>();

  /** Ghi nhận hoạt động mới nhất của người dùng */
  recordActivity(userId: string): void {
    this.lastSeen.set(userId, Date.now());
  }

  /** Lấy thời điểm hoạt động gần nhất từ bộ nhớ cache */
  getLastActive(userId: string): Date | null {
    const timestamp = this.lastSeen.get(userId);
    return timestamp ? new Date(timestamp) : null;
  }

  /** Kiểm tra xem người dùng có đang online trong vòng 15 phút qua không */
  isOnline(userId: string): boolean {
    const timestamp = this.lastSeen.get(userId);
    if (!timestamp) return false;
    return Date.now() - timestamp < ONLINE_WINDOW_MS;
  }

  /** Lấy danh sách ID của tất cả người dùng đang online */
  getOnlineUserIds(): string[] {
    const now = Date.now();
    const ids: string[] = [];
    for (const [userId, timestamp] of this.lastSeen.entries()) {
      if (now - timestamp < ONLINE_WINDOW_MS) {
        ids.push(userId);
      } else if (now - timestamp > 24 * 60 * 60 * 1000) {
        // Dọn dẹp cache cho các user không hoạt động quá 24h
        this.lastSeen.delete(userId);
      }
    }
    return ids;
  }
}
