import { constantTimeEqual, createSessionCookie, hasSameOrigin, jsonResponse } from "../../_shared/auth.js";

export async function onRequestPost({ request, env }) {
  if (!hasSameOrigin(request)) return jsonResponse({ error: "İstek kaynağı doğrulanamadı." }, 403);
  if (!env.GUEST_PASSWORD || !env.SESSION_SECRET || !env.PRODUCTS) {
    return jsonResponse({ error: "Misafir girişi henüz yapılandırılmadı." }, 503);
  }

  const clientAddress = request.headers.get("CF-Connecting-IP") || "unknown";
  const attemptsKey = `guest-login-attempts:${clientAddress}`;
  const attempts = Number(await env.PRODUCTS.get(attemptsKey) || 0);
  if (attempts >= 5) return jsonResponse({ error: "Çok fazla deneme. 10 dakika sonra tekrar dene." }, 429);

  let password;
  try {
    ({ password } = await request.json());
  } catch {
    return jsonResponse({ error: "İstek okunamadı." }, 400);
  }

  if (typeof password !== "string" || !constantTimeEqual(password, env.GUEST_PASSWORD)) {
    await env.PRODUCTS.put(attemptsKey, String(attempts + 1), { expirationTtl: 600 });
    return jsonResponse({ error: "Parola doğru değil." }, 401);
  }

  await env.PRODUCTS.delete(attemptsKey);
  return jsonResponse({ ok: true }, 200, { "Set-Cookie": await createSessionCookie(env.SESSION_SECRET, "guest") });
}
