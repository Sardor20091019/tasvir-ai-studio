# 📡 Tasvir.ai — Comprehensive API Endpoints Specification

This document provides the complete, authoritative reference for all REST API endpoints available across the **Tasvir.ai** platform (NestJS Backend API and Next.js Route Handlers).

---

## 🌐 Base URLs & Environment

| Environment | Base URL | Description |
| :--- | :--- | :--- |
| **NestJS Backend API (Local)** | `http://localhost:4000/api` | Primary business logic, auth, video pipeline, and admin services |
| **Next.js Web Proxy (Local)** | `http://localhost:3000/api` | Web application client-facing API routes with fallback handling |
| **Production API** | `https://api.tasvir.ai/api` | Production backend cluster |

---

## 🔐 Authentication & Security Protocols

1. **User Authentication**:
   * Standard endpoints protected by `AuthGuard` require the HTTP header:
     ```http
     Authorization: Bearer <JWT_ACCESS_TOKEN>
     ```
2. **Administrator Authorization**:
   * Admin endpoints protected by `AdminGuard` require either:
     * Valid Admin JWT Token in `Authorization: Bearer <TOKEN>` (where user role is `'admin'`), OR
     * Direct Admin Key header:
       ```http
       x-admin-key: <ADMIN_SECRET_KEY>
       ```
3. **Bot Protection (Cloudflare Turnstile)**:
   * Sensitive auth routes (e.g. `POST /api/auth/google`, `POST /api/auth/send-otp`) strictly enforce server-side Cloudflare Turnstile token verification.
4. **Rate Limiting**:
   * In-memory token bucket rate limiters prevent abuse on AI generation and auth routes (returns `429 Too Many Requests` on breach).

---

## 📑 Summary Table of All Endpoints

| # | Method | Path | Auth / Guard | Module | Description |
|---|---|---|---|---|---|
| **1** | `GET` | `/api/health` | Public | System | Healthcheck & service status |
| **2** | `POST` | `/api/auth/send-otp` | Public (Turnstile optional) | Auth | Send SMS verification code |
| **3** | `POST` | `/api/auth/verify-otp` | Public | Auth | Verify SMS OTP and obtain JWT |
| **4** | `POST` | `/api/auth/google` | Public (Turnstile Required) | Auth | Google OAuth 2.0 login with Turnstile |
| **5** | `GET` | `/api/auth/me` | Bearer JWT | Auth | Get authenticated user profile & balance |
| **6** | `GET` | `/api/products` | Optional Auth | Products | List user or platform demo products |
| **7** | `GET` | `/api/products/:id` | Public | Products | Retrieve single product details |
| **8** | `POST` | `/api/products` | Bearer JWT | Products | Create product bound to authenticated user |
| **9** | `POST` | `/api/products/presign-upload` | Bearer JWT | Products | Get presigned upload configuration |
| **10** | `POST` | `/api/generate-video` | Rate-Limited | Veo 3.1 | Generate 9:16 vertical drama ad (Veo 3.1) |
| **11** | `GET` | `/api/generate-video/:jobId` | Public | Veo 3.1 | Get drama video status & karaoke subtitles |
| **12** | `GET` | `/api/generate-video/status/:jobId`| Public | Veo 3.1 | Alias status polling endpoint |
| **13** | `GET` | `/api/video-jobs/avatars` | Public | Video Jobs | List Central Asian AI avatars |
| **14** | `POST` | `/api/video-jobs/generate-script` | Public | Video Jobs | Generate Uzum/Reels localized ad script |
| **15** | `POST` | `/api/video-jobs/tts-preview` | Public | Video Jobs | Synthesize voiceover audio preview |
| **16** | `POST` | `/api/video-jobs/render` | Bearer JWT | Video Jobs | Start 4-stage 9:16 video render job |
| **17** | `GET` | `/api/video-jobs` | Bearer JWT | Video Jobs | List video rendering history for user |
| **18** | `GET` | `/api/video-jobs/:id` | Bearer JWT | Video Jobs | Get single render job status and output |
| **19** | `GET` | `/api/video-jobs/audio-mock/:avatarId`| Public | Video Jobs | Stream synthetic voice WAV audio |
| **20** | `GET` | `/api/billing/plans` | Public | Billing | List token subscription/recharge plans |
| **21** | `POST` | `/api/billing/request-tokens` | Bearer JWT | Billing | Submit token allocation request to admin |
| **22** | `GET` | `/api/billing/my-requests` | Bearer JWT | Billing | View submitted token request statuses |
| **23** | `GET` | `/api/billing/transactions` | Bearer JWT | Billing | View user credit transaction history |
| **24** | `POST` | `/api/admin/grant-tokens` | AdminGuard | Admin | Add tokens to user balance |
| **25** | `GET` | `/api/admin/requests` | AdminGuard | Admin | List all pending user token requests |
| **26** | `POST` | `/api/admin/reject-request` | AdminGuard | Admin | Reject user token request |
| **27** | `GET` | `/api/admin/users` | AdminGuard | Admin | List platform users for token management |

