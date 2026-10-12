import { defaultProducts } from "../_shared/default-products.js";
import { hasSameOrigin, isAdminRequest, isStoreRequest, jsonResponse } from "../_shared/auth.js";

async function readProducts(env) {
  const storedProducts = await env.PRODUCTS.get("catalog", "json");
  return Array.isArray(storedProducts) ? storedProducts : defaultProducts;
}

export async function onRequestGet({ request, env }) {
  if (!env.PRODUCTS) return jsonResponse({ error: "Ürün kataloğu henüz yapılandırılmadı." }, 503);
  if (!(await isStoreRequest(request, env))) return jsonResponse({ error: "Mağazaya girmek için misafir veya yönetici girişi gerekli." }, 401);
  return jsonResponse(await readProducts(env));
}

export async function onRequestPost({ request, env }) {
  if (!hasSameOrigin(request)) return jsonResponse({ error: "İstek kaynağı doğrulanamadı." }, 403);
  if (!(await isAdminRequest(request, env))) return jsonResponse({ error: "Yönetici girişi gerekli." }, 401);
  if (!env.PRODUCTS) return jsonResponse({ error: "Ürün kataloğu henüz yapılandırılmadı." }, 503);

  let product;
  try {
    product = await request.json();
  } catch {
    return jsonResponse({ error: "Ürün bilgileri okunamadı." }, 400);
  }

  if (!product || typeof product.name !== "string" || !product.name.trim() || typeof product.category !== "string" || !product.category.trim() || typeof product.detail !== "string" || typeof product.clickText !== "string" || !Number.isFinite(product.price) || product.price <= 0 || typeof product.image !== "string") {
    return jsonResponse({ error: "Ürün alanları geçersiz." }, 400);
  }
  if (!(product.image.startsWith("./images/") || /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(product.image)) || product.image.length > 3_000_000) {
    return jsonResponse({ error: "Ürün görseli geçersiz veya çok büyük." }, 400);
  }

  const products = await readProducts(env);
  const newProduct = {
    id: Math.max(0, ...products.map(item => Number(item.id) || 0)) + 1,
    name: product.name.trim(),
    category: product.category.trim(),
    detail: product.detail.trim(),
    clickText: product.clickText.trim(),
    price: product.price,
    stock: "Sonsuz",
    image: product.image,
    tag: "Yeni"
  };
  const updatedProducts = [...products, newProduct];
  const serializedProducts = JSON.stringify(updatedProducts);
  if (new TextEncoder().encode(serializedProducts).length > 24 * 1024 * 1024) {
    return jsonResponse({ error: "Katalog depolama sınırına yaklaştı; görseli küçült." }, 413);
  }
  await env.PRODUCTS.put("catalog", serializedProducts);
  return jsonResponse(updatedProducts, 201);
}

export async function onRequestDelete({ request, env }) {
  if (!hasSameOrigin(request)) return jsonResponse({ error: "İstek kaynağı doğrulanamadı." }, 403);
  if (!(await isAdminRequest(request, env))) return jsonResponse({ error: "Yönetici girişi gerekli." }, 401);
  if (!env.PRODUCTS) return jsonResponse({ error: "Ürün kataloğu henüz yapılandırılmadı." }, 503);

  let id;
  try {
    ({ id } = await request.json());
  } catch {
    return jsonResponse({ error: "Ürün numarası okunamadı." }, 400);
  }
  const products = await readProducts(env);
  const updatedProducts = products.filter(product => product.id !== Number(id));
  if (updatedProducts.length === products.length) return jsonResponse({ error: "Ürün bulunamadı." }, 404);
  await env.PRODUCTS.put("catalog", JSON.stringify(updatedProducts));
  return jsonResponse(updatedProducts);
}
