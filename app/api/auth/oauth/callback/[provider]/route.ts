import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { exchangeCode, getUserFromProvider } from "@/lib/oauth";
import { createSession, getCurrentUser, SESSION_COOKIE, SESSION_DURATION_MS } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const url = new URL(_request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/login?error=oauth_denied", url.origin));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", url.origin));
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;
  cookieStore.delete("oauth_state");

  if (!savedState) {
    return NextResponse.redirect(new URL("/login?error=oauth_expired", url.origin));
  }

  const isLinking = state.startsWith("link:");
  const actualState = isLinking ? state.slice(5) : state;

  if (actualState !== savedState) {
    return NextResponse.redirect(new URL("/login?error=oauth_state", url.origin));
  }

  const tokens = await exchangeCode(provider, code);
  if (!tokens) {
    return NextResponse.redirect(new URL("/login?error=oauth_token", url.origin));
  }

  const providerUser = await getUserFromProvider(provider, tokens.access_token);
  if (!providerUser || !providerUser.email) {
    return NextResponse.redirect(new URL("/login?error=oauth_email", url.origin));
  }

  const existingAccount = await prisma.oAuthAccount.findUnique({
    where: { provider_providerId: { provider, providerId: providerUser.id } },
    include: { user: true },
  });

  if (isLinking) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.redirect(new URL("/login?error=oauth_login_needed", url.origin));
    }
    if (existingAccount) {
      return NextResponse.redirect(new URL("/profile?error=oauth_already_linked", url.origin));
    }
    await prisma.oAuthAccount.create({
      data: { userId: currentUser.id, provider, providerId: providerUser.id },
    });
    return NextResponse.redirect(new URL("/profile?success=oauth_linked", url.origin));
  }

  if (existingAccount) {
    const token = await createSession(existingAccount.user.id);
    const response = NextResponse.redirect(new URL("/store", url.origin));
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION_MS / 1000,
      path: "/",
    });
    return response;
  }

  const existingUser = await prisma.user.findUnique({ where: { email: providerUser.email } });
  let userId: string;

  if (existingUser) {
    await prisma.oAuthAccount.create({
      data: { userId: existingUser.id, provider, providerId: providerUser.id },
    });
    userId = existingUser.id;
  } else {
    const user = await prisma.user.create({
      data: {
        name: providerUser.name,
        email: providerUser.email,
        password: null,
        role: "USER",
        emailVerified: new Date(),
      },
    });
    await prisma.oAuthAccount.create({
      data: { userId: user.id, provider, providerId: providerUser.id },
    });
    userId = user.id;
  }

  const token = await createSession(userId);
  const response = NextResponse.redirect(new URL("/store", url.origin));
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_MS / 1000,
    path: "/",
  });
  return response;
}
