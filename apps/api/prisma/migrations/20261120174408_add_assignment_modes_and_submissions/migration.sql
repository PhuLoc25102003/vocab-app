-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "modes" "StudyMode"[] DEFAULT ARRAY[]::"StudyMode"[];

-- AlterTable
ALTER TABLE "StudySession" ADD COLUMN     "assignmentId" TEXT;

-- CreateTable
CREATE TABLE "AssignmentSubmission" (
    "assignmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER,
    "late" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AssignmentSubmission_pkey" PRIMARY KEY ("assignmentId","userId")
);

-- CreateIndex
CREATE INDEX "AssignmentSubmission_userId_idx" ON "AssignmentSubmission"("userId");

-- CreateIndex
CREATE INDEX "StudySession_assignmentId_userId_idx" ON "StudySession"("assignmentId", "userId");

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: bài giao cũ có một chế độ.
UPDATE "Assignment" SET "modes" = ARRAY["mode"] WHERE cardinality(COALESCE("modes", ARRAY[]::"StudyMode"[])) = 0;

-- Backfill: học sinh đã xong phiên đúng bộ và chế độ sau khi giao được tính là đã nộp lúc xong lần đầu,
-- điểm là phiên tốt nhất (Flashcard không chấm điểm), trễ khi xong sau hạn.
INSERT INTO "AssignmentSubmission" ("assignmentId", "userId", "submittedAt", "score", "late")
SELECT a."id", m."userId", x."finished",
       CASE WHEN a."mode" = 'FLASHCARD' THEN NULL ELSE x."score" END,
       a."dueAt" IS NOT NULL AND x."finished" > a."dueAt"
FROM "Assignment" a
JOIN "ClassMember" m ON m."classId" = a."classId"
JOIN LATERAL (
  SELECT min(s."finishedAt") AS "finished",
         max(CASE WHEN s."total" > 0 THEN round(s."correct" * 100.0 / s."total") END)::int AS "score"
  FROM "StudySession" s
  WHERE s."userId" = m."userId" AND s."setId" = a."setId" AND s."mode" = a."mode"
    AND s."finishedAt" IS NOT NULL AND s."finishedAt" >= a."createdAt"
) x ON x."finished" IS NOT NULL
ON CONFLICT DO NOTHING;
