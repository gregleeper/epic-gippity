/*
  Warnings:

  - A unique constraint covering the columns `[model,instanceId]` on the table `Summary` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Summary_model_instanceId_key" ON "Summary"("model", "instanceId");
