import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

const MAX_CODES_PER_DAY = 5;
const MIN_INTERVAL_MS = 10 * 60 * 1000;

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!user.email) {
      return NextResponse.json({ error: "No email on account" }, { status: 400 });
    }

    // Cleanup expired & used codes
    await prisma.verificationCode.deleteMany({
      where: {
        userId: user.id,
        OR: [
          { expiresAt: { lt: new Date() } },
          { used: true },
        ],
      },
    });

    // Rate limit: max 5 codes in last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await prisma.verificationCode.count({
      where: { userId: user.id, createdAt: { gte: since } },
    });

    if (recentCount >= MAX_CODES_PER_DAY) {
      return NextResponse.json(
        { error: "Maximum 5 verification codes per day. Try again tomorrow." },
        { status: 429 }
      );
    }

    // Rate limit: 10 min gap between codes
    const lastCode = await prisma.verificationCode.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (lastCode) {
      const elapsed = Date.now() - lastCode.createdAt.getTime();
      if (elapsed < MIN_INTERVAL_MS) {
        const waitMinutes = Math.ceil((MIN_INTERVAL_MS - elapsed) / 60000);
        return NextResponse.json(
          { error: `Please wait ${waitMinutes} minute${waitMinutes > 1 ? "s" : ""} before requesting a new code.` },
          { status: 429 }
        );
      }
    }

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
