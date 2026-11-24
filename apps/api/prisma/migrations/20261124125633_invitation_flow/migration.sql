/*
  Warnings:

  - The values [EMAIL_CONFIRMATION,PASSWORD_SETUP] on the enum `auth_token_type` will be removed. If these variants are still used in the database, this will fail.
  - The values [ENSINO_FUNDAMENTAL,ENSINO_MEDIO_1_ANO,ENSINO_MEDIO_2_ANO,ENSINO_MEDIO_3_ANO,ENSINO_MEDIO_COMPLETO,ENSINO_SUPERIOR_INCOMPLETO,ENSINO_SUPERIOR_COMPLETO,OUTRO] on the enum `education_level` will be removed. If these variants are still used in the database, this will fail.
  - The values [ESTUDANDO,COMPLETO] on the enum `school_situation` will be removed. If these variants are still used in the database, this will fail.
  - The values [PUBLICA,PRIVADA] on the enum `school_type` will be removed. If these variants are still used in the database, this will fail.
  - The values [PENDING_EMAIL,INVITED] on the enum `user_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `email_confirmed_at` on the `users` table. All the data in the column will be lost.
  - Made the column `password_hash` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "auth_token_type_new" AS ENUM ('PASSWORD_RESET');
ALTER TABLE "auth_tokens" ALTER COLUMN "type" TYPE "auth_token_type_new" USING ("type"::text::"auth_token_type_new");
ALTER TYPE "auth_token_type" RENAME TO "auth_token_type_old";
ALTER TYPE "auth_token_type_new" RENAME TO "auth_token_type";
DROP TYPE "public"."auth_token_type_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "education_level_new" AS ENUM ('HIGH_SCHOOL_1', 'HIGH_SCHOOL_2', 'HIGH_SCHOOL_3', 'HIGH_SCHOOL_COMPLETED', 'HIGHER_ED_INCOMPLETE', 'HIGHER_ED_COMPLETED', 'OTHER');
ALTER TABLE "students" ALTER COLUMN "education_level" TYPE "education_level_new" USING ("education_level"::text::"education_level_new");
ALTER TYPE "education_level" RENAME TO "education_level_old";
ALTER TYPE "education_level_new" RENAME TO "education_level";
DROP TYPE "public"."education_level_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "school_situation_new" AS ENUM ('STUDYING', 'FINISHED');
ALTER TABLE "students" ALTER COLUMN "school_situation" TYPE "school_situation_new" USING ("school_situation"::text::"school_situation_new");
ALTER TYPE "school_situation" RENAME TO "school_situation_old";
ALTER TYPE "school_situation_new" RENAME TO "school_situation";
DROP TYPE "public"."school_situation_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "school_type_new" AS ENUM ('PUBLIC', 'PRIVATE');
ALTER TABLE "students" ALTER COLUMN "school_type" TYPE "school_type_new" USING ("school_type"::text::"school_type_new");
ALTER TYPE "school_type" RENAME TO "school_type_old";
ALTER TYPE "school_type_new" RENAME TO "school_type";
DROP TYPE "public"."school_type_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "user_status_new" AS ENUM ('ACTIVE', 'INACTIVE');
ALTER TABLE "users" ALTER COLUMN "status" TYPE "user_status_new" USING ("status"::text::"user_status_new");
ALTER TYPE "user_status" RENAME TO "user_status_old";
ALTER TYPE "user_status_new" RENAME TO "user_status";
DROP TYPE "public"."user_status_old";
COMMIT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "email_confirmed_at",
ALTER COLUMN "status" SET DEFAULT 'ACTIVE',
ALTER COLUMN "password_hash" SET NOT NULL;

-- CreateTable
CREATE TABLE "invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role" "user_role" NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "invited_by" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "revoked_at" TIMESTAMPTZ(3),
    "user_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_hash_key" ON "invitations"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_user_id_key" ON "invitations"("user_id");

-- CreateIndex
CREATE INDEX "invitations_email_idx" ON "invitations"("email");

-- CreateIndex
CREATE INDEX "invitations_invited_by_idx" ON "invitations"("invited_by");

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "staff_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
