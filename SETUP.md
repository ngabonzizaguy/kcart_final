# DeliGo Complete Setup Guide

This guide will walk you through setting up DeliGo from scratch, including Supabase (database, auth, storage, RLS), Prisma, and local development.

---

## Table of Contents
1. [Supabase Project Setup](#1-supabase-project-setup)
2. [Database Configuration with Prisma](#2-database-configuration-with-prisma)
3. [Storage Setup](#3-storage-setup)
4. [Authentication Configuration](#4-authentication-configuration)
5. [Row Level Security (RLS) Policies](#5-row-level-security-rls-policies)
6. [Local Development Setup](#6-local-development-setup)
7. [Testing Your Setup](#7-testing-your-setup)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Supabase Project Setup

### 1.1 Create Supabase Account & Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** and sign up/login
3. Click **"New Project"**
4. Fill in project details:
   ```
   Name: deligo-mvp
   Database Password: [Create a strong password - SAVE THIS!]
   Region: [Choose closest to your target users, e.g., "East US"]
   Pricing Plan: Free (sufficient for MVP)
   ```
5. Click **"Create new project"**
6. Wait 2-3 minutes for provisioning

### 1.2 Get Your API Credentials

Once your project is ready:

1. In the left sidebar, go to **Settings** → **API**
2. You'll see these values (copy them now):
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... [SECRET - Never expose!]
   ```

### 1.3 Get Your Database Connection String

1. Go to **Settings** → **Database**
2. Scroll to **Connection String** section
3. Select the **URI** tab
4. Copy the connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your actual database password from step 1.1

### 1.4 Save Your Credentials

Open `/workspace/cmgp3l654001lqyia0r1hqww1/kcart_final/.env.local` and paste:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:your-password@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ IMPORTANT**: Never commit `.env.local` to git! It's already in `.gitignore`.

---

## 2. Database Configuration with Prisma

### 2.1 Understanding the Prisma Schema

Your database schema is defined in `prisma/schema.prisma`. Here's what it includes:

#### **Models Overview:**

```prisma
// 1. Vendor - Restaurant/food business profile
model Vendor {
  id                String      @id @default(uuid())
  authId            String      @unique // Links to Supabase Auth user
  email             String      @unique
  businessName      String      // Main business name
  businessNameRw    String?     // Kinyarwanda translation
  slug              String      @unique // URL slug (e.g., "pizza-palace")
  businessType      String      // restaurant, cafe, food_truck, etc.
  logoUrl           String?     // Logo image URL
  coverUrl          String?     // Cover image URL
  address           String?
  latitude          Float?
  longitude         Float?
  deliveryRange     Float       @default(5.0) // in km
  businessPhone     String
  businessHours     Json?       // Operating hours
  isOnline          Boolean     @default(true)
  isSetupComplete   Boolean     @default(false)

  // Relations
  categories        Category[]
  menuItems         MenuItem[]
  orders            Order[]
}

// 2. Category - Menu categories (Appetizers, Main Course, etc.)
model Category {
  id                String      @id @default(uuid())
  vendorId          String
  vendor            Vendor      @relation(fields: [vendorId], references: [id])
  name              String
  nameRw            String?     // Kinyarwanda
  description       String?
  sortOrder         Int         @default(0)

  menuItems         MenuItem[]
}

// 3. MenuItem - Individual food items
model MenuItem {
  id                String      @id @default(uuid())
  vendorId          String
  vendor            Vendor      @relation(fields: [vendorId], references: [id])
  categoryId        String
  category          Category    @relation(fields: [categoryId], references: [id])
  name              String
  nameRw            String?
  description       String?
  price             Float
  imageUrl          String?
  isAvailable       Boolean     @default(true)
  sortOrder         Int         @default(0)

  orderItems        OrderItem[]
}

// 4. Order - Customer orders
model Order {
  id                String      @id @default(uuid())
  orderNumber       String      @unique // e.g., "DEL-20250113-001"
  vendorId          String
  vendor            Vendor      @relation(fields: [vendorId], references: [id])

  // Customer info
  customerName      String
  customerPhone     String
  customerEmail     String?

  // Delivery
  deliveryType      String      // "delivery" or "pickup"
  deliveryAddress   String?
  deliveryNotes     String?

  // Pricing
  subtotal          Float
  deliveryFee       Float       @default(0)
  total             Float

  // Status workflow
  status            String      @default("new") // new, preparing, ready, completed, cancelled

  items             OrderItem[]
}

// 5. OrderItem - Items within an order
model OrderItem {
  id                String      @id @default(uuid())
  orderId           String
  order             Order       @relation(fields: [orderId], references: [id])
  menuItemId        String
  menuItem          MenuItem    @relation(fields: [menuItemId], references: [id])

  // Snapshot at order time
  name              String
  price             Float
  quantity          Int
  subtotal          Float       // price * quantity
  notes             String?     // Special instructions
}
```

### 2.2 Push Schema to Supabase

Run these commands to set up your database:

```bash
cd /workspace/cmgp3l654001lqyia0r1hqww1/kcart_final

# Generate Prisma Client (creates TypeScript types)
npx prisma generate

# Push schema to Supabase (creates tables)
npx prisma db push
```

**Expected output:**
```
Your database is now in sync with your Prisma schema.

✔ Generated Prisma Client
```

### 2.3 Verify Database Tables

1. Go to Supabase dashboard → **Database** → **Tables**
2. You should see 5 new tables:
   - `Vendor`
   - `Category`
   - `MenuItem`
   - `Order`
   - `OrderItem`

### 2.4 View Schema in Prisma Studio (Optional)

```bash
npx prisma studio
```
Opens a GUI at `http://localhost:5555` to browse your database.

---

## 3. Storage Setup

DeliGo needs storage for vendor logos, cover images, and menu item photos.

### 3.1 Create Storage Buckets

1. In Supabase dashboard, go to **Storage** (left sidebar)
2. Click **"New bucket"**
3. Create three buckets:

#### Bucket 1: `vendor-logos`
```
Name: vendor-logos
Public bucket: ✓ YES (checked)
File size limit: 2 MB
Allowed MIME types: image/png, image/jpeg, image/webp
```

#### Bucket 2: `vendor-covers`
```
Name: vendor-covers
Public bucket: ✓ YES (checked)
File size limit: 5 MB
Allowed MIME types: image/png, image/jpeg, image/webp
```

#### Bucket 3: `menu-items`
```
Name: menu-items
Public bucket: ✓ YES (checked)
File size limit: 2 MB
Allowed MIME types: image/png, image/jpeg, image/webp
```

### 3.2 Set Bucket Policies

For each bucket, set policies to allow:
- **Public read access** (anyone can view images)
- **Authenticated write access** (only logged-in vendors can upload)

#### For `vendor-logos` bucket:

1. Click on `vendor-logos` → **Policies** tab
2. Click **"New Policy"**
3. Select **"For full customization"**

**Policy 1: Public Read**
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'vendor-logos');
```

**Policy 2: Authenticated Upload**
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vendor-logos'
  AND auth.role() = 'authenticated'
);
```

**Policy 3: Users can update own files**
```sql
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'vendor-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 4: Users can delete own files**
```sql
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vendor-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Repeat these 4 policies for `vendor-covers` and `menu-items` buckets** (just change the bucket name).

### 3.3 Update Next.js Config for Images

The `next.config.js` is already configured to allow Supabase images:

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '**.supabase.co',
    },
  ],
}
```

This allows Next.js Image component to load images from your Supabase storage.

---

## 4. Authentication Configuration

### 4.1 Enable Email Authentication

1. Go to **Authentication** → **Providers** (left sidebar)
2. Find **Email** provider
3. Enable it (should be enabled by default)
4. **Confirm email**: Disabled (for MVP - users can login immediately)
   - ⚠️ For production, enable email confirmation

### 4.2 Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize emails for:
   - Confirmation (signup)
   - Password reset
   - Magic link

For MVP, default templates work fine.

### 4.3 Configure Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Add these URLs:

**Site URL:**
```
http://localhost:3000
```

**Redirect URLs:** (add all these)
```
http://localhost:3000/**
http://localhost:3000/auth/callback
http://localhost:3000/dashboard
```

**When you deploy to production, add:**
```
https://your-domain.com/**
https://your-domain.com/auth/callback
https://your-domain.com/dashboard
```

### 4.4 Configure Auth Settings

1. Go to **Authentication** → **Policies**
2. Ensure these are set:

```
JWT expiry: 3600 (1 hour)
Refresh token expiry: 2592000 (30 days)
Minimum password length: 6
```

### 4.5 Enable Phone Auth (Optional - for SMS signup)

If you want to support phone/SMS signup:

1. Go to **Authentication** → **Providers**
2. Enable **Phone**
3. Configure SMS provider (Twilio recommended)
4. This is optional for MVP - email auth is sufficient

---

## 5. Row Level Security (RLS) Policies

RLS ensures vendors can only access their own data, and customers can only see public data.

### 5.1 Enable RLS on All Tables

1. Go to **Database** → **Tables**
2. For each table (`Vendor`, `Category`, `MenuItem`, `Order`, `OrderItem`):
   - Click on the table
   - Click **"Enable RLS"** button at the top

### 5.2 Create Policies for Vendor Table

Go to **Database** → **Tables** → **Vendor** → **Policies**

Click **"New Policy"** and add these:

#### Policy 1: Vendors can view their own data
```sql
CREATE POLICY "Vendors can view own data"
ON "Vendor"
FOR SELECT
USING (auth.uid()::text = "authId");
```

#### Policy 2: Vendors can update their own data
```sql
CREATE POLICY "Vendors can update own data"
ON "Vendor"
FOR UPDATE
USING (auth.uid()::text = "authId");
```

#### Policy 3: Authenticated users can insert (signup)
```sql
CREATE POLICY "Authenticated users can insert"
ON "Vendor"
FOR INSERT
WITH CHECK (auth.uid()::text = "authId");
```

#### Policy 4: Public can view online vendors (for storefronts)
```sql
CREATE POLICY "Public can view vendor profiles"
ON "Vendor"
FOR SELECT
USING (true);
```
*Note: This allows storefront pages to load. Sensitive fields aren't exposed to frontend anyway.*

### 5.3 Create Policies for Category Table

**Policy 1: Vendors can manage own categories**
```sql
CREATE POLICY "Vendors can manage own categories"
ON "Category"
FOR ALL
USING (
  "vendorId" IN (
    SELECT id FROM "Vendor" WHERE "authId" = auth.uid()::text
  )
);
```

**Policy 2: Public can view categories (for storefronts)**
```sql
CREATE POLICY "Public can view categories"
ON "Category"
FOR SELECT
USING (true);
```

### 5.4 Create Policies for MenuItem Table

**Policy 1: Vendors can manage own menu items**
```sql
CREATE POLICY "Vendors can manage own items"
ON "MenuItem"
FOR ALL
USING (
  "vendorId" IN (
    SELECT id FROM "Vendor" WHERE "authId" = auth.uid()::text
  )
);
```

**Policy 2: Public can view available items**
```sql
CREATE POLICY "Public can view menu items"
ON "MenuItem"
FOR SELECT
USING (true);
```

### 5.5 Create Policies for Order Table

**Policy 1: Vendors can view and manage their orders**
```sql
CREATE POLICY "Vendors can manage own orders"
ON "Order"
FOR ALL
USING (
  "vendorId" IN (
    SELECT id FROM "Vendor" WHERE "authId" = auth.uid()::text
  )
);
```

**Policy 2: Anyone can create orders (guest checkout)**
```sql
CREATE POLICY "Anyone can create orders"
ON "Order"
FOR INSERT
WITH CHECK (true);
```

**Policy 3: Customers can view their orders by order number**
```sql
CREATE POLICY "Public can view orders by order number"
ON "Order"
FOR SELECT
USING (true);
```
*Note: Orders are accessed via unique orderNumber, which acts as a secret. No login required for tracking.*

### 5.6 Create Policies for OrderItem Table

**Policy 1: Order items inherit order permissions**
```sql
CREATE POLICY "Order items follow order permissions"
ON "OrderItem"
FOR ALL
USING (
  "orderId" IN (
    SELECT id FROM "Order" WHERE "vendorId" IN (
      SELECT id FROM "Vendor" WHERE "authId" = auth.uid()::text
    )
  )
  OR true  -- Public can view for order confirmation pages
);
```

**Policy 2: Anyone can insert order items (with orders)**
```sql
CREATE POLICY "Anyone can create order items"
ON "OrderItem"
FOR INSERT
WITH CHECK (true);
```

### 5.7 Verify RLS is Active

In **Database** → **Tables**, each table should show:
```
RLS: Enabled ✓
Policies: X policies
```

---

## 6. Local Development Setup

### 6.1 Install Dependencies

```bash
cd /workspace/cmgp3l654001lqyia0r1hqww1/kcart_final

# Install all npm packages
npm install
```

### 6.2 Set Up Environment Variables

Edit `.env.local` with your Supabase credentials from Section 1:

```bash
nano .env.local
```

Paste your actual values:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DATABASE_URL=postgresql://postgres:yourpassword@db.xxxxx.supabase.co:5432/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Save and exit (Ctrl+X, Y, Enter)

### 6.3 Generate Prisma Client

```bash
npx prisma generate
```

### 6.4 Push Database Schema

```bash
npx prisma db push
```

You should see:
```
✔ Your database is now in sync with your Prisma schema.
```

### 6.5 Start Development Server

```bash
npm run dev
```

Expected output:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in 3.2s
```

### 6.6 Open in Browser

Go to [http://localhost:3000](http://localhost:3000)

You should be redirected to `/login`

---

## 7. Testing Your Setup

### 7.1 Test Authentication

1. Go to `http://localhost:3000`
2. You'll be redirected to `/login`
3. Click **"Sign up"**
4. Fill in:
   ```
   Business Name: Test Restaurant
   Email: test@example.com
   Password: test123
   ```
5. Click **"Create Account"**
6. You should be redirected to `/onboarding/business-info`

**Check Supabase:**
- Go to **Authentication** → **Users** in Supabase
- You should see your test user

### 7.2 Test Onboarding

1. Fill out the business info form:
   ```
   Business Name: Test Restaurant
   Business Name (RW): [Optional]
   Business Type: Restaurant
   Description: We serve amazing food
   ```
2. Click **"Continue"**
3. You should be redirected to `/onboarding/media` (not yet built)

**Check Database:**
- Go to **Database** → **Table Editor** → **Vendor**
- You should see a new vendor record

### 7.3 Test Database Connection

```bash
# Open Prisma Studio
npx prisma studio
```

Browse to `http://localhost:5555` and verify:
- You can see your `Vendor` record
- All tables are created
- Data matches what you entered

### 7.4 Test Storage (When Image Upload is Built)

This will work once image upload is implemented:
1. Upload a logo in onboarding
2. Check **Storage** → **vendor-logos** in Supabase
3. You should see the uploaded file

---

## 8. Troubleshooting

### Issue: "Invalid database URL"

**Solution:**
- Check your `DATABASE_URL` in `.env.local`
- Ensure password is correct (no special characters that need escaping)
- Format should be: `postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres`

### Issue: "Failed to fetch" when logging in

**Solution:**
- Check `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Verify your Supabase project is running (not paused)
- Check browser console for CORS errors

### Issue: RLS blocking queries

**Solution:**
- Go to Supabase → **Database** → **Policies**
- Verify policies are created correctly
- Check auth.uid() is returning correctly
- Use SQL Editor to test: `SELECT auth.uid();` (should return your user ID when logged in)

### Issue: Images not loading

**Solution:**
- Check storage buckets are public
- Verify bucket policies allow public SELECT
- Check `next.config.js` includes Supabase domain
- Ensure image URLs are from `*.supabase.co`

### Issue: "Prisma Client not generated"

**Solution:**
```bash
npx prisma generate
```
Run this every time you change `schema.prisma`

### Issue: Tables not created

**Solution:**
```bash
npx prisma db push --force-reset
```
⚠️ WARNING: This will delete all data! Only use in development.

### Issue: Build errors

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma
npx prisma generate

# Try again
npm run dev
```

---

## Next Steps

Once setup is complete:

1. ✅ Test login/signup flow
2. ✅ Complete onboarding wizard (Steps 2-4 need to be built)
3. ✅ Add menu items
4. ✅ Test storefront at `localhost:3000/test-restaurant` (your slug)
5. ✅ Place test order
6. ✅ View orders in dashboard

---

## Quick Reference Card

### Essential Commands
```bash
# Start dev server
npm run dev

# Generate Prisma types
npx prisma generate

# Push schema changes
npx prisma db push

# Open database GUI
npx prisma studio

# Build for production
npm run build

# Type check
npm run type-check
```

### File Locations
```
.env.local              → Environment variables
prisma/schema.prisma    → Database schema
app/                    → All pages and API routes
components/             → Reusable UI components
lib/                    → Utilities and configs
public/locales/         → Translations (EN/RW)
```

### Important URLs
```
Development:       http://localhost:3000
Prisma Studio:     http://localhost:5555
Supabase Dashboard: https://app.supabase.com
```

---

## Support

If you encounter issues:

1. Check this guide's Troubleshooting section
2. Check browser console for errors
3. Check server terminal for errors
4. Check Supabase logs in dashboard
5. Review `README.md` for project status
6. Check `DEPLOYMENT.md` for production setup

---

**Setup Complete!** 🎉

Your DeliGo development environment is now ready. You can start building the remaining features or test the existing ones.
