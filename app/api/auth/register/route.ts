import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password required" }, { status: 400 });
    }

    const pwError = validatePassword(password);
    if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });

    if (!email.endsWith("@gmail.com")) {
      return NextResponse.json({ error: "Only Gmail addresses are allowed" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const validRoles = ["ADMIN", "WORKER", "USER"];
    const userRole = role && validRoles.includes(role) ? role : "USER";

    // First registered user gets ADMIN role
    const userCount = await prisma.user.count();
    const assignRole = userCount === 0 ? "ADMIN" : userRole;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashPassword(password),
        role: assignRole,
        emailVerified: null,
      },
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: null,
    }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
