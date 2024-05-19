/*
  Warnings:

  - You are about to drop the column `webAuthnChallengeId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_webAuthnChallengeId_fkey";

-- DropIndex
DROP INDEX "User_webAuthnChallengeId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "webAuthnChallengeId";

-- AlterTable
ALTER TABLE "WebAuthnChallenge" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "WebAuthnChallenge" ADD CONSTRAINT "WebAuthnChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
