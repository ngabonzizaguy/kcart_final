# DeliGo Deployment Guide

## Prerequisites
- Vercel account (free tier works)
- Supabase project (free tier works)
- Domain (optional)

## Step 1: Set Up Supabase

### 1.1 Create Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Save your project credentials:
   - Project URL
   - Anon public key
   - Service role key (keep secret!)

### 1.2 Configure Database
1. In Supabase dashboard → SQL Editor
2. Copy and paste the Prisma schema to understand structure
3. Run Prisma migrations:
   ```bash
   npx prisma db push
   ```

### 1.3 Set Up Storage
1. In Supabase dashboard → Storage
2. Create buckets:
   - `vendor-logos`
   - `vendor-covers`
   - `menu-items`
3. Set bucket policies to public read

### 1.4 Set Up Auth
1. In Supabase dashboard → Authentication
2. Enable email auth
3. (Optional) Enable phone auth for SMS signup
4. Configure redirect URLs:
   - Add your Vercel domain: `https://your-app.vercel.app/**`

### 1.5 Row Level Security (RLS)
Add these policies in Supabase dashboard → Database → Policies:

**Vendor table:**
```sql
-- Vendors can read their own data
CREATE POLICY "Vendors can view own data"
ON vendor FOR SELECT
USING (auth.uid() = auth_id);

-- Vendors can update their own data
CREATE POLICY "Vendors can update own data"
ON vendor FOR UPDATE
USING (auth.uid() = auth_id);

-- Allow insert for new vendors
CREATE POLICY "Allow insert for authenticated users"
ON vendor FOR INSERT
WITH CHECK (auth.uid() = auth_id);
```

**Category table:**
```sql
-- Vendors can manage own categories
CREATE POLICY "Vendors can manage own categories"
ON category FOR ALL
USING (
  vendor_id IN (
    SELECT id FROM vendor WHERE auth_id = auth.uid()
  )
);
```

**MenuItem table:**
```sql
-- Vendors can manage own menu items
CREATE POLICY "Vendors can manage own menu items"
ON menu_item FOR ALL
USING (
  vendor_id IN (
    SELECT id FROM vendor WHERE auth_id = auth.uid()
  )
);
```

**Order table:**
```sql
-- Vendors can view and update own orders
CREATE POLICY "Vendors can manage own orders"
ON "order" FOR ALL
USING (
  vendor_id IN (
    SELECT id FROM vendor WHERE auth_id = auth.uid()
  )
);

-- Anyone can create orders (customers)
CREATE POLICY "Anyone can create orders"
ON "order" FOR INSERT
WITH CHECK (true);

-- Anyone can view orders they created
CREATE POLICY "Customers can view own orders"
ON "order" FOR SELECT
USING (customer_email = auth.email() OR auth.uid() IS NOT NULL);
```

## Step 2: Deploy to Vercel

### 2.1 Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit - DeliGo MVP"
git branch -M main
git remote add origin your-github-repo-url
git push -u origin main
```

### 2.2 Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure project:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 2.3 Add Environment Variables
In Vercel dashboard → Settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=your-postgres-connection-string
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 2.4 Deploy
Click "Deploy" and wait for build to complete.

## Step 3: Post-Deployment Setup

### 3.1 Update Supabase Redirect URLs
In Supabase dashboard → Authentication → URL Configuration:
- Add your Vercel URL to redirect URLs
- Add to site URL

### 3.2 Test Core Flows
1. Sign up new vendor
2. Complete onboarding
3. View dashboard
4. Check storefront at `your-app.vercel.app/vendor-slug`

### 3.3 Custom Domain (Optional)
1. In Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Configure DNS records
4. Update `NEXT_PUBLIC_APP_URL` environment variable
5. Update Supabase redirect URLs

## Step 4: Monitoring & Maintenance

### 4.1 Vercel Analytics
Enable in Vercel dashboard → Analytics

### 4.2 Error Tracking
Consider adding:
- Sentry for error tracking
- Vercel Speed Insights

### 4.3 Database Backups
Supabase automatically backs up free tier projects daily.
For production:
- Upgrade to Pro for point-in-time recovery
- Enable daily backups

## Troubleshooting

### Issue: Auth not working
- Check Supabase redirect URLs include your domain
- Verify environment variables are correct
- Check browser console for CORS errors

### Issue: Database queries failing
- Verify DATABASE_URL is correct
- Run `npx prisma generate` locally
- Check RLS policies in Supabase

### Issue: Images not loading
- Verify Supabase Storage buckets exist
- Check bucket policies (should be public read)
- Update next.config.js with Supabase domain

### Issue: Build fails on Vercel
- Check package.json dependencies
- Verify all imports are correct
- Look at build logs for specific errors

## Security Checklist
- [ ] RLS policies enabled on all tables
- [ ] Service role key is secret (not in client code)
- [ ] CORS configured correctly in Supabase
- [ ] Input validation on all API routes
- [ ] Rate limiting on sensitive endpoints (add later)
- [ ] SQL injection prevention (Prisma handles this)

## Performance Optimization
- [ ] Enable Next.js Image Optimization
- [ ] Set up CDN for static assets
- [ ] Enable Vercel Edge Functions (if needed)
- [ ] Optimize database queries with indexes
- [ ] Implement caching strategy

## Scaling Considerations
- Supabase free tier limits:
  - 500MB database
  - 1GB file storage
  - 2GB bandwidth/month
- Upgrade to Pro ($25/mo) for production use
- Vercel free tier:
  - 100GB bandwidth/month
  - Unlimited deployments
  - Upgrade to Pro ($20/mo) for team features

## Next Steps After Deployment
1. Set up monitoring
2. Create test vendors
3. Gather feedback
4. Iterate on features
5. Market to real users

## Support
For issues:
- Check Vercel deployment logs
- Check Supabase logs
- Review Next.js documentation
- Check Prisma documentation
