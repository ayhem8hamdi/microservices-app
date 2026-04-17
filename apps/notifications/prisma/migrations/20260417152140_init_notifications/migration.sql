-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER_CONFIRMATION', 'PASSWORD_RESET', 'WELCOME');

-- CreateEnum
CREATE TYPE "NotifStatus" AS ENUM ('SENT', 'FAILED', 'PENDING');

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "payload" JSONB NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "NotifStatus" NOT NULL DEFAULT 'SENT',

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
