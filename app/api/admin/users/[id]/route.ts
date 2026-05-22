import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current || current.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (id === current.id) {
    return NextResponse.json({ error: "Cannot modify yourself" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const data: Record<string, string> = {};

    if (body.role) {
      if (!["USER", "WORKER"].includes(body.role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      data.role = body.role;
    }

    if (body.password) {
      data.password = hashPassword(body.password);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("PUT Admin User Error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
