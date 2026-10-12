const encoder = new TextEncoder();
const sessionCookieName = "ciko_admin_session";

function encodeBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - base64.length % 4) % 4));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

async function getSigningKey(secret) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers }
  });
}

export async function createSessionCookie(secret, role) {
  const payload = encodeBase64Url(encoder.encode(JSON.stringify({ role, exp: Date.now() + 8 * 60 * 60 * 1000 })));
  const signature = await crypto.subtle.sign("HMAC", await getSigningKey(secret), encoder.encode(payload));
  const token = `${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
  return `${sessionCookieName}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`;
}

export function clearSessionCookie() {
  return `${sessionCookieName}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

async function getSessionRole(request, env) {
  if (!env.SESSION_SECRET) return false;
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookie = cookieHeader.split(";").map(part => part.trim()).find(part => part.startsWith(`${sessionCookieName}=`));
  if (!cookie) return false;
  const token = cookie.slice(sessionCookieName.length + 1);
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return false;
  try {
    const valid = await crypto.subtle.verify("HMAC", await getSigningKey(env.SESSION_SECRET), decodeBase64Url(signature), encoder.encode(payload));
    if (!valid) return false;
    const session = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload)));
    return Number.isFinite(session.exp) && session.exp > Date.now() && session.role === "admin"
      ? "admin"
      : null;
  } catch {
    return null;
  }
}

export async function isAdminRequest(request, env) {
  return (await getSessionRole(request, env)) === "admin";
}

export function hasSameOrigin(request) {
  const origin = request.headers.get("Origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}

export function constantTimeEqual(left, right) {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  let difference = leftBytes.length ^ rightBytes.length;
  const length = Math.max(leftBytes.length, rightBytes.length);
  for (let index = 0; index < length; index++) {
    difference |= (leftBytes[index] || 0) ^ (rightBytes[index] || 0);
  }
  return difference === 0;
}
