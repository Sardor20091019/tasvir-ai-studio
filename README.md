# 🎬 Tasvir — AI Video Reklama & UGC Studiyasi

> **Uzum Market, Instagram Reels va Telegram do'konlar uchun 60 soniyada 9:16 vertikal video reklamalar yaratuvchi sun'iy intellekt platformasi.**

---

## 🛠 Texnologik Stek & Arxitektura

- **Frontend (`/apps/web`):**
  - Next.js 15 (App Router, TypeScript, React 19)
  - Tailwind CSS + Lucide Icons + Canvas Confetti
  - Web Audio API (real-time ovoz va audio to'lqin vizualizatsiyasi)
  - Optimistic UI fallback — barcha tugmalar, audio, rasm yuklash va to'lovlar uzluksiz ishlaydi
- **Backend (`/apps/api`):**
  - NestJS (TypeScript, strict mode)
  - **DatabaseModule**: Global Kysely (`PostgresDialect` + `pg` connection pool + zero-config pgcrypto `pg-mem` engine)
  - **AuthModule**: O'zbekiston telefon raqamlari OTP `+998` va Telegram WebApp `initData` autentifikatsiyasi
  - **ProductsModule**: Mahsulotlar katalogi va S3/R2 presigned upload
  - **VideoJobsModule**: AI ssenariy generatori, TTS audio sintezi va 4 bosqichli render state machine
  - **BillingModule**: **Payme**, **Click**, va **Uzum Bank** to'lov integratsiyasi va vebxuklar
- **Ma'lumotlar bazasi va Kysely:**
  - PostgreSQL va Kysely query builder (`kysely`, `pg`)
  - Strongly typed `Database` interfeyslari (`Generated<T>`, `Selectable<T>`, `Insertable<T>`, `Updateable<T>`)
  - Bajariluvchi migratsiya: `src/database/migrations/0001_init_tasvir_schema.ts`
  - Atomik tranzaksiyalar: `VideoJobsService.createRenderJob` da kredit yechish (`credits_balance - 1`) va vazifani qo'shish bir tranzaksiyada bajariladi.

---

## 🎨 Editorial Dizayn Yo'nalishi

- **Fon va sirtlar:** Iliq qog'oz foni (`#FAF8F5`), toza oq kartalar (`#FFFFFF`) va pastel Bento sirtlari (`#FFF7ED` shaftoli, `#ECFDF5` yalpiz, `#EFF6FF` osmon, `#F5F3FF` lavanda).
- **Tipografiya:** Plus Jakarta Sans sarlavhalar uchun, Inter matnlar uchun, JetBrains Mono UZS (so'm) narxlar va hisoblagichlar uchun.
- **Rang urg'ulari:** Qora siyoh (`#141413`), Terracotta Coral (`#EA580C`), Cobalt (`#2563EB`), Qahrabo (`#F59E0B`), Zumrad (`#10B981`).
- **Chegaralar:** Aniq 1px qattiq `#E4E2DD`, 14px radius va nozik taktil soyalar.

---

## 🚀 Ishga tushirish

```bash
# 1. Barcha bog'liqliklarni o'rnatish
npm install

# 2. API va Web serverni bir vaqtda ishga tushirish
npm run dev

# Yoki alohida:
npm run dev:api   # NestJS API: http://localhost:4000/api
npm run dev:web   # Next.js Web: http://localhost:3000
```

---

## 📱 Asosiy Imkoniyatlar

1. **4 Bosqichli Reklama Studiyasi:**
   - 1-bosqich: Mahsulot rasmini yuklash (FileReader) + 4 ta tezkor namunaviy tovarlar (Nike Air Zoom, Milliy Atlas, Smart Watch, Samarqand Parfyum).
   - 2-bosqich: 4 ta Markaziy Osiyo AI boshlovchisi (Malika - Toshkent shevasi, Javohir - Adabiy o'zbek, Dilnoza - Samarqand / Vodiy, Timur - Rus tili).
   - 3-bosqich: AI ssenariy va ovoz (3 ta ohang: "🔥 Chegirma urg'usi", "✨ Sifat va sharh", "⚡ Qisqa Reels") hamda "🔊 Ovozni eshitish" interaktiv audio to'lqin vizualizatsiyasi.
   - 4-bosqich: 9:16 format tanlovi (Uzum Market, Instagram Reels, Telegram Do'kon) va "✨ 9:16 Video Yaratish (1 kredit)" atomik render.
2. **Jonli 9:16 Smartfon Ko'rinishi (iPhone 16 Pro):**
   - Mahsulot harakati va animatsiyasi.
   - Boshlovchi pufakchasi (Picture-in-Picture).
   - Sinxron harakatlanuvchi karaoke subtitrlar.
   - 4 bosqichli render indikatori (1. Rasm tahlili → 2. Ovoz sintezi → 3. Lip-sync animatsiya → 4. Tayyor!).
   - MP4 yuklab olish va Telegramga yuborish.
3. **Interaktiv UZS ROI Kalkulyatori:**
   - Toshkent an'anaviy media studiyalari (600,000 so'm / video) va Tasvir AI (12,000 so'm / video) solishtirmasi.
   - Oylik tejalgan mablag' (so'mda) va vaqt (ish kunlarida).
4. **Mahalliy To'lov Modali:**
   - Payme, Click va Uzum Bank orqali to'lovlar.
   - `+998` telefon raqamini kiritish va bir zumda test to'lovini tasdiqlash orqali kredit balansini yangilash.
5. **📱 Telegram Mini App Rejimi:**
   - Bitta tugma orqali ish maydonini @TasvirBot mobil ko'rinishiga moslashtirish.

