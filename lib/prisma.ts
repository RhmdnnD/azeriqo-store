import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

// Inisialisasi adapter dengan menunjuk file database SQLite lokal Anda
const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' })

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Masukkan adapter tersebut ke dalam parameter PrismaClient
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma