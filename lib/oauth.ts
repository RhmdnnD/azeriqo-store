import { randomBytes } from "crypto";

const providerConfigs: Record<string, { authorizeUrl: string; tokenUrl: string; userUrl: string; scope: string; mapUser: (data: Record<string, unknown>) => { id: string; email: string; name: string } }> = {
  google: {
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
    scope: "openid email profile",
    mapUser: (data) => ({ id: String(data.id), email: String(data.email), name: String(data.name) }),
  },
  discord: {
    authorizeUrl: "https://discord.com/api/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    userUrl: "https://discord.com/api/users/@me",
    scope: "identify email",
    mapUser: (data) => ({ id: String(data.id), email: String(data.email), name: String(data.global_name || data.username || "") }),
  },
};

export function getOAuthConfig(provider: string) {
  const config = providerConfigs[provider];
  if (!config) return null;

  const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
  const clientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];

  if (!clientId || !clientSecret) return null;

  return { ...config, clientId, clientSecret };
}

export function getRedirectUri(provider: string): string {
  const baseUrl = process.env["NEXT_PUBLIC_URL"] || "http://localhost:3000";
  return `${baseUrl}/api/auth/oauth/callback/${provider}`;
}

export function generateState(): string {
  return randomBytes(32).toString("hex");
}

export function getAuthorizeUrl(provider: string, state: string, linking?: boolean): string | null {
  const config = getOAuthConfig(provider);
  if (!config) return null;

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: getRedirectUri(provider),
    response_type: "code",
    scope: config.scope,
    state: linking ? `link:${state}` : state,
    access_type: "offline",
    prompt: "consent",
  });

  return `${config.authorizeUrl}?${params.toString()}`;
}

export async function exchangeCode(provider: string, code: string): Promise<{ access_token: string } | null> {
  const config = getOAuthConfig(provider);
  if (!config) return null;

  const res = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: getRedirectUri(provider),
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) return null;
  return res.json();
}

export async function getUserFromProvider(provider: string, accessToken: string): Promise<{ id: string; email: string; name: string } | null> {
  const config = getOAuthConfig(provider);
  if (!config) return null;

  const res = await fetch(config.userUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return null;
  const data = await res.json();
  return config.mapUser(data);
}
