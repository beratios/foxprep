import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@foxprepcenter.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "change-me-now";
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "FoxPrep Admin", role: "ADMIN", customerCode: "FX-0000", passwordHash: await bcrypt.hash(password, 10) },
  });
  console.log(`Admin ready: ${email}`);
}

main().finally(() => prisma.$disconnect());
