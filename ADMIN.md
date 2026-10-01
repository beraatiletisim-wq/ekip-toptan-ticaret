# Yönetici kurulumu

1. Cloudflare hesabı açın.
2. D1 veritabanı oluşturun ve `schema.sql` çalıştırın.
3. R2 bucket oluşturun: `ekip-toptan-dekont`.
4. `wrangler.jsonc` içindeki `BURAYA_D1_DATABASE_ID` değerini kendi D1 ID'nizle değiştirin.
5. `npx wrangler deploy` ile Worker'ı yayınlayın.
6. IBAN'ı `/api/iban` üzerinden veya daha sonra eklenecek yönetici ekranından ayarlayın.

Not: PDF dekontlar R2'ye, sipariş/randevular D1'e kaydedilir. WhatsApp'ın otomatik mesaj göndermesi için WhatsApp Cloud API kimlik bilgileri ayrıca gerekir; mevcut sürüm bildirimi hazır WhatsApp mesajı olarak açar.
