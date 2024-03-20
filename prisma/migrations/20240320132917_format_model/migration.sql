-- CreateTable
CREATE TABLE "Format" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "output" TEXT NOT NULL,
    "object" TEXT NOT NULL,
    "subObject" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "feedbackId" TEXT,
    CONSTRAINT "Format_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "Feedback" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Format_object_subObject_instanceId_key" ON "Format"("object", "subObject", "instanceId");
