/*
  Warnings:

  - You are about to drop the column `statement` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the `guardians` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `question_images` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "question_block_type" AS ENUM ('TITLE', 'SUBTITLE', 'TEXT', 'IMAGE', 'SOURCE', 'STATEMENT');

-- DropForeignKey
ALTER TABLE "guardians" DROP CONSTRAINT "guardians_student_id_fkey";

-- DropForeignKey
ALTER TABLE "question_images" DROP CONSTRAINT "question_images_question_id_fkey";

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "statement";

-- DropTable
DROP TABLE "guardians";

-- DropTable
DROP TABLE "question_images";

-- CreateTable
CREATE TABLE "emergency_contacts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "relationship" VARCHAR(50) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "is_guardian" BOOLEAN NOT NULL,

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_blocks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_id" UUID NOT NULL,
    "position" SMALLINT NOT NULL,
    "type" "question_block_type" NOT NULL,
    "text" TEXT,
    "image_key" VARCHAR(255),

    CONSTRAINT "question_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "emergency_contacts_student_id_key" ON "emergency_contacts"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_blocks_question_id_position_key" ON "question_blocks"("question_id", "position");

-- AddForeignKey
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_blocks" ADD CONSTRAINT "question_blocks_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
