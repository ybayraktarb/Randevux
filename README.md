## Kurulum

Bu projeyi çalıştırmak için:

1. [.env.example](cci:7://file:///Users/ybbayraktar/Downloads/randevuxx/.env.example:0:0-0:0) dosyasını kopyala: `cp .env.example .env.local`
2. [Supabase Dashboard](https://supabase.com/dashboard) → **Settings → API** bölümünden
   `Project URL`, `anon key` ve `service_role key` değerlerini `.env.local`'e yapıştır.
3. Bağımlılıkları kur: `npm install`
4. Geliştirme sunucusunu başlat: `npm run dev`
5. Tarayıcıda `http://localhost:3000` adresini aç.

> ⚠️ `.env.local` dosyasını asla commit etme — [.gitignore](cci:7://file:///Users/ybbayraktar/Downloads/randevuxx/.gitignore:0:0-0:0)'da zaten korunuyor.
