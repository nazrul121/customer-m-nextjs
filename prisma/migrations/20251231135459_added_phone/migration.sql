/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `phone` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `account_userId_idx` ON `account`(`userId`(191));

-- CreateIndex
CREATE INDEX `session_userId_idx` ON `session`(`userId`(191));

-- CreateIndex
CREATE UNIQUE INDEX `user_phone_key` ON `user`(`phone`);