---

## 1. System & Health

### `GET /api/health`
Checks backend service availability and timestamp.
* **Authentication**: None (Public)
* **Response `200 OK`**:
```json
{
  "status": "ok",
  "service": "tasvir-api",
  "timestamp": "2026-10-22T12:00:00.000Z",
  "version": "1.0.0"
}
```

---

## 2. Authentication (`/api/auth`)

### `POST /api/auth/send-otp`
Sends a one-time verification code via SMS to an Uzbek or international phone number.
* **Authentication**: None
* **Request Body**:
```json
{
  "phoneNumber": "+998901234567",
  "turnstileToken": "0.X_example_token_string"
}
```
* **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Tasdiqlash kodi telefon raqamingizga yuborildi",
  "expiresInSeconds": 300
}
```

---

### `POST /api/auth/verify-otp`
Validates the SMS OTP code and returns a signed JSON Web Token (JWT).
* **Authentication**: None
* **Request Body**:
```json
{
  "phoneNumber": "+998901234567",
  "code": "849201"
}
```
* **Response `200 OK`**:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr-550e8400-e29b-41d4-a716-446655440000",
    "phone_number": "+998901234567",
    "full_name": "Foydalanuvchi",
    "role": "user",
    "credits_balance": 5
  }
}
```

---

### `POST /api/auth/google`
Authenticates a user via Google OAuth 2.0 credential. **Strictly requires a verified Cloudflare Turnstile CAPTCHA token.**
* **Authentication**: None (Turnstile mandatory)
* **Request Body**:
```json
{
  "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...",
  "turnstileToken": "0.X_verified_cloudflare_turnstile_token"
}
```
* **Response `200 OK`**:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr-google-998822",
    "email": "user@gmail.com",
    "full_name": "John Doe",
    "role": "user",
    "credits_balance": 5
  }
}
```
* **Error Response `400 Bad Request`**:
```json
{
  "statusCode": 400,
  "message": "Xavfsizlik tekshiruvi: Iltimos, Cloudflare tasdiqlashidan oʻting (Turnstile token talab qilinadi)"
}
```

---

### `GET /api/auth/me`
Retrieves profile and current video token balance for the authenticated caller.
* **Authentication**: `Bearer <JWT_ACCESS_TOKEN>`
* **Response `200 OK`**:
```json
{
  "id": "usr-google-998822",
  "full_name": "John Doe",
  "email": "user@gmail.com",
  "role": "user",
  "credits_balance": 5,
  "created_at": "2026-10-20T10:00:00.000Z"
}
```
* **Error Response `401 Unauthorized`**:
```json
{
  "statusCode": 401,
  "message": "Iltimos, avval tizimga kiring (Avtorizatsiya talab qilinadi)"
}
```

---

## 3. Product Catalog & Asset Upload (`/api/products`)

### `GET /api/products`
Lists products filtered by user ID or returns platform demo templates.
* **Query Parameters**:
  * `userId` (optional): Filter products belonging to a user ID.
* **Response `200 OK`**:
```json
[
  {
    "id": "p-1",
    "userId": "usr-1",
    "title": "Nike Air Zoom Pegasus 40",
    "category": "Kiyim va Poyabzal",
    "priceUzs": 450000,
    "discountBadge": "-35% Chegirma",
    "imageUrl": "https://images.unsplash.com/photo-1542291026-7eec264c27ff"
  }
]
```

---

### `GET /api/products/:id`
Retrieves product details by ID.
* **Parameters**: `id` (string)
* **Response `200 OK`**: Product object or `404 Not Found`.

---

### `POST /api/products`
Creates a product record strictly assigned to the authenticated user ID.
* **Authentication**: `Bearer <JWT_ACCESS_TOKEN>`
* **Request Body**:
```json
{
  "title": "Smart Watch Ultra 8",
  "category": "Elektronika",
  "priceUzs": 290000,
  "discountBadge": "1+1 Sovgʻa",
  "imageUrl": "https://n6ogfqlb21.ufs.sh/f/example-watch.jpg"
}
```
* **Response `201 Created`**:
```json
{
  "id": "prod-e7a9b1c2",
  "userId": "usr-authenticated-id",
  "title": "Smart Watch Ultra 8",
  "category": "Elektronika",
  "priceUzs": 290000,
  "discountBadge": "1+1 Sovgʻa",
  "imageUrl": "https://n6ogfqlb21.ufs.sh/f/example-watch.jpg",
  "createdAt": "2026-10-22T12:30:00.000Z"
}
```

---

### `POST /api/products/presign-upload`
Provides presigned parameters for secure direct file upload to storage.
* **Authentication**: `Bearer <JWT_ACCESS_TOKEN>`
* **Request Body**:
```json
{
  "filename": "product-photo.jpg",
  "fileType": "image/jpeg"
}
```

---

## 4. Google Veo 3.1 & Drama Video Engine (`/api/generate-video`)

### `POST /api/generate-video`
Triggers the dramatic product video pipeline targeting Google **Veo 3.1** (`veo-3.1-lite-generate`), strictly vertical **9:16**, dynamic scene durations (4–8s each), karaoke subtitles, and optional background music overlay.
* **Authentication**: None (Rate-limited to 15 requests per 5 minutes per IP)
* **Request Body**:
```json
{
  "prompt": "Dramatik xiyonat va koʻz yoshlar: Doʻstim meni arzon naushnik bilan aldadi, lekin asl AirPods Max Uzum Marketda 30% chegirmada!",
  "aspectRatio": "9:16",
  "includeBackgroundMusic": true,
  "dramaLevel": "high"
}
```
* **Response `200 OK`**:
```json
{
  "jobId": "job_1729601234567_abc",
  "status": "queued",
  "progress": 15,
  "modelTier": "veo-3.1-lite-generate",
  "aspectRatio": "9:16",
  "includeBackgroundMusic": true,
  "message": "Google Veo 3.1 va dramatik ssenariy tizimi ishga tushirildi"
}
```

---

### `GET /api/generate-video/:jobId`
Retrieves progress, active scene breakdown, word-by-word karaoke timeline timestamps, and final concatenated MP4 video URL.
* **Parameters**: `jobId` (string matching `/^[a-zA-Z0-9_-]{4,64}$/`)
* **Response `200 OK` (Completed)**:
```json
{
  "jobId": "job_1729601234567_abc",
  "status": "completed",
  "progress": 100,
  "modelTier": "veo-3.1-lite-generate",
  "aspectRatio": "9:16",
  "includeBackgroundMusic": true,
  "bgMusicTrack": "EMIN & JONY — «Камин» (Fireplace)",
  "totalDurationSeconds": 16,
  "videoUrl": "https://n6ogfqlb21.ufs.sh/f/e4WrEcObdaG3xQRkL5D1FbQuz7SaXsDfAioc3JZvk59ORCG4",
  "downloadUrl": "https://n6ogfqlb21.ufs.sh/f/e4WrEcObdaG3xQRkL5D1FbQuz7SaXsDfAioc3JZvk59ORCG4",
  "scenes": [
    {
      "sceneIndex": 1,
      "actTitle": "1-Sahna: Shubhali Koʻz Qarash & Xiyonat Alomati",
      "emotion": "Shubha, xiyonat va ogʻir sukunat",
      "durationSeconds": 5,
      "tensionLevel": 8,
      "dialogueScript": "Sen meni aldayotgan eding... Yolgʻonmidi?",
      "caption": "Har bir soʻzing yolgʻonmidi?"
    },
    {
      "sceneIndex": 2,
      "actTitle": "2-Sahna: Koʻz Yoshlar & Keskin Kulminatsiya",
      "emotion": "Koʻz yosh va hissiy portlash",
      "durationSeconds": 6,
      "tensionLevel": 10,
      "dialogueScript": "Yigʻlama! Haqiqiy sifat faqat bitta joyda bor!",
      "caption": "Kutilmagan burilish va koʻz yoshlar"
    },
    {
      "sceneIndex": 3,
      "actTitle": "3-Sahna: Gʻolibona Qahramonlik Kadri",
      "emotion": "Gʻalaba va xotirjamlik",
      "durationSeconds": 5,
      "tensionLevel": 4,
      "dialogueScript": "Uzum Marketda 30% chegirmada original AirPods Max!",
      "caption": "Uzum Marketda ulgurib qoling!"
    }
  ],
  "karaokeTimeline": [
    { "word": "Sen", "startSec": 0.2, "endSec": 0.8 },
    { "word": "meni", "startSec": 0.9, "endSec": 1.4 },
    { "word": "aldayotgan", "startSec": 1.5, "endSec": 2.2 },
    { "word": "eding...", "startSec": 2.3, "endSec": 3.1 }
  ]
}
```

---

### `GET /api/generate-video/status/:jobId`
Alias for `GET /api/generate-video/:jobId` used by polling clients.

---

## 5. Studio Pipeline, Script Generation & Avatars (`/api/video-jobs`)

### `GET /api/video-jobs/avatars`
Lists realistic Central Asian AI presenter avatars with national accents and dialect support.
* **Authentication**: None
* **Response `200 OK`**:
```json
[
  {
    "id": "avatar-malika-uuid",
    "name": "malika",
    "display_name": "Malika (Toshkent)",
    "gender": "female",
    "dialect": "tashkent",
    "voice_tone": "energetic_seller",
    "avatar_image_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
    "is_active": true
  },
  {
    "id": "avatar-jasur-uuid",
    "name": "jasur",
    "display_name": "Jasur (Samarqand)",
    "gender": "male",
    "dialect": "samarkand",
    "voice_tone": "confident_expert",
    "avatar_image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    "is_active": true
  }
]
```

---

### `POST /api/video-jobs/generate-script`
Generates high-converting marketing scripts tailored for Uzum Market, Instagram Reels, or Telegram Shop.
* **Authentication**: None
* **Request Body**:
```json
{
  "productTitle": "Nike Air Zoom Pegasus 40",
  "category": "Kiyim va Poyabzal",
  "priceUzs": 450000,
  "tone": "discount_hook",
  "dialect": "standard_uzbek"
}
```
* **Response `200 OK`**:
```json
{
  "script": "Salom! Uzum Marketda ulgurib qoling! Aynan bugun mashhur Nike Air Zoom krossovkalari 450,000 soʻmga tushdi!",
  "estimatedDurationSeconds": 18,
  "tone": "discount_hook"
}
```

---

### `POST /api/video-jobs/tts-preview`
Synthesizes voice audio preview for a selected avatar and text script.
* **Authentication**: None
* **Request Body**:
```json
{
  "avatarId": "e3b0c442-98fc-1c14-9afb-4c8996fb9242",
  "scriptText": "Assalomu alaykum! Yangi kolleksiya yetib keldi!"
}
```
* **Response `200 OK`**:
```json
{
  "audioUrl": "/api/video-jobs/audio-mock/e3b0c442-98fc-1c14-9afb-4c8996fb9242",
  "durationSeconds": 3.5
}
```

---

### `POST /api/video-jobs/render`
Initiates the 4-stage studio video render job (Image Analysis ➔ Audio Synthesis ➔ Lip-Sync Animation ➔ 9:16 Master Render). Deducts 1 token from the user balance.
* **Authentication**: `Bearer <JWT_ACCESS_TOKEN>`
* **Request Body**:
```json
{
  "productId": "p-1",
  "avatarId": "avatar-malika-uuid",
  "platformPreset": "uzum_9_16",
  "scriptTone": "discount_hook",
  "scriptText": "Salom! Uzum Marketda ulgurib qoling!..."
}
```
* **Response `201 Created`**:
```json
{
  "id": "job-d41d8cd9-8f00-b204-e980-0998ecf8427e",
  "userId": "usr-authenticated-id",
  "status": "processing",
  "progressPercent": 10,
  "creditsCharged": 1,
  "createdAt": "2026-10-22T12:40:00.000Z"
}
```

---

### `GET /api/video-jobs`
Returns all studio render jobs created by the calling user.
* **Authentication**: `Bearer <JWT_ACCESS_TOKEN>`
* **Response `200 OK`**: Array of `VideoJob` objects.

---

### `GET /api/video-jobs/:id`
Retrieves single studio render job status and output video URL.
* **Authentication**: `Bearer <JWT_ACCESS_TOKEN>`
* **Parameters**: `id` (UUID format)

---

### `GET /api/video-jobs/audio-mock/:avatarId`
Streams generated in-memory WAV audio preview for the specified avatar.
* **Response Headers**: `Content-Type: audio/wav`, `Cache-Control: public, max-age=3600`

---

## 6. Token Billing & User Requests (`/api/billing`)

### `GET /api/billing/plans`
Lists available token plans (payments removed; used for submitting admin allocation requests).
* **Authentication**: None
* **Response `200 OK`**:
```json
[
  {
    "id": "shop_start",
    "nameUz": "Boshlangʻich Doʻkon",
    "tokens": 5,
    "priceUzs": 99000,
    "description": "Yangi sotuvchilar uchun 5 ta video tokeni"
  },
  {
    "id": "shop_pro",
    "nameUz": "Pro Sotuvchi",
    "tokens": 20,
    "priceUzs": 299000,
    "isBestseller": true,
    "description": "Ommabop tarif: 20 ta video reklama"
  },
  {
    "id": "shop_enterprise",
    "nameUz": "Marketplace Ekotizim",
    "tokens": 100,
    "priceUzs": 990000,
    "description": "Katta doʻkonlar uchun 100 ta video"
  }
]
```

---

### `POST /api/billing/request-tokens`
Submits a token allocation request to the platform administrator.
* **Authentication**: `Bearer <JWT_ACCESS_TOKEN>`
* **Request Body**:
```json
{
  "requestedTokens": 20,
  "note": "Pro Sotuvchi tarifi boʻyicha token soʻrovi. Toʻlov cheki Telegram orqali yuborildi."
}
```
* **Response `201 Created`**:
```json
{
  "id": "req-98765",
  "userId": "usr-authenticated-id",
  "requestedTokens": 20,
  "status": "pending",
  "createdAt": "2026-10-22T12:45:00.000Z"
}
```

---

### `GET /api/billing/my-requests`
Lists all token allocation requests submitted by the authenticated user.
* **Authentication**: `Bearer <JWT_ACCESS_TOKEN>`

---

### `GET /api/billing/transactions`
Lists user credit expenditure and allocation history.
* **Authentication**: `Bearer <JWT_ACCESS_TOKEN>`

---

## 7. Administrator Endpoints (`/api/admin`)

> **Access Restriction**: All `/api/admin/*` endpoints strictly require `AdminGuard` authorization via Admin JWT token or `x-admin-key`.

### `POST /api/admin/grant-tokens`
Allocates video generation tokens directly to a user's account.
* **Headers**: `x-admin-key: <ADMIN_KEY>` OR `Authorization: Bearer <ADMIN_JWT>`
* **Request Body**:
```json
{
  "targetUserId": "usr-google-998822",
  "targetPhoneNumber": "+998901234567",
  "tokensToAdd": 25,
  "reason": "Tasdiqlangan toʻlov yoki maxsus bonus",
  "requestId": "req-98765"
}
```
* **Response `200 OK`**:
```json
{
  "success": true,
  "targetUserId": "usr-google-998822",
  "previousBalance": 5,
  "newBalance": 30,
  "tokensAdded": 25,
  "message": "Foydalanuvchiga 25 ta token muvaffaqiyatli qoʻshildi"
}
```

---

### `GET /api/admin/requests`
Retrieves all pending token requests submitted by platform sellers.
* **Authentication**: `AdminGuard`
* **Response `200 OK`**: Array of pending request objects with user contact metadata.

---

### `POST /api/admin/reject-request`
Rejects a token request.
* **Authentication**: `AdminGuard`
* **Request Body**:
```json
{
  "requestId": "req-98765"
}
```

---

### `GET /api/admin/users`
Lists all registered users with their phone number, email, and current token balances.
* **Authentication**: `AdminGuard`

---

## 8. Next.js Frontend Route Handlers (`apps/web`)

These routes run inside the Next.js edge/Node server and provide reverse-proxy capabilities with graceful offline/standalone fallback simulation:

| Method | Path | Target Backend |
| :--- | :--- | :--- |
| `POST` | `/api/generate-video` | Proxies to NestJS `POST http://localhost:4000/api/generate-video` |
| `GET` | `/api/generate-video/:jobId` | Proxies to NestJS `GET http://localhost:4000/api/generate-video/:jobId` |

---

## 🛠️ Quick Testing with cURL

### 1. Check Backend Health
```bash
curl -i http://localhost:4000/api/health
```

### 2. Generate Drama Video with Google Veo 3.1
```bash
curl -i -X POST http://localhost:4000/api/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Dramatik xiyonat va koʻz yoshlar: AirPods Max chegirmada!",
    "aspectRatio": "9:16",
    "includeBackgroundMusic": true
  }'
```

### 3. Check Veo 3.1 Video Status
```bash
curl -i http://localhost:4000/api/generate-video/job_1729601234567_abc
```

### 4. Admin Grant Tokens
```bash
curl -i -X POST http://localhost:4000/api/admin/grant-tokens \
  -H "Content-Type: application/json" \
  -H "x-admin-key: your_admin_secret_key" \
  -d '{
    "targetUserId": "usr-123",
    "tokensToAdd": 10,
    "reason": "Test grant"
  }'
```
