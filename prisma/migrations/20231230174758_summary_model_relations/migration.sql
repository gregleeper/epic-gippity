-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Summary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "summary" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonPlanId" TEXT,
    "rubricId" TEXT,
    CONSTRAINT "Summary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Summary_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "LessonPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Summary_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "Rubric" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Summary" ("createdAt", "id", "instanceId", "model", "summary", "updatedAt", "userId") SELECT "createdAt", "id", "instanceId", "model", "summary", "updatedAt", "userId" FROM "Summary";
DROP TABLE "Summary";
ALTER TABLE "new_Summary" RENAME TO "Summary";
CREATE UNIQUE INDEX "Summary_lessonPlanId_key" ON "Summary"("lessonPlanId");
CREATE UNIQUE INDEX "Summary_rubricId_key" ON "Summary"("rubricId");
CREATE UNIQUE INDEX "Summary_model_instanceId_key" ON "Summary"("model", "instanceId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
