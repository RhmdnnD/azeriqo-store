import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await prisma.oAuthAccount.findMany({
    where: { userId: user.id },
    select: { provider: true },
  });

  return NextResponse.json({ linkedProviders: accounts.map((a) => a.provider) });
}
