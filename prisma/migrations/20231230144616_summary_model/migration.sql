/*
  Warnings:

  - You are about to drop the column `summarizedLessonPlan` on the `LessonPlan` table. All the data in the column will be lost.
  - You are about to drop the column `summarizedSupportingText` on the `SupportingText` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Summary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "summary" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Summary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LessonPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "objective" TEXT NOT NULL,
    "additionalContext" TEXT,
    "standards" TEXT,
    "gradeLevel" TEXT NOT NULL,
    "lessonPlanResponse" TEXT,
    "subject" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "LessonPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LessonPlan" ("additionalContext", "createdAt", "gradeLevel", "id", "lessonPlanResponse", "objective", "standards", "subject", "updatedAt", "userId") SELECT "additionalContext", "createdAt", "gradeLevel", "id", "lessonPlanResponse", "objective", "standards", "subject", "updatedAt", "userId" FROM "LessonPlan";
DROP TABLE "LessonPlan";
ALTER TABLE "new_LessonPlan" RENAME TO "LessonPlan";
CREATE TABLE "new_SupportingText" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prompt" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "textResponse" TEXT NOT NULL,
    "lessonPlanId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "SupportingText_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SupportingText_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "LessonPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SupportingText" ("createdAt", "gradeLevel", "id", "lessonPlanId", "prompt", "subject", "textResponse", "updatedAt", "userId") SELECT "createdAt", "gradeLevel", "id", "lessonPlanId", "prompt", "subject", "textResponse", "updatedAt", "userId" FROM "SupportingText";
DROP TABLE "SupportingText";
ALTER TABLE "new_SupportingText" RENAME TO "SupportingText";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "Summary_userId_key" ON "Summary"("userId");
