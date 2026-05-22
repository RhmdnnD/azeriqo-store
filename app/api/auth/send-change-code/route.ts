import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!user.email) {
      return NextResponse.json({ error: "No email on account" }, { status: 400 });
    }

    await prisma.verificationCode.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.verificationCode.create({
      data: { userId: user.id, code, expiresAt },
    });

    const sent = await sendVerificationEmail(user.email, code);

    return NextResponse.json({
      message: "Verification code sent",
      ...(sent ? {} : { devCode: code }),
    });
  } catch (error) {
    console.error("Send change code error:", error);
    return NextResponse.json({ error: "Failed to send code" }, { status: 500 });
  }
}
