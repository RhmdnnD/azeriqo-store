import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword, verifyPassword, validatePassword } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified?.toISOString() ?? null,
  });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, email, currentPassword, newPassword, verificationCode } = body;

    const hasSensitiveChange = email !== undefined || newPassword !== undefined;

    if (hasSensitiveChange) {
      if (!verificationCode) {
        return NextResponse.json({ error: "Verification code is required" }, { status: 400 });
      }

      const valid = await prisma.verificationCode.findFirst({
        where: {
          userId: user.id,
          code: verificationCode,
          used: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!valid) {
        return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
      }

      // Cleanup used + expired codes for this user
      await prisma.verificationCode.deleteMany({
        where: {
          userId: user.id,
          OR: [
            { id: valid.id },
            { expiresAt: { lt: new Date() } },
            { used: true },
          ],
        },
      });
    }

    const data: Record<string, string> = {};

    if (name !== undefined) {
      data.name = name;
    }

    if (email !== undefined) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== user.id) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
      data.email = email;
    }

    if (newPassword !== undefined) {
      const pwError = validatePassword(newPassword);
      if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 });
      }
      if (!user.password) {
        return NextResponse.json({ error: "Set a password first via Forgot Password" }, { status: 400 });
      }
      if (!verifyPassword(currentPassword, user.password)) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
      }
      data.password = hashPassword(newPassword);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      emailVerified: updated.emailVerified?.toISOString() ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
