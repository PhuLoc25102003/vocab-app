-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "leaderboardEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hideFromLeaderboard" BOOLEAN NOT NULL DEFAULT false;
