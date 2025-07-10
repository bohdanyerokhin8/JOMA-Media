# Google OAuth Setup for JOMA Media Platform

## 🔧 Google Cloud Console Configuration

### Step 1: Create OAuth 2.0 Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "CREATE CREDENTIALS" > "OAuth client ID"
5. Select "Web application" as the application type

### Step 2: Configure Authorized URLs
Based on your current Replit environment, use these exact URLs:

**Authorized JavaScript origins:**
```
https://1929f74a-a946-4207-81b9-26c9043e18aa-00-sj6zgqer6v9k.spock.replit.dev
```

**Authorized redirect URIs:**
```
https://1929f74a-a946-4207-81b9-26c9043e18aa-00-sj6zgqer6v9k.spock.replit.dev/auth/google/callback
```

### Step 3: Get Your Credentials
After creating the OAuth client, you'll receive:
- **Client ID** (starts with something like `123456789-abc123.apps.googleusercontent.com`)
- **Client Secret** (a random string like `GOCSPX-abc123xyz789`)

## 🚀 What's Already Implemented

✅ **Backend Google OAuth Strategy**
- Complete Passport.js Google OAuth 2.0 integration
- User registration and login via Google accounts
- Automatic account linking for existing email users
- Profile image sync from Google accounts

✅ **Frontend Google Sign-In Buttons**
- Beautiful Google sign-in buttons in both login and registration tabs
- Proper Google branding and styling
- Loading states and error handling

✅ **Database Schema**
- Support for both email/password and Google OAuth users
- Google ID storage for account linking
- Profile image URL storage
- Auth provider tracking

✅ **Security Features**
- Session management with PostgreSQL storage
- HTTPS-ready configuration
- Proper error handling and user feedback

## 🔄 User Flow

### New Users with Google Account:
1. Click "Sign in with Google" or "Create Account with Google"
2. Redirected to Google OAuth consent screen
3. After approval, automatically registered and logged in
4. Default role: "influencer" (can be changed by admin)

### Existing Users:
1. Email/password users can link their Google account
2. Google users can seamlessly sign in
3. Account merging handled automatically

## 📝 Next Steps

1. **Configure Google Cloud Console** with the URLs above
2. **Provide the credentials** (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)
3. **Test the authentication** - both registration and login flows
4. **Verify account linking** works properly

## 🛠️ Testing Checklist

After providing credentials, we'll test:
- [ ] Google sign-in for new users
- [ ] Google sign-in for existing users
- [ ] Account linking between email and Google accounts
- [ ] Profile image sync
- [ ] Session persistence
- [ ] Error handling for failed OAuth