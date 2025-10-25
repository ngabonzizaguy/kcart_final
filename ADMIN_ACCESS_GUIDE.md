# Admin Dashboard Access Guide

## Overview

The DeliGo platform includes a secure admin dashboard for platform management. Access is controlled through database records and middleware authentication checks.

## How Admin Access Works

### Architecture

**Database Model: Admin**
- Location: Prisma schema
- Required fields:
  - `id` - Unique identifier (UUID)
  - `authId` - Links to Supabase Auth user ID (must match authenticated user)
  - `email` - Admin email address
  - `name` - Admin display name
  - `role` - Admin role level (for future role-based permissions)
  - `lastLoginAt` - Timestamp of last access

**Key Concept:** Admin access is determined by the presence of an Admin record in the database with matching `authId` to the Supabase authenticated user.

## Access Flow

### Step-by-Step Process

1. **User Authentication**
   - User logs in at `/login` with email and password
   - Supabase Auth validates credentials and creates session
   - Session cookie stored in browser
   - User redirected to `/dashboard` (default vendor dashboard)

2. **Admin Route Access Attempt**
   - User navigates to any `/admin/*` route (e.g., `/admin/vendors`)
   - Middleware (`middleware.ts` lines 38-62) intercepts request

3. **Admin Authorization Check**
   - Middleware calls database query for Admin record
   - Queries: `Admin` table where `authId` matches current user's Supabase auth ID
   - Two possible outcomes:
     - **Admin record exists:** User has admin access
     - **No admin record:** User does NOT have admin access

4. **Access Decision**
   - **If admin record exists:**
     - Update `lastLoginAt` timestamp
     - Serve admin dashboard page
     - User sees admin interface
   - **If no admin record:**
     - Redirect to `/unauthorized` page
     - Show error message
     - User cannot access admin features

## Admin Dashboard Routes

### Available Pages

1. **Analytics** (`/admin/analytics`)
   - Platform-wide analytics and metrics

2. **Vendors** (`/admin/vendors`)
   - Manage all vendors
   - Approve/disable accounts

3. **Orders** (`/admin/orders`)
   - View all orders across all vendors

4. **Customers** (`/admin/customers`)
   - Customer data and management

5. **Payouts** (`/admin/payouts`)
   - Vendor payout management

6. **Logs** (`/admin/logs`)
   - System logs and audit trail

7. **Settings** (`/admin/settings`)
   - Platform configuration

### API Protection

All `/api/admin/*` endpoints use `requireAdmin()` middleware from `lib/auth/roleCheck.ts` for protection.

## Creating Admin Accounts

**Important:** There is NO admin signup UI. Admin accounts must be created manually.

### Method 1: Direct Database Insert (Development/Initial Setup)

1. User must first have a Supabase Auth account (sign up at `/signup`)
2. Note the user's Supabase Auth ID from Supabase dashboard
3. Connect to PostgreSQL database
4. Insert Admin record:

```sql
INSERT INTO "Admin" (id, "authId", email, name, role, "lastLoginAt")
VALUES (
  gen_random_uuid(),              -- Generate UUID for id
  'USER_SUPABASE_AUTH_ID_HERE',  -- Replace with actual Supabase auth ID
  'admin@example.com',            -- Admin email
  'Admin Name',                   -- Display name
  'super_admin',                  -- Role (for future use)
  NOW()                           -- Current timestamp
);
```

### Method 2: Via Prisma (Recommended for Development)

Create a seed script or admin creation endpoint:

```typescript
await prisma.admin.create({
  data: {
    authId: 'SUPABASE_USER_AUTH_ID',
    email: 'admin@example.com',
    name: 'Admin Name',
    role: 'super_admin',
    lastLoginAt: new Date()
  }
})
```

### Finding User's Auth ID

**Option 1: Supabase Dashboard**
1. User signs up normally at `/signup`
2. Open Supabase Auth dashboard
3. Navigate to Users list
4. Find user and copy their UID (this is the authId)

**Option 2: Database Query**
1. User signs up and logs in as vendor
2. Query Vendor table: `SELECT authId FROM Vendor WHERE email = 'user@example.com'`
3. Use that authId to create Admin record

## Testing Admin Access

### Test 1: Admin User Access

**Prerequisites:** Admin account created in database

**Steps:**
1. Login with admin user credentials at `/login`
2. Navigate to `/admin/vendors` via browser address bar
3. Verify: Admin vendors page loads successfully
4. Test all admin routes:
   - `/admin/analytics`
   - `/admin/orders`
   - `/admin/customers`
   - `/admin/payouts`
   - `/admin/logs`
   - `/admin/settings`
5. Verify: All pages accessible

**Expected Result:** ✅ Admin dashboard fully accessible

### Test 2: Regular Vendor Access (Unauthorized)

**Prerequisites:** Regular vendor account (no Admin record)

**Steps:**
1. Login with vendor credentials at `/login`
2. Navigate to `/admin/vendors` via browser address bar
3. Verify: Redirected to `/unauthorized` page
4. Try other admin routes
5. Verify: All redirect to `/unauthorized`

**Expected Result:** ✅ Admin features blocked, appropriate error shown

### Test 3: Logout and Re-login

**Steps:**
1. Login as admin user
2. Access admin dashboard
3. Logout using logout button
4. Try accessing `/admin/vendors` again
5. Verify: Redirected to `/login?redirect=/admin/vendors`
6. Login again
7. Verify: Redirected back to `/admin/vendors`

