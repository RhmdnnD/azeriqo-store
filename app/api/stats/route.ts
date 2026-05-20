import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [available, sold] = await Promise.all([
      prisma.account.count({ where: { status: "available" } }),
      prisma.account.count({ where: { status: "sold" } }),
    ]);
    return NextResponse.json({ available, sold });
  } catch (error) {
    console.error("GET Stats Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
