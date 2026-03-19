/*
  Warnings:

  - A unique constraint covering the columns `[workspaceId,status,order]` on the table `Task` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "order" SET DEFAULT 0;

-- CreateIndex
CREATE INDEX "Task_workspaceId_status_order_idx" ON "Task"("workspaceId", "status", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Task_workspaceId_status_order_key" ON "Task"("workspaceId", "status", "order");
