# Google OAuth Debug Information

## Current Configuration
- **Redirect URL being used**: `https://1929f74a-a946-4207-81b9-26c9043e18aa-00-sj6zgqer6v9k.spock.replit.dev/auth/google/callback`
- **Client ID**: `82742780121-dcrdlbvvue4bkg4f8gme16crokqokj6j.apps.googleusercontent.com`
- **Domain**: `1929f74a-a946-4207-81b9-26c9043e18aa-00-sj6zgqer6v9k.spock.replit.dev`

## Required Google Cloud Console Settings

### Authorized JavaScript Origins
```
https://1929f74a-a946-4207-81b9-26c9043e18aa-00-sj6zgqer6v9k.spock.replit.dev
```

### Authorized Redirect URIs
```
https://1929f74a-a946-4207-81b9-26c9043e18aa-00-sj6zgqer6v9k.spock.replit.dev/auth/google/callback
```

## Troubleshooting Steps

1. **Verify Google Cloud Console Settings**:
   - Go to Google Cloud Console > APIs & Services > Credentials
   - Click on your OAuth 2.0 client ID
   - Ensure BOTH URLs above are added exactly as shown
   - Click "Save" and wait 2-3 minutes for propagation

2. **Common Issues**:
   - Extra spaces in the URLs
   - Missing `https://` prefix
   - Wrong domain format
   - Case sensitivity issues

3. **Alternative Domain Format**:
   If the current domain doesn't work, try adding both formats:
   ```
   https://1929f74a-a946-4207-81b9-26c9043e18aa-00-sj6zgqer6v9k.spock.replit.dev
   https://1929f74a-a946-4207-81b9-26c9043e18aa-00-sj6zgqer6v9k.spock.replit.dev/
   ```

## Next Steps
- Double-check Google Cloud Console settings
- Wait 2-3 minutes for Google's servers to propagate changes
- Try the OAuth flow again