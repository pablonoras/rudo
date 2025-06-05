# Supabase Email Confirmation Configuration

## Setting up Custom Email Confirmation Redirect

To redirect users to your custom confirmation page instead of the default landing page, follow these steps:

### 1. **Supabase Dashboard Configuration**

1. **Go to your Supabase Dashboard**

   - Visit `https://supabase.com/dashboard`
   - Select your `rudofit` project

2. **Navigate to Authentication Settings**

   - Click **"Authentication"** in the left sidebar
   - Click **"Settings"** tab

3. **Configure Site URL**

   - Find **"Site URL"** setting
   - Set it to: `http://localhost:5173` (for development)
   - For production, use your actual domain: `https://yourdomain.com`

4. **Configure Redirect URLs**

   - Find **"Redirect URLs"** section
   - Add: `http://localhost:5173/auth/confirm` (for development)
   - For production, add: `https://yourdomain.com/auth/confirm`

5. **Update Email Templates**
   - Go to **Authentication → Email Templates**
   - Click **"Confirm signup"**
   - Update the confirmation URL in the template to:
     ```
     {{ .SiteURL }}/auth/confirm?token={{ .Token }}&type=signup
     ```

### 2. **Development Setup**

For local development, make sure your redirect URLs include:

- `http://localhost:5173/auth/confirm`
- `http://localhost:3000/auth/confirm` (if using different port)

### 3. **Production Setup**

For production deployment, update:

- Site URL to your production domain
- Redirect URLs to include your production domain
- Email templates to use the production URLs

### 4. **Testing Email Confirmation**

1. **Enable email confirmations** in Supabase Dashboard
2. **Sign up with a new email**
3. **Check your email for the confirmation link**
4. **Click the link** - should redirect to `/auth/confirm`
5. **Verify the custom confirmation page appears**

### 5. **Email Template Customization**

You can customize the email template in **Authentication → Email Templates → Confirm signup**:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token={{ .Token }}&type=signup"
    >Confirm your account</a
  >
</p>
```

### 6. **Environment Variables** (Optional)

You can also set redirect URLs programmatically when calling the signup function:

```typescript
await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/confirm`,
  },
});
```

## Troubleshooting

- **404 Error**: Make sure the route is added to your React Router
- **Redirect not working**: Check that the URL is added to "Redirect URLs" in Supabase
- **Token issues**: Verify the email template includes the correct token parameter
