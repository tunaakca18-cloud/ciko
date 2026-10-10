# Çiko Atölye

## Ücretsiz yayına alma (Cloudflare Pages)

1. Cloudflare hesabında **Workers & Pages → Create → Pages → Connect to Git** yoluyla `tunaakca18-cloud/ciko` deposunu bağla. Depo özel kalabilir; yayınlanan mağaza herkese açık olur.
2. Üretim dalı `main`, build komutu boş, çıktı klasörü `.` olsun. Pages Functions, kökteki `functions/` klasöründen otomatik alınır.
3. Pages projesinde **Settings → Bindings → KV namespace bindings** bölümünden `PRODUCTS` adında bir bağ oluştur. Yeni bir KV namespace açıp onu seç ve ilk dağıtımdan sonra yeniden dağıt.
4. **Settings → Variables and Secrets** bölümüne iki ayrı secret ekle:
	- `ADMIN_PASSWORD`: sadece senin belirleyeceğin yeni yönetici parolası. Önceki sohbet parolalarını yeniden kullanma.
	- `SESSION_SECRET`: en az 32 rastgele baytlık imza anahtarı. Terminalde `openssl rand -base64 32` ile üretip çıktıyı doğrudan Cloudflare secret alanına yapıştır; sohbete gönderme.
5. Ayarları kaydedip **Retry deployment** ile yeniden dağıt. Mağaza Cloudflare adresinden bilgisayar kapalıyken de açık kalır.

Müşteri girişi kaldırıldı; herkese açık mağaza doğrudan açılır. Yönetici parolası yalnızca Cloudflare secret olarak sunucuda doğrulanır. Ürün kataloğu Cloudflare KV'de saklanır. Bu demo gerçek ödeme almaz.

Yerel `python3 -m http.server` önizlemesi yalnızca statik dosyaları sunar; güvenli yönetici API'sini çalıştırmaz. Yönetici işlemlerini dağıtılmış Pages adresinde kullan.