**Expected Result:** ✅ Auth flow works correctly

## URL Navigation and Deep Linking

### Route Structure

|
 Route Pattern 
|
 Logged Out 
|
 Logged In (Vendor) 
|
 Logged In (Admin) 
|
|
--------------
|
------------
|
-------------------
|
------------------
|
|
`/`
|
 → 
`/login`
|
 → 
`/dashboard`
|
 → 
`/dashboard`
|
|
`/login`
|
 Show login 
|
 → 
`/dashboard`
|
 → 
`/dashboard`
|
|
`/signup`
|
 Show signup 
|
 → 
`/dashboard`
|
 → 
`/dashboard`
|
|
`/{slug}`
|
 Show storefront 
|
 Show storefront 
|
 Show storefront 
|
|
`/{slug}/checkout`
|
 Show checkout 
|
 Show checkout 
|
 Show checkout 
|
|
`/orders/{num}`
|
 Show tracking 
|
 Show tracking 
|
 Show tracking 
|
|
`/dashboard/*`
|
 → 
`/login?redirect=`
|
 Show dashboard 
|
 Show dashboard 
|
|
`/admin/*`
|
 → 
`/login?redirect=`
|
 → 
`/unauthorized`
|
 Show admin panel 
|

### Deep Linking Features

**Direct URL Access:**
Users can type any route directly in browser address bar and will be properly routed based on authentication status.

**Redirect Parameter:**
When unauthenticated users try to access protected routes:
- They're redirected to `/login?redirect=/original/path`
- After successful login, automatically redirected to original destination
- Example: Trying `/dashboard/orders` → `/login?redirect=/dashboard/orders` → After login → `/dashboard/orders`

**Browser Navigation:**
- Back/forward buttons work correctly
- Page refresh maintains current route
- All routes work with direct URL entry

## Security Considerations

### Important Security Notes

1. **Never expose admin creation endpoint publicly**
   - Admin accounts should be created via secure methods only
   - No public registration for admin accounts

2. **Always validate admin access server-side**
   - Never trust client-side checks
   - Middleware verifies every admin request

3. **Admin accounts should use strong passwords**
   - Enforce Supabase Auth password requirements
   - Consider implementing 2FA (future enhancement)

4. **Log all admin actions**
   - Use `/admin/logs` for audit trail
   - Track all administrative operations

5. **Regularly review admin accounts**
   - Remove inactive or unnecessary admin accounts
   - Audit access patterns

6. **AuthId must match exactly**
   - Case-sensitive UUID
   - Must exactly match Supabase auth user ID

## Troubleshooting

### Issue: Admin access not working after creating Admin record

**Solution:**
- Verify `authId` matches exactly (case-sensitive UUID)
- Check user is logged in with correct account
- Verify database connection is working
- Ensure Prisma client is up to date
- Query database directly to confirm Admin record exists

### Issue: Admin redirected to /unauthorized

**Solution:**
- Confirm Admin record exists in database
- Verify `authId` field matches current user's Supabase auth ID
- Check for typos in authId (must be exact match)
- Run query: `SELECT * FROM Admin WHERE authId = 'USER_AUTH_ID'`

### Issue: How to find user's authId

**Solution:**
- **Method 1:** Supabase Auth dashboard → Users → Find user → Copy UID
- **Method 2:** User logs in, check database Vendor record (has authId)
- **Method 3:** Log `session.user.id` in middleware during debugging

### Issue: Regular vendor sees admin navigation

**Solution:**
- Client components should query user role before showing admin links
- Add admin check to navigation components
- Ensure UI respects authorization state

## Production Setup Recommendations

### Initial Deployment

1. **Create super admin account** via database migration or seed script
2. Super admin can access admin panel after deployment
3. **Build admin user management UI** (future enhancement)
4. Super admin creates additional accounts via UI
5. **Implement role-based permissions** (super_admin, admin, moderator)
6. **Add activity logging** for all admin actions
7. **Implement session timeout** for security
8. **Consider 2FA requirement** for admin accounts

### Role Hierarchy (Future Enhancement)

- `super_admin` - Full platform control
- `admin` - Standard administrative access
- `moderator` - Limited moderation capabilities
- `support` - Customer support access only

## Implementation Files Reference

### Authentication & Authorization

- `middleware.ts` (lines 38-62) - Admin route protection
- `lib/auth/roleCheck.ts` - Role checking utilities (`requireAdmin` function)
- `lib/supabase/server.ts` - Server-side Supabase client
- `app/unauthorized/page.tsx` - Unauthorized access page

### Admin Pages

- `app/admin/analytics/page.tsx`
- `app/admin/vendors/page.tsx`
- `app/admin/orders/page.tsx`
- `app/admin/customers/page.tsx`
- `app/admin/payouts/page.tsx`
- `app/admin/logs/page.tsx`
- `app/admin/settings/page.tsx`

### Admin API Routes

- `app/api/admin/*` - Protected admin API endpoints

### Database

- Prisma schema defines Admin model
- PostgreSQL stores Admin records

## Summary

Admin access is secure, database-driven, and properly protected by middleware. To grant admin access:

1. Create Supabase Auth account for user
2. Get their auth ID from Supabase dashboard
3. Insert Admin record in database with matching authId
4. User can now access `/admin/*` routes after logging in

Regular vendors without Admin records will be redirected to `/unauthorized` when attempting to access admin features.