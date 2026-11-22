-- FoxPrep v2: run once in Neon SQL Editor on an EMPTY database.
-- Then register on the site and make yourself admin:
--   UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';

CREATE TYPE "Role" AS ENUM ('CUSTOMER','ADMIN');
CREATE TYPE "Channel" AS ENUM ('FBA','WFS','FBM');
CREATE TYPE "OrderStatus" AS ENUM ('AWAITING_PAYMENT','AWAITING_INBOUND','RECEIVED','IN_PREP','SHIPPED','COMPLETED','CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('WALLET','STRIPE');
CREATE TYPE "TxType" AS ENUM ('TOPUP','CHARGE','REFUND','ADJUSTMENT');
CREATE TYPE "Provider" AS ENUM ('AMAZON','WALMART');
CREATE TYPE "PhotoKind" AS ENUM ('INBOUND','OUTBOUND');
CREATE TYPE "TicketStatus" AS ENUM ('OPEN','ANSWERED','CLOSED');
CREATE TABLE "User"(id text PRIMARY KEY, email text UNIQUE NOT NULL, "passwordHash" text NOT NULL, name text NOT NULL, company text, phone text, role "Role" NOT NULL DEFAULT 'CUSTOMER', "customerCode" text UNIQUE NOT NULL, "balanceCents" int NOT NULL DEFAULT 0, "termsAcceptedAt" timestamp(3), "createdAt" timestamp(3) NOT NULL DEFAULT now());
CREATE TABLE "MarketplaceConnection"(id text PRIMARY KEY, "userId" text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE, provider "Provider" NOT NULL, "externalId" text NOT NULL, "storeName" text, region text, secret text NOT NULL, "lastSyncAt" timestamp(3), "lastError" text, "createdAt" timestamp(3) NOT NULL DEFAULT now(), UNIQUE("userId",provider,"externalId"));
CREATE TABLE "Product"(id text PRIMARY KEY, "userId" text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE, "connectionId" text REFERENCES "MarketplaceConnection"(id) ON DELETE SET NULL, provider "Provider", title text NOT NULL, sku text NOT NULL, asin text, fnsku text, "imageUrl" text, "marketplaceQty" int, "warehouseQty" int NOT NULL DEFAULT 0, "updatedAt" timestamp(3) NOT NULL, UNIQUE("userId",sku));
CREATE TABLE "Order"(id text PRIMARY KEY, ref text UNIQUE NOT NULL, "userId" text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE, channel "Channel" NOT NULL, status "OrderStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT', units int NOT NULL, cartons int NOT NULL DEFAULT 0, pallets int NOT NULL DEFAULT 0, "fbmOrders" int NOT NULL DEFAULT 0, services jsonb NOT NULL, lines jsonb NOT NULL, "subtotalCents" int NOT NULL, "taxCents" int NOT NULL, "totalCents" int NOT NULL, "paymentMethod" "PaymentMethod", "paidAt" timestamp(3), "stripeSession" text UNIQUE, "supplierName" text, "inboundTracking" text, "outboundTracking" text, "customerNotes" text, "adminNotes" text, "createdAt" timestamp(3) NOT NULL DEFAULT now(), "updatedAt" timestamp(3) NOT NULL);
CREATE TABLE "OrderItem"(id text PRIMARY KEY, "orderId" text NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE, "productId" text REFERENCES "Product"(id) ON DELETE SET NULL, title text NOT NULL, sku text, asin text, fnsku text, url text, quantity int NOT NULL, "receivedQty" int);
CREATE TABLE "OrderEvent"(id text PRIMARY KEY, "orderId" text NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE, status "OrderStatus" NOT NULL, note text, "createdAt" timestamp(3) NOT NULL DEFAULT now());
CREATE TABLE "WalletTransaction"(id text PRIMARY KEY, "userId" text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE, type "TxType" NOT NULL, "amountCents" int NOT NULL, "balanceAfterCents" int NOT NULL, description text NOT NULL, "orderId" text, "stripeSession" text UNIQUE, "createdAt" timestamp(3) NOT NULL DEFAULT now());
CREATE TABLE "OrderPhoto"(id text PRIMARY KEY, "orderId" text NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE, kind "PhotoKind" NOT NULL, url text NOT NULL, "createdAt" timestamp(3) NOT NULL DEFAULT now());
CREATE INDEX "OrderPhoto_orderId_idx" ON "OrderPhoto"("orderId");
CREATE TABLE "Ticket"(id text PRIMARY KEY, ref text UNIQUE NOT NULL, "userId" text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE, "orderId" text REFERENCES "Order"(id) ON DELETE SET NULL, subject text NOT NULL, status "TicketStatus" NOT NULL DEFAULT 'OPEN', "lastMessageAt" timestamp(3) NOT NULL DEFAULT now(), "createdAt" timestamp(3) NOT NULL DEFAULT now());
CREATE INDEX "Ticket_status_lastMessageAt_idx" ON "Ticket"(status, "lastMessageAt");
CREATE INDEX "Ticket_userId_lastMessageAt_idx" ON "Ticket"("userId", "lastMessageAt");
CREATE TABLE "TicketMessage"(id text PRIMARY KEY, "ticketId" text NOT NULL REFERENCES "Ticket"(id) ON DELETE CASCADE, "fromAdmin" boolean NOT NULL DEFAULT false, author text NOT NULL, body text NOT NULL, photos text[] NOT NULL DEFAULT '{}', "createdAt" timestamp(3) NOT NULL DEFAULT now());
CREATE INDEX "TicketMessage_ticketId_createdAt_idx" ON "TicketMessage"("ticketId", "createdAt");
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'AWAITING_LABELS' BEFORE 'SHIPPED';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "boxInfo" TEXT;
DO $$ BEGIN CREATE TYPE "DocKind" AS ENUM ('UNIT_LABELS','BOX_LABELS','CARRIER_LABELS','SHIPPING_LABELS','OTHER'); EXCEPTION WHEN duplicate_object THEN null; END $$;
CREATE TABLE IF NOT EXISTS "OrderDocument" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "kind" "DocKind" NOT NULL,
  "name" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "size" INTEGER NOT NULL DEFAULT 0,
  "fromAdmin" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "OrderDocument_orderId_idx" ON "OrderDocument"("orderId");
