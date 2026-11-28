-- AlterTable
ALTER TABLE "User" ALTER COLUMN "dailyGoalXp" SET DEFAULT 100;

-- Mức mục tiêu mới 50 / 100 / 200 / 300 XP (mỗi câu đúng 10 XP). Chuyển theo bậc để người học
-- giữ đúng nhịp đã chọn: Thong thả 10 -> 50, Vừa sức 20 -> 100, Chăm chỉ 50 -> 200.
UPDATE "User" SET "dailyGoalXp" = CASE "dailyGoalXp"
  WHEN 10 THEN 50
  WHEN 20 THEN 100
  WHEN 50 THEN 200
END
WHERE "dailyGoalXp" IN (10, 20, 50);
