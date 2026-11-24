-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('STUDENT', 'TEACHER', 'COORDINATOR');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('PENDING_EMAIL', 'INVITED', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "approval_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "education_level" AS ENUM ('ENSINO_FUNDAMENTAL', 'ENSINO_MEDIO_1_ANO', 'ENSINO_MEDIO_2_ANO', 'ENSINO_MEDIO_3_ANO', 'ENSINO_MEDIO_COMPLETO', 'ENSINO_SUPERIOR_INCOMPLETO', 'ENSINO_SUPERIOR_COMPLETO', 'OUTRO');

-- CreateEnum
CREATE TYPE "school_situation" AS ENUM ('ESTUDANDO', 'COMPLETO');

-- CreateEnum
CREATE TYPE "school_type" AS ENUM ('PUBLICA', 'PRIVADA');

-- CreateEnum
CREATE TYPE "auth_token_type" AS ENUM ('EMAIL_CONFIRMATION', 'PASSWORD_SETUP', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "class_group_status" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "enrollment_status" AS ENUM ('ACTIVE', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "question_source" AS ENUM ('ENEM', 'OTHER_EXAM', 'AUTHORED');

-- CreateEnum
CREATE TYPE "attendance_status" AS ENUM ('PRESENT', 'ABSENT', 'ABSENT_EXCUSED');

-- CreateEnum
CREATE TYPE "essay_status" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role" "user_role" NOT NULL,
    "status" "user_status" NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" VARCHAR(255),
    "phone" VARCHAR(20),
    "email_confirmed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "user_id" UUID NOT NULL,
    "birth_date" DATE NOT NULL,
    "education_level" "education_level" NOT NULL,
    "school_name" VARCHAR(150) NOT NULL,
    "school_situation" "school_situation" NOT NULL,
    "school_type" "school_type",
    "approval_status" "approval_status" NOT NULL DEFAULT 'PENDING',
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "guardians" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "relationship" VARCHAR(50) NOT NULL,
    "contact" VARCHAR(254) NOT NULL,
    "consented_at" TIMESTAMPTZ(3) NOT NULL,
    "policy_version" VARCHAR(20) NOT NULL,

    CONSTRAINT "guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_profiles" (
    "user_id" UUID NOT NULL,
    "qualification" VARCHAR(150),
    "hired_at" DATE,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "auth_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "auth_token_type" NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "allows_essay" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subject_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "school_year" SMALLINT NOT NULL,
    "status" "class_group_status" NOT NULL DEFAULT 'ACTIVE',
    "closed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_subjects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "class_group_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,

    CONSTRAINT "class_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "class_group_id" UUID NOT NULL,
    "status" "enrollment_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subject_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "statement" TEXT NOT NULL,
    "source" "question_source" NOT NULL,
    "exam_year" SMALLINT,
    "source_reference" VARCHAR(200),
    "created_by" UUID NOT NULL,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_id" UUID NOT NULL,
    "file_key" VARCHAR(255) NOT NULL,
    "mime" VARCHAR(100) NOT NULL,
    "position" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "question_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "choices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_id" UUID NOT NULL,
    "letter" CHAR(1) NOT NULL,
    "text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "choices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_lists" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "class_subject_id" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "lesson_date" DATE,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_list_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_list_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "position" SMALLINT NOT NULL,

    CONSTRAINT "question_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "choice_id" UUID NOT NULL,
    "class_group_id" UUID NOT NULL,
    "question_list_id" UUID,
    "is_correct" BOOLEAN NOT NULL,
    "is_first" BOOLEAN NOT NULL DEFAULT false,
    "reset_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roll_calls" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "class_group_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "registered_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roll_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "roll_call_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "status" "attendance_status" NOT NULL,
    "justification" TEXT,
    "excused_by" UUID,
    "excused_at" TIMESTAMPTZ(3),

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "class_subject_id" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "file_key" VARCHAR(255) NOT NULL,
    "mime" VARCHAR(100) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "lesson_date" DATE,
    "uploaded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "essays" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "class_group_id" UUID NOT NULL,
    "theme" VARCHAR(255) NOT NULL,
    "image_key" VARCHAR(255) NOT NULL,
    "status" "essay_status" NOT NULL DEFAULT 'DRAFT',
    "score_c1" SMALLINT,
    "score_c2" SMALLINT,
    "score_c3" SMALLINT,
    "score_c4" SMALLINT,
    "score_c5" SMALLINT,
    "final_score" SMALLINT,
    "general_feedback" TEXT,
    "graded_by" UUID NOT NULL,
    "published_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "essays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "essay_annotations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "essay_id" UUID NOT NULL,
    "x" DECIMAL(6,5) NOT NULL,
    "y" DECIMAL(6,5) NOT NULL,
    "width" DECIMAL(6,5) NOT NULL,
    "height" DECIMAL(6,5) NOT NULL,
    "text" TEXT NOT NULL,
    "competency" SMALLINT,

    CONSTRAINT "essay_annotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");

-- CreateIndex
CREATE INDEX "students_approval_status_idx" ON "students"("approval_status");

-- CreateIndex
CREATE UNIQUE INDEX "guardians_student_id_key" ON "guardians"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_tokens_token_hash_key" ON "auth_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "auth_tokens_user_id_type_idx" ON "auth_tokens"("user_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_name_key" ON "subjects"("name");

-- CreateIndex
CREATE UNIQUE INDEX "topics_subject_id_name_key" ON "topics"("subject_id", "name");

-- CreateIndex
CREATE INDEX "class_subjects_teacher_id_idx" ON "class_subjects"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "class_subjects_class_group_id_subject_id_key" ON "class_subjects"("class_group_id", "subject_id");

-- CreateIndex
CREATE INDEX "enrollments_class_group_id_idx" ON "enrollments"("class_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_student_id_class_group_id_key" ON "enrollments"("student_id", "class_group_id");

-- CreateIndex
CREATE INDEX "questions_subject_id_topic_id_idx" ON "questions"("subject_id", "topic_id");

-- CreateIndex
CREATE INDEX "questions_source_idx" ON "questions"("source");

-- CreateIndex
CREATE UNIQUE INDEX "choices_question_id_letter_key" ON "choices"("question_id", "letter");

-- CreateIndex
CREATE INDEX "question_lists_class_subject_id_idx" ON "question_lists"("class_subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_list_items_question_list_id_question_id_key" ON "question_list_items"("question_list_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_list_items_question_list_id_position_key" ON "question_list_items"("question_list_id", "position");

-- CreateIndex
CREATE INDEX "attempts_student_id_question_id_idx" ON "attempts"("student_id", "question_id");

-- CreateIndex
CREATE INDEX "attempts_question_id_is_first_idx" ON "attempts"("question_id", "is_first");

-- CreateIndex
CREATE INDEX "attempts_class_group_id_idx" ON "attempts"("class_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "roll_calls_class_group_id_date_key" ON "roll_calls"("class_group_id", "date");

-- CreateIndex
CREATE INDEX "attendances_student_id_idx" ON "attendances"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_roll_call_id_student_id_key" ON "attendances"("roll_call_id", "student_id");

-- CreateIndex
CREATE INDEX "materials_class_subject_id_idx" ON "materials"("class_subject_id");

-- CreateIndex
CREATE INDEX "essays_student_id_status_idx" ON "essays"("student_id", "status");

-- CreateIndex
CREATE INDEX "essays_class_group_id_idx" ON "essays"("class_group_id");

-- CreateIndex
CREATE INDEX "essay_annotations_essay_id_idx" ON "essay_annotations"("essay_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "staff_profiles"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_class_group_id_fkey" FOREIGN KEY ("class_group_id") REFERENCES "class_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "staff_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_class_group_id_fkey" FOREIGN KEY ("class_group_id") REFERENCES "class_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "staff_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_images" ADD CONSTRAINT "question_images_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "choices" ADD CONSTRAINT "choices_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_lists" ADD CONSTRAINT "question_lists_class_subject_id_fkey" FOREIGN KEY ("class_subject_id") REFERENCES "class_subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_list_items" ADD CONSTRAINT "question_list_items_question_list_id_fkey" FOREIGN KEY ("question_list_id") REFERENCES "question_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_list_items" ADD CONSTRAINT "question_list_items_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_choice_id_fkey" FOREIGN KEY ("choice_id") REFERENCES "choices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_class_group_id_fkey" FOREIGN KEY ("class_group_id") REFERENCES "class_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_question_list_id_fkey" FOREIGN KEY ("question_list_id") REFERENCES "question_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roll_calls" ADD CONSTRAINT "roll_calls_class_group_id_fkey" FOREIGN KEY ("class_group_id") REFERENCES "class_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roll_calls" ADD CONSTRAINT "roll_calls_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_roll_call_id_fkey" FOREIGN KEY ("roll_call_id") REFERENCES "roll_calls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_excused_by_fkey" FOREIGN KEY ("excused_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_class_subject_id_fkey" FOREIGN KEY ("class_subject_id") REFERENCES "class_subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "staff_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "essays" ADD CONSTRAINT "essays_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "essays" ADD CONSTRAINT "essays_class_group_id_fkey" FOREIGN KEY ("class_group_id") REFERENCES "class_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "essays" ADD CONSTRAINT "essays_graded_by_fkey" FOREIGN KEY ("graded_by") REFERENCES "staff_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "essay_annotations" ADD CONSTRAINT "essay_annotations_essay_id_fkey" FOREIGN KEY ("essay_id") REFERENCES "essays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
