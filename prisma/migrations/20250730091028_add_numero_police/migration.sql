/*
  Warnings:

  - The values [IMAGE,VIDEO,DOCUMENT] on the enum `TypeMedia` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TypeMedia_new" AS ENUM ('COVER', 'GALLERIE', 'ATTESTATION_ASSURANCE', 'CERTIFICAT_NAVIGATION', 'PROFIL');
ALTER TABLE "Media" ALTER COLUMN "type" TYPE "TypeMedia_new" USING ("type"::text::"TypeMedia_new");
ALTER TYPE "TypeMedia" RENAME TO "TypeMedia_old";
ALTER TYPE "TypeMedia_new" RENAME TO "TypeMedia";
DROP TYPE "TypeMedia_old";
COMMIT;

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "numeroPolice" TEXT;
