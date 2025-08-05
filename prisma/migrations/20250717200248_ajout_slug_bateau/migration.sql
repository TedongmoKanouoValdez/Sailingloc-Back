/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Bateau` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Bateau" ADD COLUMN     "slug" TEXT NOT NULL DEFAULT 'sailingloc-slug';

-- CreateIndex
CREATE UNIQUE INDEX "Bateau_slug_key" ON "Bateau"("slug");
