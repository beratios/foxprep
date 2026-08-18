import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.pricingSetting.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  const adminEmail = "admin@foxprep.ca";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const password = await bcrypt.hash("changeme123", 10);
    await prisma.user.create({
      data: { email: adminEmail, password, name: "FoxPrep Admin", role: Role.ADMIN, emailVerified: true },
    });
    console.log(`Seeded admin: ${adminEmail} / changeme123 — change this password after first login.`);
  }

  const staffEmail = "warehouse@foxprep.ca";
  const existingStaff = await prisma.user.findUnique({ where: { email: staffEmail } });
  if (!existingStaff) {
    const password = await bcrypt.hash("changeme123", 10);
    await prisma.user.create({
      data: { email: staffEmail, password, name: "Warehouse Staff", role: Role.STAFF, emailVerified: true },
    });
    console.log(`Seeded staff: ${staffEmail} / changeme123 — change this password after first login.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
