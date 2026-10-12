import { constantTimeEqual, createSessionCookie, hasSameOrigin, jsonResponse } from "../../_shared/auth.js";

const MAX_PASSWORD_LENGTH = 1024;
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_SECONDS = 600;

export async function onRequestPost({ request, env }) {
  if (!hasSameOrigin(request)) {
    return jsonResponse({ error: "İstek kaynağı doğrulanamadı." }, 403);
  }

  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET || !env.PRODUCTS) {
    return jsonResponse({ error: "Yönetici girişi henüz yapılandırılmadı." }, 503);
  }

  const clientAddress = request.headers.get("CF-Connecting-IP") || "unknown";
  const attemptsKey = `admin-login-attempts:${clientAddress}`;

  try {
    const attempts = Number(await env.PRODUCTS.get(attemptsKey) || 0);
    if (attempts >= MAX_ATTEMPTS) {
      return jsonResponse({ error: "Çok fazla deneme. 10 dakika sonra tekrar dene." }, 429);
    }

    const contentLength = Number(request.headers.get("Content-Length") || 0);
    if (contentLength > 2048) {
      return jsonResponse({ error: "İstek çok büyük." }, 413);
    }

    let submittedPassword;
    try {
      ({ password: submittedPassword } = await request.json());
    } catch {
      return jsonResponse({ error: "İstek okunamadı." }, 400);
    }

    if (typeof submittedPassword !== "string" || submittedPassword.length > MAX_PASSWORD_LENGTH) {
      await env.PRODUCTS.put(attemptsKey, String(attempts + 1), { expirationTtl: ATTEMPT_WINDOW_SECONDS });
      return jsonResponse({ error: "Parola doğru değil." }, 401);
    }

    if (!constantTimeEqual(submittedPassword, env.ADMIN_PASSWORD)) {
      await env.PRODUCTS.put(attemptsKey, String(attempts + 1), { expirationTtl: ATTEMPT_WINDOW_SECONDS });
      return jsonResponse({ error: "Parola doğru değil." }, 401);
    }

    await env.PRODUCTS.delete(attemptsKey);
    return jsonResponse({ ok: true }, 200, {
      "Set-Cookie": await createSessionCookie(env.SESSION_SECRET, "admin")
    });
  } catch {
    return jsonResponse({ error: "Güvenli giriş servisi geçici olarak kullanılamıyor." }, 503);
  }
}
