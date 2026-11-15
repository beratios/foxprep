# FoxPrep — FBA / WFS / FBM prep center platformu

Next.js 14 (App Router) + Prisma 7 + Postgres (Neon) + Stripe + Amazon SP-API + Walmart API.

## Neler var

**Ana sayfa (`/`)**
- Hero'daki "kargo etiketi" canlı bir hesaplayıcı: kanal, adet, poly bag / bubble / bundle seçimine göre fiyatı hesaplıyor
- 4 adımda nasıl çalıştığı, kademeli fiyat tablosu (1–999 / 1.000–1.999 / 2.000–4.999 / 5.000+ özel fiyat), ek hizmetler, SSS
- Tam hesaplayıcı: müşteri panelindeki sepetin aynısı, HST %13 dahil. "Start this order" seçimleri sepete taşır

**Müşteri paneli (`/dashboard`)**
- Kayıt ve giriş (JWT cookie). Her müşteriye `FX-XXXX` müşteri kodu verilir
- Yeni sipariş sepeti: kanal, ürünler (mağazadan seçilir veya elle girilir), hizmetler ve adetleri, tedarikçi, takip numarası, notlar. Fiyat canlı güncellenir, sunucu da fiyatı yeniden hesaplar
- Ödeme bakiyeden ya da Stripe ile kartla. Ödeme yapılınca depo adresi `ATTN: FX-XXXX / IN-XXXXXX` satırıyla gösterilir, kopyalanabilir
- Sipariş detayı: durum çubuğu, kalemler, gelen/beklenen adetler, geçmiş. İptal edilirse ücret bakiyeye iade edilir
- Bakiye: Stripe ile yükleme ve tüm hareketlerin listesi
- Ürünler: Amazon/Walmart'tan senkronize edilen ya da elle eklenen SKU, FNSKU ve ASIN'ler, Amazon'daki ve depodaki stok
- Mağaza bağlama: Amazon.ca / Amazon.com (SP-API OAuth) ve Walmart (Client ID ve Secret)

**Admin paneli (`/admin`)**
- Sipariş listesi, durum sayıları, son 30 günün cirosu, arama
- Sipariş güncelleme: durum, müşteriye not, gelen adetler (depo stoğunu günceller), çıkış takip numarası, iç notlar
- Müşteriler: bakiye düzeltme (e-Transfer, özel fiyat iadesi vb.)

Fiyatların hepsi tek dosyada: `src/lib/pricing.ts`. Orayı değiştirmen yeterli; ana sayfa, sepet ve sunucu aynı dosyayı kullanıyor.

## Kurulum

```bash
npm install
cp .env.example .env        # değerleri doldur
npx prisma db push          # tabloları Neon'da oluştur
npm run db:seed             # ADMIN_EMAIL / ADMIN_PASSWORD ile admin hesabı oluştur
npm run dev
```

## Vercel'e deploy

1. Repo'yu Vercel'e bağla, `.env.example`'daki tüm değişkenleri ekle (`APP_URL=https://foxprepcenter.com`)
2. Vercel → Settings → Domains'e `foxprepcenter.com` ve `www.foxprepcenter.com` ekle, Vercel'in verdiği DNS kayıtlarını domain sağlayıcına gir
3. Build komutu varsayılan kalabilir (`prisma generate && next build`)

## Stripe

1. `STRIPE_SECRET_KEY` ekle
2. Webhook oluştur: `https://foxprepcenter.com/api/stripe/webhook`, event olarak `checkout.session.completed` seç, `STRIPE_WEBHOOK_SECRET` ekle
3. Stripe anahtarı yoksa kartla ödeme kapanır, sistem sadece bakiyeyle çalışır. Bakiyeyi admin panelinden elle yükleyebilirsin

## Amazon SP-API

1. Seller Central → Apps & Services → Develop Apps üzerinden "Solution Provider" olarak geliştirici kaydı yap. Gereken roller: **Amazon Fulfillment** ve **Inventory and Order Tracking** (FBA envanteri için)
2. App oluştur. OAuth Login URI: `https://foxprepcenter.com/dashboard/stores`, Redirect URI: `https://foxprepcenter.com/api/integrations/amazon/callback`
3. `.env`'e ekle: `AMAZON_SPAPI_APP_ID`, `AMAZON_LWA_CLIENT_ID`, `AMAZON_LWA_CLIENT_SECRET`. App yayınlanana kadar `AMAZON_SPAPI_DRAFT=true` kalsın
4. Müşteri "Connect Amazon.ca"ya bastığında Amazon onay ekranına gider. Dönüşte refresh token AES-256-GCM ile şifrelenip kaydedilir ve FBA envanteri (SKU, ASIN, FNSKU, adet) çekilir

## Walmart

Müşteri, Walmart Developer Portal'dan aldığı Client ID ve Secret'ı panele yapıştırıyor. Anahtar test edilir, sonra ürünler çekilir. Walmart.ca için `WM_TENANT_ID` header'ı ekleniyor; Kanada hesabıyla ilk testi yapıp doğrula.

## Notlar

- Para hep cent cinsinden integer olarak tutulur. HST %13 (Ontario)
- Bakiyeden düşme atomik çalışır, bakiye eksiye düşemez. Stripe tarafı idempotent: webhook ve başarılı dönüş sayfası aynı ödemeyi iki kez yazmaz
- 5.000+ adetlik siparişler 2.000–4.999 fiyatından ödenir. Özel fiyatı belirleyince farkı admin panelinden bakiyeye iade edersin
- Depo adresi `.env`'deki `WAREHOUSE_*` değişkenlerinden geliyor
- Depolama kuralları `src/lib/pricing.ts` içindeki `STORAGE` ve `MAX_PALLETS_PER_ORDER` değerlerinde. Depolama ücreti şimdilik otomatik kesilmiyor: ayda bir admin panelindeki Customers sayfasından eksi tutarla (ör. -40, "Storage Dec, 1 pallet") bakiyeden düşüyorsun
