/*
  Warnings:

  - Added the required column `subject` to the `LessonPlan` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LessonPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "objective" TEXT NOT NULL,
    "additionalContext" TEXT,
    "standards" TEXT,
    "gradeLevel" TEXT NOT NULL,
    "lessonPlanResponse" TEXT,
    "subject" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "LessonPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LessonPlan" ("additionalContext", "createdAt", "gradeLevel", "id", "lessonPlanResponse", "objective", "standards", "updatedAt", "userId") SELECT "additionalContext", "createdAt", "gradeLevel", "id", "lessonPlanResponse", "objective", "standards", "updatedAt", "userId" FROM "LessonPlan";
DROP TABLE "LessonPlan";
ALTER TABLE "new_LessonPlan" RENAME TO "LessonPlan";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
