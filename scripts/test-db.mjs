import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

try {
  const users = await p.user.findMany();
  console.log("Users found:", users.length);
  for (const u of users) {
    console.log(`  - ${u.email} (role: ${u.role}, verified: ${u.emailVerified ? "yes" : "no"})`);
  }
  const accounts = await p.account.findMany();
  console.log("Accounts found:", accounts.length);
  await p.$disconnect();
} catch (e) {
  console.error("Connection error:", e.message);
  await p.$disconnect();
  process.exit(1);
}
