-- AlterTable
ALTER TABLE "InboundShipment" ADD COLUMN     "bundleQty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "insertQty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "polybagQty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rateApplied" DOUBLE PRECISION,
ADD COLUMN     "subtotal" DOUBLE PRECISION,
ADD COLUMN     "tax" DOUBLE PRECISION,
ADD COLUMN     "tier" TEXT,
ADD COLUMN     "total" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "OutboundShipment" ALTER COLUMN "tier" DROP NOT NULL,
ALTER COLUMN "rateApplied" DROP NOT NULL,
ALTER COLUMN "subtotal" SET DEFAULT 0,
ALTER COLUMN "tax" SET DEFAULT 0,
ALTER COLUMN "total" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "WalletTransaction" ADD COLUMN     "inboundId" TEXT;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_inboundId_fkey" FOREIGN KEY ("inboundId") REFERENCES "InboundShipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
