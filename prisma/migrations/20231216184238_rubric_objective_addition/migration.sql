/*
  Warnings:

  - Added the required column `objective` to the `Rubric` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Rubric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pointScale" INTEGER NOT NULL,
    "customization" TEXT,
    "rubricResponse" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Rubric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Rubric" ("createdAt", "customization", "description", "gradeLevel", "id", "pointScale", "rubricResponse", "title", "updatedAt", "userId") SELECT "createdAt", "customization", "description", "gradeLevel", "id", "pointScale", "rubricResponse", "title", "updatedAt", "userId" FROM "Rubric";
DROP TABLE "Rubric";
ALTER TABLE "new_Rubric" RENAME TO "Rubric";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
