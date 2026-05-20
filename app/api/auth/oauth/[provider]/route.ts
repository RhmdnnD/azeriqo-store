import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthorizeUrl, generateState } from "@/lib/oauth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  if (!["google", "discord"].includes(provider)) {
    return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
  }

  const state = generateState();
  const url = getAuthorizeUrl(provider, state);

  if (!url) {
    return NextResponse.json({ error: "OAuth not configured" }, { status: 500 });
  }

  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 5,
    path: "/",
  });

  return NextResponse.redirect(url);
}
