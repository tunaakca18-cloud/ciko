# Çiko Atölye

## Ücretsiz yayınlama (Cloudflare Pages)

1. Özel GitHub deposunu Cloudflare **Workers & Pages → Create → Pages → Connect to Git** yolundan bağla. Üretim dalı `main`, build komutu boş, çıktı klasörü `.` olsun. `functions/` klasörü Pages Functions olarak otomatik kullanılır. GitHub deposu özel kalabilir; yayınlanan mağaza herkese açık olur.

2. Cloudflare Pages projesinde **Settings → Bindings → KV namespace bindings** bölümünden `PRODUCTS` binding’ini oluşturup yeni KV namespace’e bağla. `functions/` içindeki API’ler katalog ve giriş deneme sayacını bu alanda saklar.

3. GitHub deposunda **Settings → Secrets and variables → Actions** altında şu repository secrets’ları oluştur:
	- `ADMIN_PASSWORD`: yalnız yönetici parolası.
	- `SESSION_SECRET`: en az 32 rastgele baytlık imza anahtarı. Terminalde `openssl rand -base64 32` ile üret; bu değeri sohbete veya dosyaya koyma.
	- `CLOUDFLARE_API_TOKEN`: yalnız ilgili Pages projesini ve secret’larını yönetme yetkisi olan Cloudflare API token’ı.
	- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare hesap kimliği.

4. **Settings → Secrets and variables → Actions → Variables** altında `CLOUDFLARE_PAGES_PROJECT` değişkenini Pages proje adıyla oluştur.
5. `.github/workflows/sync-cloudflare-secrets.yml` workflow’u GitHub Actions üzerinden bu GitHub secrets’ları Cloudflare Pages Functions runtime secrets’larına aktarır. Pages projesi oluşturulduktan sonra workflow’u **Actions → Sync Cloudflare Pages secrets → Run workflow** ile çalıştır. Yeni secret değerini daha sonra değiştirince de workflow’u tekrar çalıştır.
6. `main` dalına push edilen kod Cloudflare Pages’te otomatik yayınlanır. Workflow tamamlandıktan ve ilk dağıtım bittikten sonra mağaza, bilgisayar kapalıyken de Cloudflare adresinden erişilebilir.

Mağaza misafir parolası olmadan herkese açıktır. Yönetici parolası Cloudflare secret olarak sunucuda doğrulanır. Herkes kataloğu görebilir; ürün ekleme ve silme yalnız yönetici oturumuyla yapılır. Ürün kataloğu Cloudflare KV'de saklanır. Bu demo gerçek ödeme almaz.

GitHub Pages tek başına Pages Functions çalıştırmaz; burada GitHub yalnız kaynak kodu ve deployment secrets’larını sağlar, çalışan site Cloudflare Pages’te barındırılır. Parolaları HTML, JavaScript, `wrangler.toml` veya GitHub commit’lerine ekleme. Sohbette paylaşılmış parolaları yayına almadan önce yenile.

Yerel `python3 -m http.server` önizlemesi yalnızca statik dosyaları sunar; güvenli yönetici API'sini çalıştırmaz. Yönetici işlemlerini dağıtılmış Pages adresinde kullan.
