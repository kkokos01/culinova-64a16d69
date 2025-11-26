# Supabase Setup Guide for Culinova

This guide will help you configure your Supabase project to work with the Culinova application.

## 🚀 Quick Start

1. **Run the Health Check**
   ```bash
   npm run dev
   # Then visit: http://localhost:8080/supabase-health
   ```

2. **Follow the Dashboard Instructions Below**

## 📋 Supabase Dashboard Configuration

### Step 1: Authentication Settings

1. **Navigate to:** Supabase Dashboard → Authentication → Settings

2. **Site URL Configuration:**
   ```
   Site URL: http://localhost:8080
   ```

3. **Redirect URLs (add these exactly):**
   ```
   http://localhost:8080/auth/v1/callback
   https://culinova.app/auth/v1/callback
   ```

### Step 2: Enable Google OAuth

1. **Navigate to:** Authentication → Providers → Google

2. **Enable Google Provider:**
   - Toggle "Enable Google provider" to ON
   - **Client ID:** Your Google OAuth Client ID
   - **Client Secret:** Your Google OAuth Client Secret

3. **If you don't have Google OAuth credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://zujlsbkxxsmiiwgyodph.supabase.co/auth/v1/callback`

### Step 3: Email Configuration

1. **Navigate to:** Authentication → Settings

2. **Email Templates:**
   - Verify the "Confirm signup" template looks good
   - Verify the "Reset password" template includes the reset link

3. **Email Provider:**
   - For development: Use Supabase's built-in email (limited)
   - For production: Configure SMTP or use a service like SendGrid

### Step 4: Row Level Security (RLS)

1. **Navigate to:** Authentication → Policies

2. **Ensure these policies exist:**
   - `recipes` table: Users can read public recipes, manage their own
   - `spaces` table: Users can see spaces they're members of
   - `user_spaces` table: Users can manage their own memberships

### Step 5: Database Schema Verification

1. **Navigate to:** Database → Tables

2. **Verify these tables exist:**
   - `recipes` (recipe metadata)
   - `ingredients` (recipe ingredients)
   - `steps` (cooking instructions)
   - `spaces` (multi-tenant workspaces)
   - `user_spaces` (space memberships)
   - `foods` (food catalog)
   - `units` (measurement units)

## 🔧 Local Environment Setup

1. **Create `.env.local` file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Update `.env.local` with your Supabase credentials:**
   ```env
   VITE_SUPABASE_URL=https://zujlsbkxxsmiiwgyodph.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

## 🧪 Testing Configuration

### Test 1: Health Check
1. Visit: `http://localhost:8080/supabase-health`
2. All checks should show green "Success" status
3. Fix any red "Error" items before proceeding

### Test 2: Email Sign Up
1. Go to: `http://localhost:8080/sign-up`
2. Use a real email address
3. Check your email for verification link
4. Click the link to verify your account

### Test 3: Google OAuth
1. Go to: `http://localhost:8080/sign-in`
2. Click "Sign in with Google"
3. Complete Google authentication
4. Should redirect back to app successfully

### Test 4: Password Reset
1. Go to: `http://localhost:8080/reset-password`
2. Enter your email
3. Check email for reset link
4. Click link and set new password

## 🚨 Troubleshooting

### Common Issues:

**"No routes matched location" error:**
- Ensure redirect URLs are added to Supabase auth settings
- Check that `/auth/v1/callback` route exists in App.tsx

**Email verification not working:**
- Check email templates in Supabase dashboard
- Verify email provider is configured
- Check spam folder

**Google OAuth failing:**
- Verify Google OAuth is enabled in Supabase
- Check redirect URLs match exactly
- Ensure Google Cloud Console has correct redirect URI

**Database connection issues:**
- Verify project URL and anon key are correct
- Check that required tables exist
- Ensure RLS policies aren't too restrictive

### Debug Steps:

1. **Check browser console** (F12) for error messages
2. **Run health check** at `/supabase-health`
3. **Check network tab** for failed API requests
4. **Verify environment variables** are loaded correctly

## 📞 Support

If you encounter issues:

1. Check the health check page for specific error messages
2. Review Supabase dashboard logs
3. Verify all redirect URLs match exactly
4. Ensure email provider is properly configured

## 🔄 Next Steps

After Supabase is configured:

1. Test all authentication flows
2. Create sample recipes using the seed function
3. Verify space management works correctly
4. Test recipe CRUD operations (when implemented)

---

**Project URL:** https://zujlsbkxxsmiiwgyodph.supabase.co  
**Health Check:** http://localhost:8080/supabase-health  
**Auth Callback:** http://localhost:8080/auth/v1/callback
