/*
  Warnings:

  - Added the required column `userId` to the `Format` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Format" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "output" TEXT NOT NULL,
    "object" TEXT NOT NULL,
    "subObject" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "feedbackId" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Format_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "Feedback" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Format_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Format" ("createdAt", "feedbackId", "id", "instanceId", "object", "output", "subObject", "updatedAt") SELECT "createdAt", "feedbackId", "id", "instanceId", "object", "output", "subObject", "updatedAt" FROM "Format";
DROP TABLE "Format";
ALTER TABLE "new_Format" RENAME TO "Format";
CREATE UNIQUE INDEX "Format_object_subObject_instanceId_key" ON "Format"("object", "subObject", "instanceId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
