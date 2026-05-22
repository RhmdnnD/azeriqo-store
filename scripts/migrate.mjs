import pg from "pg";

const OLD_URL =
  "postgres://1d41ad0d9e830f56d55ef41cd1302c12459bcded24f6d3bc6ce62688818f6ca2:sk_BksPDPNIZr9NUR5HALYUn@db.prisma.io:5432/postgres?sslmode=require";
const NEW_URL =
  "postgres://postgres.eupxptqlxbswoerapaht:fdPvSyNpe0hC8WSO@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?uselibpqcompat=true&sslmode=require";

async function migrate() {
  const old = new pg.Client({
    connectionString: OLD_URL,
    connectionTimeoutMillis: 15000,
  });
  const fresh = new pg.Client({
    connectionString: NEW_URL,
    connectionTimeoutMillis: 15000,
  });
  await old.connect();
  await fresh.connect();
  console.log("Connected to both databases");

  await fresh.query(
    'TRUNCATE "OAuthAccount", "VerificationCode", "Session", "Account", "User", "Category" CASCADE'
  );

  const categories = (await old.query('SELECT * FROM "Category"')).rows;
  for (const c of categories) {
    await fresh.query(
      'INSERT INTO "Category" (id, name, "createdAt", "updatedAt") VALUES ($1,$2,$3,$4)',
      [c.id, c.name, c.createdAt, c.updatedAt]
    );
  }
  console.log(categories.length + " categories migrated");

  const users = (await old.query('SELECT * FROM "User"')).rows;
  for (const u of users) {
    await fresh.query(
      'INSERT INTO "User" (id, name, email, password, role, "emailVerified", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [
        u.id,
        u.name,
        u.email,
        u.password,
        u.role,
        u.emailVerified,
        u.createdAt,
        u.updatedAt,
      ]
    );
  }
  console.log(users.length + " users migrated");

  const accounts = (await old.query('SELECT * FROM "Account"')).rows;
  for (const a of accounts) {
    await fresh.query(
      'INSERT INTO "Account" (id, username, password, status, "categoryId", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [
        a.id,
        a.username,
        a.password,
        a.status,
        a.categoryId,
        a.createdAt,
        a.updatedAt,
      ]
    );
  }
  console.log(accounts.length + " accounts migrated");

  const sessions = (await old.query('SELECT * FROM "Session"')).rows;
  for (const s of sessions) {
    await fresh.query(
      'INSERT INTO "Session" (id, token, "userId", "expiresAt", "lastActiveAt", "createdAt") VALUES ($1,$2,$3,$4,$5,$6)',
      [
        s.id,
        s.token,
        s.userId,
        s.expiresAt,
        s.lastActiveAt || s.createdAt,
        s.createdAt,
      ]
    );
  }
  console.log(sessions.length + " sessions migrated");

  const codes = (await old.query('SELECT * FROM "VerificationCode"')).rows;
  for (const c of codes) {
    await fresh.query(
      'INSERT INTO "VerificationCode" (id, "userId", code, "expiresAt", used, "createdAt") VALUES ($1,$2,$3,$4,$5,$6)',
      [c.id, c.userId, c.code, c.expiresAt, c.used, c.createdAt]
    );
  }
  console.log(codes.length + " verification codes migrated");

  const oauth = (await old.query('SELECT * FROM "OAuthAccount"')).rows;
  for (const o of oauth) {
    await fresh.query(
      'INSERT INTO "OAuthAccount" (id, "userId", provider, "providerId", "createdAt") VALUES ($1,$2,$3,$4,$5)',
      [o.id, o.userId, o.provider, o.providerId, o.createdAt]
    );
  }
  console.log(oauth.length + " oauth accounts migrated");

  await old.end();
  await fresh.end();
  console.log("Migration complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
