# Cloudflare Pages Deployment Guide

## Prerequisites

1. **Cloudflare Account**: Sign up at https://dash.cloudflare.com
2. **Cloudflare API Token**: 
   - Go to https://dash.cloudflare.com/profile/api-tokens
   - Click "Create Token"
   - Use "Edit Cloudflare Workers" template
   - Add permissions: Account > Cloudflare Pages > Edit
   - Save the token securely

3. **GitHub Secrets** (if using GitHub Actions):
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID (found in dashboard URL)
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

## Deployment Options

### Option 1: Cloudflare Dashboard (Recommended)

1. Go to https://dash.cloudflare.com
2. Navigate to **Workers & Pages** > **Create** > **Pages** > **Connect to Git**
3. Select your repository: `vimalprakashts/family-expenses-tracker`
4. Configure build settings:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty or set to root)
5. Add environment variables:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
6. Click **Save and Deploy**

### Option 2: Wrangler CLI

1. Install Wrangler:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Set environment variables:
   ```bash
   wrangler pages secret put VITE_SUPABASE_URL
   wrangler pages secret put VITE_SUPABASE_ANON_KEY
   ```

4. Deploy:
   ```bash
   npm run build
   wrangler pages deploy dist --project-name=family-expenses-tracker
   ```

### Option 3: GitHub Actions (Automated)

The workflow file is already created at `.github/workflows/cloudflare-pages.yml`

1. Add secrets to your GitHub repository:
   - Go to Settings > Secrets and variables > Actions
   - Add all required secrets (see Prerequisites)

2. Push to `main` branch - deployment will happen automatically

## Environment Variables

Required environment variables for Cloudflare Pages:

- `VITE_SUPABASE_URL`: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon/public key

## Custom Domain Setup

1. In Cloudflare Pages dashboard, go to your project
2. Click **Custom domains** > **Set up a custom domain**
3. Enter your domain (e.g., `family.yourdomain.com`)
4. Follow DNS configuration instructions
5. Cloudflare will automatically configure DNS if the domain is already in your Cloudflare account

## Build Configuration

- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Node version**: 20.x (recommended)

## Troubleshooting

### Build fails
- Check that all environment variables are set
- Verify Node.js version is 20.x
- Check build logs in Cloudflare dashboard

### Environment variables not working
- Ensure variables are prefixed with `VITE_` for Vite apps
- Re-deploy after adding new variables
- Check variable names match exactly (case-sensitive)

### OAuth redirect issues
- Update Supabase redirect URL to include your custom domain
- Format: `https://your-domain.com/auth/callback`
- Go to Supabase Dashboard > Authentication > URL Configuration
- Add your deployment URL + `/auth/callback` to "Redirect URLs"
