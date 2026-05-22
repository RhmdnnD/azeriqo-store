import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (user.role === "USER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [accounts, categories] = await Promise.all([
      prisma.account.findMany({
        orderBy: { createdAt: "desc" },
        include: { category: { select: { id: true, name: true } } },
      }),
      prisma.category.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { accounts: true } } },
      }),
    ]);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accounts,
      categories,
    });
  } catch (error) {
    console.error("GET Store Data Error:", error);
    return NextResponse.json({ error: "Failed to fetch store data" }, { status: 500 });
  }
}
