import { clearSessionCookie, jsonResponse } from "../../_shared/auth.js";

export async function onRequestPost({ request }) {
  const origin = request.headers.get("Origin");
  if (!origin || origin !== new URL(request.url).origin) return jsonResponse({ error: "İstek kaynağı doğrulanamadı." }, 403);
  return jsonResponse({ ok: true }, 200, { "Set-Cookie": clearSessionCookie() });
}
