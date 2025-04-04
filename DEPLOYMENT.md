# Deployment Guide for Rudo CrossFit Coach Platform

This guide will walk you through the complete setup process for the Rudo platform, including database setup and testing the coach/athlete flow.

## Prerequisites

- Node.js (v16+) and npm (v8+)
- Supabase account (free tier is sufficient)
- Git

## 1. Setting Up Supabase

### Create a New Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign in
2. Create a new project and note down your:
   - Project URL
   - API Keys (specifically the anon/public key)

### Set Up Database Schema

1. In your Supabase project, navigate to the SQL Editor
2. Run the `01_initial_schema.sql` script:
   ```sql
   -- Copy the entire contents of supabase/migrations/01_initial_schema.sql
   ```
3. Run the `fix_recursive_policies_updated.sql` script to fix RLS policies:
   ```sql
   -- Copy the entire contents of supabase/scripts/fix_recursive_policies_updated.sql
   ```

### Create a Test Coach

1. Create a test coach account by running:
   ```sql
   -- Copy the contents of supabase/scripts/create_test_coach_safe.sql
   ```
2. Note the console output, which should show a success message with the coach's ID
3. Verify the test coach was created:
   ```sql
   SELECT id, role, full_name, email FROM profiles
   WHERE full_name = 'Test Coach';
   ```

## 2. Setting Up the Frontend Application

### Clone and Install

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd rudofit
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Configure Environment Variables

1. Create a `.env.local` file in the root directory:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
2. Replace the placeholder values with your actual Supabase project URL and anon key

### Run the Application

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open your browser to http://localhost:5173

## 3. Testing the Application

### Coach Flow

1. Visit the home page and click "Sign In"
2. On the role selection page, click "I'm a Coach"
3. On the coach sign-in page, click "Sign in with Google"
4. Complete the Google authentication
5. You should be redirected to the coach dashboard

### Athlete Flow

1. Visit the home page and click "Sign In"
2. On the role selection page, click "I'm an Athlete"
3. On the athlete sign-in page, search for "Test Coach" (the coach we created earlier)
4. Click "Find Coach" - you should see a "Coach Found!" message
5. Click "Sign in with Google"
6. Complete the Google authentication
7. You should be redirected to the athlete dashboard

## 4. Troubleshooting

### Database Issues

If you encounter issues with the database setup, try:

1. Running the diagnostic query:
   ```sql
   -- Copy the contents of supabase/scripts/diagnose_coach_search.sql
   ```
2. Checking the logs in the Supabase dashboard
3. Verifying that RLS policies are properly set up:
   ```sql
   SELECT tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies
   WHERE schemaname = 'public'
   AND (tablename = 'profiles' OR tablename = 'team_members' OR tablename = 'teams')
   ORDER BY tablename, policyname;
   ```

### Authentication Issues

1. Ensure Google OAuth is properly configured in your Supabase project:
   - Go to Authentication → Providers → Google
   - Enter your Google OAuth credentials
2. Check that your site URL is correctly set in Supabase:
   - Go to Authentication → URL Configuration
   - Set Site URL to `http://localhost:5173` for local development

### Frontend Issues

1. Check the browser console for any errors
2. Verify that your environment variables are correctly set
3. Try clearing your browser cache or using an incognito window

## 5. Production Deployment

When deploying to production:

1. Build the application:
   ```bash
   npm run build
   ```
2. Update your Supabase project's site URL to match your production domain
3. Deploy the `dist` directory to your hosting provider of choice (Vercel, Netlify, etc.)

For more detailed deployment instructions, refer to your hosting provider's documentation.
