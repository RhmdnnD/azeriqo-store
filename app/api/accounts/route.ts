import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(accounts);
  } catch (error) {
    console.error("GET Accounts Error:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const account = await prisma.account.create({
      data: {
        name: body.name,
        username: body.username,
        password: body.password,
        status: "available",
      },
    });
    return NextResponse.json(account);
  } catch (error) {
    console.error("POST Account Error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
