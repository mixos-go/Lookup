# DEPLOY.md — Panduan Deployment LookUp

---

## Arsitektur Deployment

### Railway (Rekomendasi)

```
Railway Project
├── Service: backend     ← API + BullMQ worker (1 proses)
├── Plugin:  PostgreSQL  ← Managed, auto-inject DATABASE_URL
└── Plugin:  Redis       ← Managed, auto-inject REDIS_URL
```

### VPS dengan Docker Compose

```
VPS
├── Container: nginx      ← Reverse proxy + SSL
├── Container: backend    ← API + BullMQ worker
├── Container: postgres   ← PostgreSQL 16
└── Container: redis      ← Redis 7
```

---

## Railway Setup (Step-by-step)

### 1. Buat Project di Railway

Buka [railway.com](https://railway.com) → New Project → Empty Project.

### 2. Tambah PostgreSQL Plugin

Di canvas Railway → New → Database → **PostgreSQL**.
Railway akan auto-buat env var `DATABASE_URL` di plugin ini.

### 3. Tambah Redis Plugin

Di canvas Railway → New → Database → **Redis**.
Railway akan auto-buat env var `REDIS_URL` di plugin ini.

### 4. Buat Backend Service

Di canvas Railway → New → **GitHub Repo** → pilih repo LookUp.

Setelah service dibuat, buka **Settings** service:

| Setting | Nilai |
|---------|-------|
| Root Directory | `apps/backend` |
| Config File Path | `/apps/backend/railway.toml` |
| Generate Domain | ✅ Aktifkan |

### 5. Set Environment Variables Backend

Buka tab **Variables** di service backend, tambahkan:

```
# Reference variables — Railway auto-isi dari plugin
DATABASE_URL         = ${{Postgres.DATABASE_URL}}
REDIS_URL            = ${{Redis.REDIS_URL}}

# Harus diisi manual
NODE_ENV             = production
PORT                 = 3000
API_BASE_URL         = https://<domain-backend>.up.railway.app
CORS_ORIGIN          = *
JWT_SECRET           = <generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_REFRESH_SECRET   = <generate: beda dari JWT_SECRET>
ENCRYPTION_KEY       = <generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
SHOPEE_PARTNER_ID    = <dari open.shopee.com>
SHOPEE_PARTNER_KEY   = <dari open.shopee.com>
TIKTOK_APP_KEY       = <dari partner.tiktokshop.com>
TIKTOK_APP_SECRET    = <dari partner.tiktokshop.com>
```

> **Catatan `API_BASE_URL`:** Ini dipakai untuk OAuth redirect URI.
> Setelah domain Railway terbentuk, update nilai ini + update
> redirect URI di Shopee Partner Portal dan TikTok Partner Center.

### 6. Deploy

Push ke branch `main` → Railway otomatis build dan deploy.

Cek logs di Railway dashboard. Pastikan muncul:
```
Server running on port 3000
Database connected
Redis connected
BullMQ worker started
```

### 7. Verifikasi

```bash
curl https://<domain-backend>.up.railway.app/health
# → {"status":"ok","timestamp":"..."}
```

### 8. Internal Networking (Otomatis)

Railway menggunakan **private network** antar service dalam satu project.
Semua service berkomunikasi via `<service-name>.railway.internal`.

Tidak perlu konfigurasi manual — Railway auto-setup dengan Wireguard tunnel.

```
backend → PostgreSQL  : via ${{Postgres.DATABASE_URL}}  (internal URL)
backend → Redis       : via ${{Redis.REDIS_URL}}         (internal URL)
```

---

## Shopee & TikTok OAuth Setup

Setelah backend live, update redirect URI di platform masing-masing:

**Shopee** → open.shopee.com → App Settings → Redirect URL:
```
https://<domain-backend>.up.railway.app/api/shops/shopee/callback
```

**TikTok** → partner.tiktokshop.com → App → Auth Settings → Redirect URI:
```
https://<domain-backend>.up.railway.app/api/shops/tiktok/callback
```

---

## Mobile (Expo) Setup

### Bagaimana Mobile Terhubung ke Backend?

**Mobile dan backend adalah dua aplikasi terpisah — tidak ada koneksi otomatis.**
Berbeda dengan `docker-compose.yml` di mana service saling kenal lewat nama
container, Expo app yang berjalan di HP/simulator hanya tahu backend lewat
**satu environment variable**: `EXPO_PUBLIC_API_URL`.

```
apps/mobile/src/constants/index.ts
  → API_URL = process.env.EXPO_PUBLIC_API_URL

apps/mobile/src/api/client.ts
  → axios.create({ baseURL: API_URL })   ← SEMUA request mobile lewat sini
```

Nilai `EXPO_PUBLIC_API_URL` dibaca **saat build/start**, bukan runtime — jadi
kalau diubah, perlu restart `expo start` atau build ulang.

**Tiga tempat nilai ini bisa diisi, urutan prioritas tergantung cara jalanin app:**

| Cara jalanin | Sumber nilai | File |
|---|---|---|
| `npm start` (Expo Go / dev client) | `apps/mobile/.env` | dibaca otomatis oleh Expo CLI |
| `eas build --profile <nama>` | `eas.json` → `build.<nama>.env` | sudah di-hardcode per environment |
| Override manual | `export EXPO_PUBLIC_API_URL=... && npm start` | env shell, prioritas tertinggi |

### ⚠️ Jebakan paling umum: `localhost` tidak jalan di HP fisik

`localhost` di konteks HP/simulator merujuk ke **device itu sendiri**, bukan
laptop kamu. Kalau backend jalan di Docker Compose lokal (`localhost:3000`)
dan kamu test pakai HP asli via Expo Go — **tidak akan connect**, request akan
timeout terus.

**Fix — pakai IP address laptop di jaringan WiFi yang sama:**

```bash
# Cek IP laptop
ifconfig | grep "inet "        # macOS/Linux — cari 192.168.x.x
ipconfig                        # Windows — cari "IPv4 Address"
```

```bash
# apps/mobile/.env
EXPO_PUBLIC_API_URL=http://192.168.1.10:3000
```

Syarat: laptop dan HP di WiFi yang sama, firewall laptop tidak blokir port 3000.

**Pengecualian:** simulator iOS dan emulator Android (bukan HP fisik) biasanya
bisa pakai `localhost` langsung karena mereka jalan di mesin yang sama dengan
backend — kecuali Android emulator yang butuh `10.0.2.2` sebagai pengganti
`localhost`.

### 1. Install dependencies

```bash
cd apps/mobile
npm install
```

### 2. Konfigurasi environment

```bash
cp .env.example .env
# Edit EXPO_PUBLIC_API_URL sesuai backend yang aktif (local/Railway)
```

### 3. Login ke akun Expo (sekali saja)

```bash
npx expo login
npx eas login
```

### 4. Inisialisasi EAS Project (sekali saja per project)

```bash
eas init
```

Ini akan generate `projectId` asli dan otomatis update field `extra.eas.projectId`
di `app.json`. **Wajib dijalankan sebelum build** — placeholder
`YOUR_EAS_PROJECT_ID` di `app.json` dan `eas.json` (`updates.url`) harus diganti.

Juga update field `owner` di `app.json` dengan username akun Expo.

### 5. Jalankan secara lokal (development)

```bash
npm start
# Scan QR code dengan Expo Go app, atau tekan 'i' / 'a' untuk simulator
```

### 6. Ganti placeholder app icon & splash (opsional tapi disarankan)

File di `assets/` (`icon.png`, `splash.png`, `adaptive-icon.png`, `favicon.png`)
saat ini adalah **placeholder generated** (warna brand blue polos). Ganti dengan
asset desain asli sebelum submit ke App Store / Play Store — lihat spesifikasi
ukuran di `docs/UI_DESIGN.md` bagian Assets & Icons.

### 7. Build dengan EAS

```bash
# Development build (install di device fisik via Expo Dev Client)
eas build --profile development --platform android

# Preview build (internal testing, APK langsung install)
eas build --profile preview --platform android

# Production build (untuk submit ke store)
eas build --profile production --platform all
```

Build profiles (`development`, `preview`, `production`) dikonfigurasi di
`eas.json` — masing-masing punya `EXPO_PUBLIC_API_URL` yang berbeda agar app
otomatis connect ke backend yang sesuai (local/staging/production).

### 8. Submit ke App Store / Play Store

```bash
eas submit --platform ios
eas submit --platform android
```

Edit kredensial di `eas.json` bagian `submit.production` sebelum menjalankan
(Apple ID, App Store Connect App ID, Apple Team ID, Google Service Account JSON).

### 9. OTA Update (setelah app live, tanpa resubmit ke store)

```bash
eas update --branch production --message "Fix bug X"
```

---

## VPS Setup (Alternatif Railway)

### Prerequisites
- VPS Ubuntu 22.04+ dengan Docker + Docker Compose
- Domain pointing ke IP VPS

### 1. Clone & Konfigurasi

```bash
git clone https://github.com/<user>/lookup.git
cd lookup
cp .env.example apps/backend/.env
# Edit .env dengan nilai production
nano apps/backend/.env
```

### 2. SSL Certificate

```bash
# Install certbot
apt install certbot
certbot certonly --standalone -d api.yourdomain.com

# Copy cert ke docker/nginx/ssl/
mkdir -p docker/nginx/ssl
cp /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem docker/nginx/ssl/
cp /etc/letsencrypt/live/api.yourdomain.com/privkey.pem docker/nginx/ssl/
```

### 3. Update nginx.conf untuk HTTPS

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    ssl_certificate     /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    location / {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/events/ {
        proxy_pass http://backend:3000;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
    }
}
```

### 4. Deploy

```bash
cd docker
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml logs -f backend
```

---

## Environment Variables — Ringkasan

| Variable | Railway | VPS | Keterangan |
|----------|---------|-----|------------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | PostgreSQL container URL | Auto di Railway |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` | `redis://redis:6379` | Auto di Railway |
| `NODE_ENV` | `production` | `production` | |
| `PORT` | `3000` | `3000` | |
| `API_BASE_URL` | Domain Railway | Domain VPS | Untuk OAuth redirect |
| `JWT_SECRET` | Generate random | Generate random | Min 64 hex chars |
| `JWT_REFRESH_SECRET` | Generate random | Generate random | Berbeda dari JWT_SECRET |
| `ENCRYPTION_KEY` | Generate random | Generate random | Tepat 64 hex chars (32 bytes) |
| `SHOPEE_PARTNER_ID` | Dari Shopee Portal | Sama | |
| `SHOPEE_PARTNER_KEY` | Dari Shopee Portal | Sama | |
| `TIKTOK_APP_KEY` | Dari TikTok Portal | Sama | |
| `TIKTOK_APP_SECRET` | Dari TikTok Portal | Sama | |

---

## Troubleshooting

**`ECONNREFUSED redis`** → Pastikan `REDIS_URL` sudah diisi dengan reference variable Railway, bukan localhost.

**`P1001: Can't reach database`** → Pastikan `DATABASE_URL` pakai reference variable `${{Postgres.DATABASE_URL}}`.

**OAuth callback gagal** → Cek `API_BASE_URL` sudah diisi domain Railway (bukan localhost). Update redirect URI di Shopee/TikTok portal.

**`ENCRYPTION_KEY must be 64 characters`** → Jalankan: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` → hasil 64 karakter.

**Build gagal `prisma generate`** → Pastikan `prisma` ada di `dependencies` (bukan `devDependencies`) di `package.json`.
