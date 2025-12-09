-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'organizer', 'admin');

-- CreateEnum
CREATE TYPE "CampaignCategory" AS ENUM ('cultura_arte', 'educacion', 'emergencia', 'igualdad', 'medioambiente', 'salud', 'otros');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'active', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('image', 'video');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('credit_card', 'qr', 'bank_transfer');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('tripto', 'bisa');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('la_paz', 'santa_cruz', 'cochabamba', 'sucre', 'oruro', 'potosi', 'tarija', 'beni', 'pando');

-- CreateEnum
CREATE TYPE "Province" AS ENUM ('murillo', 'omasuyos', 'pacajes', 'camacho', 'larecaja', 'franz_tamayo', 'ingavi', 'los_andes', 'aroma', 'nor_yungas', 'sud_yungas', 'inquisivi', 'loayza', 'caranavi', 'gualberto_villarroel', 'jose_manuel_pando', 'manco_kapac', 'abel_iturralde', 'bautista_saavedra', 'warnes', 'sara', 'ichilo', 'chiquitos', 'sandoval', 'german_busch', 'guarayos', 'cordillera', 'vallegrande', 'florida', 'camiri', 'ignacio_warnes', 'obispo_santiestevan', 'cercado', 'campero', 'ayopaya', 'esteban_arze', 'arque', 'capinota', 'quillacollo', 'jordan', 'punata', 'tiraque', 'carrasco_cochabamba', 'chapare', 'mizque', 'aiquile', 'bolivar_cochabamba', 'tapacare', 'oropeza', 'yamparaez', 'nor_cinti', 'sud_cinti', 'belisario_boeto', 'tomina', 'hernando_siles', 'luis_calvo', 'azurduy', 'cercado_oruro', 'eduardo_avaroa', 'carangas', 'sajama', 'litoral', 'poopo', 'ladislao_cabrera', 'sebastian_pagador', 'tomas_barron', 'sur_carangas', 'mejillones', 'nor_carangas', 'cercado_de_oruro', 'sabaya', 'tomas_frias', 'rafael_bustillo', 'cornelio_saavedra', 'chayanta', 'charcas', 'bernardino_bilbao', 'antonio_quijarro', 'jose_maria_linares', 'nor_lipez', 'sur_lipez', 'daniel_campos', 'modesto_omiste', 'enrique_baldivieso', 'sud_chichas', 'nor_chichas', 'cercado_tarija', 'arce', 'gran_chaco', 'o_connor', 'cercado_beni', 'vaca_diez', 'jose_ballivian', 'yacuma', 'moxos', 'mamore', 'itenez', 'nicolas_suarez', 'manuripi', 'madre_de_dios', 'abuna', 'federico_roman');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('processing', 'completed', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "TransferFrequency" AS ENUM ('monthly_once', 'monthly_twice', 'every_90_days');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('donation_received', 'comment_received', 'campaign_update', 'general_news');

-- CreateEnum
CREATE TYPE "RecipientType" AS ENUM ('tu_mismo', 'otra_persona', 'persona_juridica');

-- CreateTable
CREATE TABLE "profiles" (
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "active_campaigns_count" INTEGER NOT NULL DEFAULT 0,
    "address" TEXT,
    "bio" TEXT,
    "birth_date" DATE NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "identity_number" TEXT NOT NULL,
    "join_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "profile_picture" TEXT,
    "status" "Status" NOT NULL DEFAULT 'active',
    "updated_at" TIMESTAMP(6) NOT NULL,
    "verification_status" BOOLEAN NOT NULL DEFAULT false,
    "id" UUID NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "beneficiaries_description" TEXT NOT NULL,
    "category" "CampaignCategory" NOT NULL,
    "goal_amount" DECIMAL NOT NULL,
    "collected_amount" DECIMAL NOT NULL DEFAULT 0,
    "donor_count" INTEGER NOT NULL DEFAULT 0,
    "percentage_funded" DOUBLE PRECISION NOT NULL,
    "days_remaining" INTEGER NOT NULL,
    "youtube_url" TEXT,
    "end_date" DATE NOT NULL,
    "verification_status" BOOLEAN NOT NULL DEFAULT false,
    "verification_date" TIMESTAMP(6),
    "campaign_status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "status" "Status" NOT NULL DEFAULT 'active',
    "organizer_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "youtube_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "story" VARCHAR(600) NOT NULL,
    "location" "Region" NOT NULL,
    "province" "Province",
    "legal_entity_id" UUID,
    "beneficiary_name" TEXT,
    "beneficiary_reason" TEXT,
    "beneficiary_relationship" TEXT,
    "recipient_type" "RecipientType",

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_verifications" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "request_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approval_date" TIMESTAMP(6),
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "id_document_url" TEXT,
    "supporting_docs_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "campaign_story" TEXT,
    "reference_contact_name" TEXT,
    "reference_contact_email" TEXT,
    "reference_contact_phone" TEXT,
    "status" "Status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "campaign_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_media" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "media_url" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "order_index" INTEGER NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "campaign_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_updates" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "image_url" TEXT,
    "youtube_url" TEXT,

    CONSTRAINT "campaign_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "donor_id" UUID NOT NULL,
    "amount" DECIMAL NOT NULL,
    "predefined_amount" BOOLEAN NOT NULL DEFAULT true,
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "notification_enabled" BOOLEAN NOT NULL DEFAULT false,
    "status" "Status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BOB',
    "payment_provider" TEXT,
    "tripto_payment_id" TEXT,
    "tripto_checkout_url" TEXT,
    "tripto_session_id" TEXT,
    "tip_amount" DECIMAL,
    "total_amount" DECIMAL,
    "bisa_alias" TEXT,
    "bisa_payer_account" TEXT,
    "bisa_payer_document" TEXT,
    "bisa_payer_name" TEXT,
    "bisa_processed_at" TIMESTAMP(3),
    "bisa_qr_expires_at" TIMESTAMP(3),
    "bisa_qr_id" TEXT,
    "bisa_qr_image" TEXT,
    "bisa_transaction_id" TEXT,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_campaigns" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "saved_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "news_updates" BOOLEAN NOT NULL DEFAULT false,
    "campaign_updates" BOOLEAN NOT NULL DEFAULT true,
    "status" "Status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "campaign_id" UUID,
    "donation_id" UUID,
    "comment_id" UUID,
    "status" "Status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_notification_logs" (
    "id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "recipient_count" INTEGER NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "system_notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fund_transfers" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "account_holder_name" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'processing',
    "frequency" "TransferFrequency" NOT NULL DEFAULT 'monthly_once',
    "transfer_date" TIMESTAMP(6),
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "fund_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_entities" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "tax_id" TEXT,
    "registration_number" TEXT,
    "legal_form" TEXT,
    "address" TEXT,
    "city" TEXT,
    "province" "Province",
    "department" "Region",
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "description" TEXT,
    "document_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "status" "Status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "legal_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bisa_tokens" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bisa_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_logs" (
    "id" UUID NOT NULL,
    "paymentProvider" "PaymentProvider" NOT NULL,
    "paymentMethod" "PaymentMethod",
    "paymentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL,
    "metadata" TEXT,
    "campaignId" UUID,
    "donorId" UUID,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_identity_number_key" ON "profiles"("identity_number");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_verifications_campaign_id_key" ON "campaign_verifications"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_legal_entity_id_fkey" FOREIGN KEY ("legal_entity_id") REFERENCES "legal_entities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_verifications" ADD CONSTRAINT "campaign_verifications_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_media" ADD CONSTRAINT "campaign_media_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_updates" ADD CONSTRAINT "campaign_updates_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_donor_id_fkey" FOREIGN KEY ("donor_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_campaigns" ADD CONSTRAINT "saved_campaigns_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_campaigns" ADD CONSTRAINT "saved_campaigns_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_donation_id_fkey" FOREIGN KEY ("donation_id") REFERENCES "donations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_notification_logs" ADD CONSTRAINT "system_notification_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fund_transfers" ADD CONSTRAINT "fund_transfers_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

