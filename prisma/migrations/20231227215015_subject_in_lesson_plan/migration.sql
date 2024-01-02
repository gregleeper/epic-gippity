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
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
