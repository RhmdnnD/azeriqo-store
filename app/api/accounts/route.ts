import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: { select: { id: true, name: true } } },
    });
    return NextResponse.json(accounts);
  } catch (error) {
    console.error("GET Accounts Error:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "WORKER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const account = await prisma.account.create({
      data: {
        username: body.username,
        password: body.password,
        status: "available",
        categoryId: body.categoryId || null,
      },
      include: { category: { select: { id: true, name: true } } },
    });
    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error("POST Account Error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
