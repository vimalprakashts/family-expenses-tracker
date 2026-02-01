# Deployment Guide

## Quick Start

### Prerequisites
1. Cloudflare account
2. Supabase project credentials ([create one](https://supabase.com/dashboard))
3. GitHub repository access

### Step 1: Get Your Supabase Credentials

From your Supabase project (Dashboard > Settings > API):
- **VITE_SUPABASE_URL**: Your project URL (e.g., `https://xxxxx.supabase.co`)
- **VITE_SUPABASE_ANON_KEY**: Your anon/public key

### Step 2: Deploy via Cloudflare Dashboard

1. **Go to Cloudflare Dashboard**
   - Navigate to https://dash.cloudflare.com
   - Go to **Workers & Pages** > **Create** > **Pages** > **Connect to Git**

2. **Connect Repository**
   - Select your repository
   - Branch: `main`

3. **Configure Build Settings**
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: (leave empty)

4. **Add Environment Variables**
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

5. **Save and Deploy**

6. **Configure Custom Domain** (optional)
   - Custom domains > Set up a custom domain
   - Enter your domain

### Step 3: Update Supabase Auth Settings

1. **Supabase Dashboard** > Authentication > URL Configuration
2. Add your deployment URL to **Redirect URLs**: `https://your-app.pages.dev/auth/callback`
3. Set **Site URL** to your app URL

### Step 4: Verify Deployment

1. Visit your deployed URL
2. Test Google OAuth login (if configured)
3. Verify dashboard loads correctly

## Alternative: GitHub Actions Deployment

See `.github/workflows/cloudflare-pages.yml` for the workflow. Add these secrets to your repository:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Environment Variables Reference

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase Dashboard > Settings > API |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase Dashboard > Settings > API |

## Troubleshooting

### Build Fails
- Ensure build command is: `npm run build` and output directory is `dist`
- Verify Node.js version (20.x recommended)
- Check environment variables are set

### OAuth Not Working
- Verify redirect URL in Supabase matches your deployment URL + `/auth/callback`
- Check Google OAuth settings have the correct redirect URI
- Clear browser cache

### Domain Not Loading
- Verify DNS configuration
- Check Cloudflare SSL/TLS settings (Full or Full strict)
