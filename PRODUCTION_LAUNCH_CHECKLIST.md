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
Configure these in your hosting dashboard (Vercel, Railway, AWS, Docker):

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

## 3. Deploying to Vercel (Recommended 5-Minute Setup)

### Project 1: Deploy `admin-panel`
1. Go to [Vercel Dashboard](https://vercel.com/new) -> **Import Git Repository**.
2. Set **Root Directory** to `admin-panel`.
3. Framework Preset: **Next.js**.
4. In **Environment Variables**, add:
   - `MONGODB_URI`
   - `MONGODB_ENV` = `prod`
   - `SESSION_SECRET`
5. Click **Deploy**.
6. Under **Settings -> Domains**, assign `app.forstore.app` (or your chosen domain).

### Project 2: Deploy `storefront`
1. Go to [Vercel Dashboard](https://vercel.com/new) -> **Import Git Repository** (same repo).
2. Set **Root Directory** to `storefront`.
3. Framework Preset: **Next.js**.
4. In **Environment Variables**, add:
   - `NEXT_PUBLIC_ADMIN_URL` = `https://app.forstore.app`
5. Click **Deploy**.
6. Under **Settings -> Domains**, assign `forstore.app` and `www.forstore.app`.

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
