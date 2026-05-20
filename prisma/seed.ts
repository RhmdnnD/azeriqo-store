import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { randomBytes, scryptSync } from "crypto";

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

async function main() {
  const adminEmail = "admin@azeriqo.com";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existing) {
    console.log("Admin user already exists, skipping seed.");
    return;
  }

  await prisma.user.create({
    data: {
      name: "Admin",
      email: adminEmail,
      password: hashPassword("admin123"),
      role: "ADMIN",
    },
  });

  await prisma.user.create({
    data: {
      name: "Worker",
      email: "worker@azeriqo.com",
      password: hashPassword("worker123"),
      role: "WORKER",
    },
  });

  await prisma.user.create({
    data: {
      name: "User",
      email: "user@azeriqo.com",
      password: hashPassword("user123"),
      role: "USER",
    },
  });

  console.log("Seed complete: admin, worker, and user accounts created.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
