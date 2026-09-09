# 🚀 ForStore - Production Launch Runbook

Follow this guide to deploy **ForStore (Cafe Game Store)** to production today.

---

## 1. Architecture Overview

| Application | Directory | Purpose | Recommended Production Domain |
|---|---|---|---|
| **Storefront** | `/storefront` | Marketing landing page, pricing, ROI calculator | `forstore.app` or `www.forstore.app` |
| **Merchant & Admin Portal** | `/admin-panel` | Merchant dashboard, Super Admin control center, Minigames, Staff Scanner, Rewards | `app.forstore.app` |

---

## 2. Environment Variables Checklist

### For `admin-panel`:
Configure these in your cloud hosting provider dashboard (Docker, VPS, Cloud Container, etc.):

| Variable | Description | Example / Production Value |
|---|---|---|
| `MONGODB_URI` | MongoDB Atlas Production Cluster URI | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/cafe-game-store-prod?retryWrites=true&w=majority` |
| `MONGODB_ENV` | Active Database Mode | `prod` |
| `SESSION_SECRET` | 64-char random hex key for HMAC signing | Any secure random string |

### For `storefront`:
Configure these in your storefront hosting project:

| Variable | Description | Value |
|---|---|---|
| `NEXT_PUBLIC_ADMIN_URL` | URL to the live merchant portal | `https://app.forstore.app` (or your chosen admin URL) |

---

## 3. Deploying to Hostinger (Dual Subdomain Setup under Curaflow Studio)

Since your main root domain hosts your **Curaflow Studio** website, both **ForStore applications** run on separate subdomains with **$0 additional cost**:

### Recommended Subdomain Architecture:
* **Root Domain (`curaflow.studio`)**: Unaffected (remains your primary Curaflow Studio website).
* **Subdomain 1 (`forstore.curaflow.studio` or `games.curaflow.studio`)**: **Marketing Storefront** (landing page, ROI calculator, pricing).
* **Subdomain 2 (`app.forstore.curaflow.studio` or `app.curaflow.studio`)**: **Admin & Arcade Engine** (merchant dashboard, customer arcade `/arcade`, games `/play/*`, and scanner `/claim`).

### Environment Variables on Hostinger:
1. **In `admin-panel/.env.local`** (Subdomain 2):
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/cafe-game-store-prod?retryWrites=true&w=majority
   MONGODB_ENV=prod
   SESSION_SECRET=a_secure_random_64_character_hex_string
   PORT=3000
   ```
2. **In `storefront/.env.local`** (Subdomain 1):
   ```env
   # Points directly to Subdomain 2 (Admin Portal & Arcade)
   NEXT_PUBLIC_ADMIN_URL=https://app.curaflow.studio
   PORT=3001
   ```

### Option A: Hostinger VPS (Recommended - 1 Command with PM2)
1. Clone repo onto your Hostinger VPS:
   ```bash
   git clone https://github.com/shivamraut101/Cafe-Game-Store.git
   cd Cafe-Game-Store
   npm install
   npm run build
   ```
2. Start both services simultaneously using the included PM2 configuration:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```
3. In your Nginx configuration on Hostinger, proxy your subdomain to port `3000`:
   ```nginx
   server {
       server_name app.yourdomain.com;
       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Option B: Hostinger Cloud / hPanel (Node.js Application Manager)
1. In Hostinger **hPanel** -> **Domains** -> **Subdomains**: Create your subdomain (e.g. `app`).
2. In **Node.js** app manager:
   - Point application root to `admin-panel`.
   - Set Node version to `20.x`.
   - Set Startup command to `npm start`.
   - Enter your environment variables (`MONGODB_URI`, `MONGODB_ENV=prod`, `SESSION_SECRET`).
3. Click **Deploy**.

---

## 4. Production & Demo Environment Deployment Guide

### Deploying the `prod` Environment:
1. Connect your git repository to your hosting provider.
2. Select the `prod` branch.
3. Set **Root Directory** to `admin-panel`.
4. In **Environment Variables**, configure:
   - `NEXT_PUBLIC_APP_ENV` = `prod`
   - `APP_ENV` = `prod`
   - `MONGODB_URI` = `mongodb+srv://.../cafe-game-store-prod`
   - `SESSION_SECRET` = `<your-secure-secret>`
5. Deploy the application.

### Deploying the `demo` Sandbox Environment:
1. Connect your git repository to your hosting provider.
2. Select the `main` branch (or demo subdomain).
3. Set **Root Directory** to `admin-panel`.
4. In **Environment Variables**, configure:
   - `NEXT_PUBLIC_APP_ENV` = `demo`
   - `APP_ENV` = `demo`
   - `MONGODB_URI` = `mongodb+srv://.../cafe-game-store-demo`
   - `SESSION_SECRET` = `<your-demo-secret>`
5. Deploy the sandbox application.

---

## 4. Default Super Admin & Seed Setup (Optional)

To seed your production database with the initial clean stores and Super Admin account:
```powershell
# In admin-panel directory:
npm run seed:prod
```

### Default Credentials:
- **Super Admin**:
  - Email: `koushik@forstore.app`
  - Password: `super123`
- **Demo Store Admin (Brew & Bites Cafe)**:
  - Email: `manager@brewbites.com`
  - Password: `admin123`

*(Note: Passwords can be customized in `scripts/seed.ts` or accounts can be created fresh via the self-serve signup.)*

---

## 5. Live Production Test Checklist

Before opening to public traffic:
- [ ] **Self-Serve Signup**: On `https://app.forstore.app`, click "Start Free Trial", register a new cafe, and verify 100 scan credits appear in the top-right wallet.
- [ ] **Top-Up Request Flow**: Go to the **Wallet Tab**, click "Top Up via Bank / UPI", enter a test UTR, and submit.
- [ ] **Super Admin Approval**: Log in as Super Admin (`koushik@forstore.app`), locate the request in the approvals table, and click **[✓ Approve & Credit]**. Verify wallet balance updates atomically.
- [ ] **Customer Game Play**: Open `https://app.forstore.app/arcade`, play a round of Coffee Tower or Flappy Barista, and win a voucher.
- [ ] **Cashier QR Scan**: On another device, open `https://app.forstore.app/claim`, click **"📷 SCAN QR CODE"**, point at customer voucher pass, and click **"VERIFY & MARK REDEEMED"**.
- [ ] **CSV Financial Export**: In Super Admin dashboard, click **"📥 Export CSV"** to verify bank statement reconciliation download.
