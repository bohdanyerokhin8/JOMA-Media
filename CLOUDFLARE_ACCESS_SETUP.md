# Cloudflare Access Setup Guide

This guide will help you set up Cloudflare Access for Google authentication with your JOMA Media application.

## Prerequisites

1. A Cloudflare account with access to Zero Trust dashboard
2. A Google Cloud Platform account
3. Your application deployed and accessible via a domain

## Step 1: Configure Google OAuth Credentials

### 1.1 Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API for your project

### 1.2 Configure OAuth Consent Screen
1. Navigate to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type
3. Fill in the required fields:
   - Application name: `JOMA Media`
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes: `email`, `profile`, `openid`
5. Save the configuration

### 1.3 Create OAuth Client ID
1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application** as the application type
4. Set the name: `JOMA Media - Cloudflare Access`
5. Add authorized redirect URIs:
   - `https://your-team-name.cloudflareaccess.com/cdn-cgi/access/callback`
   - Replace `your-team-name` with your actual Cloudflare team name
6. Save and note down the **Client ID** and **Client Secret**

## Step 2: Configure Cloudflare Access

### 2.1 Add Google as Identity Provider
1. Go to [Cloudflare Zero Trust Dashboard](https://dash.teams.cloudflare.com/)
2. Navigate to **Settings** > **Authentication**
3. Click **Add new** under Login methods
4. Select **Google** as the identity provider
5. Enter your Google OAuth credentials:
   - **Client ID**: From Step 1.3
   - **Client secret**: From Step 1.3
6. Enable **Proof Key for Code Exchange (PKCE)** for enhanced security
7. Save the configuration

### 2.2 Create Access Application
1. Navigate to **Access** > **Applications**
2. Click **Add an application**
3. Select **Self-hosted** application type
4. Configure the application:
   - **Application name**: `JOMA Media Platform`
   - **Subdomain**: Your application's subdomain
   - **Domain**: Your application's domain
   - **Path**: Leave empty to protect the entire application
5. Click **Next**

### 2.3 Configure Access Policies
1. Create a policy for allowed users:
   - **Policy name**: `JOMA Media Users`
   - **Action**: `Allow`
   - **Rules**: Configure based on your requirements:
     - **Emails**: Add specific email addresses
     - **Email domains**: Add your organization's domain
     - **Everyone**: Allow any Google account (not recommended for production)
2. Click **Next** and then **Add application**

## Step 3: Configure Application Settings

### 3.1 Enable JWT Token Passing
1. In your Access application settings
2. Navigate to **Settings** tab
3. Enable **Identity**
4. Set **Token lifetime** to appropriate value (e.g., 24 hours)
5. Save the configuration

### 3.2 Configure CORS Settings (if needed)
1. In **Settings** > **CORS**
2. Add your application's domain to allowed origins
3. Enable credentials if required

## Step 4: Update Application Code

The application code has already been updated to work with Cloudflare Access. The key changes include:

### 4.1 Authentication Flow
- Users are redirected to Cloudflare Access gateway
- Cloudflare handles Google OAuth authentication
- JWT tokens are passed via `cf-access-jwt-assertion` header
- Application extracts user info from JWT payload

### 4.2 User Management
- Users are automatically registered on first login
- User profiles are created from Google account information
- Session management handled by application

## Step 5: Testing the Setup

1. Deploy your application behind Cloudflare Access
2. Access your application URL
3. You should be redirected to Google authentication
4. After successful authentication, you'll be redirected back to the application
5. Check that user information is correctly extracted and stored

## Security Considerations

1. **JWT Verification**: In production, implement proper JWT signature verification
2. **HTTPS Only**: Ensure all communications use HTTPS
3. **Token Expiration**: Set appropriate token lifetimes
4. **Access Policies**: Regularly review and update access policies
5. **Audit Logs**: Monitor Cloudflare Access logs for security events

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**: Ensure Google OAuth redirect URIs match Cloudflare Access callback URLs
2. **CORS Errors**: Configure CORS settings in Cloudflare Access
3. **JWT Token Missing**: Check that Cloudflare Access is properly configured to pass JWT tokens
4. **User Registration Failing**: Verify JWT payload contains required user information

### Debug Steps

1. Check Cloudflare Access logs for authentication events
2. Inspect HTTP headers for `cf-access-jwt-assertion`
3. Decode JWT token to verify payload structure
4. Check application logs for authentication errors

## Additional Resources

- [Cloudflare Access Documentation](https://developers.cloudflare.com/cloudflare-one/identity/idp-integration/google/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [JWT Token Verification](https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/)