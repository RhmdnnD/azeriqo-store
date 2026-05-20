import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const url = process.env["TURSO_DATABASE_URL"] || "file:./dev.db";
const authToken = process.env["TURSO_AUTH_TOKEN"];
const adapter = new PrismaLibSql({ url, authToken: authToken || undefined });
const prisma = new PrismaClient({ adapter });

async function main() {
  const count = await prisma.user.count();
  console.log(`Database ready. ${count} user(s) exist. First registration gets ADMIN.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
