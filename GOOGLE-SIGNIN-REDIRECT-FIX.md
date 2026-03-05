# 🔧 Google Sign-In Redirect URI Mismatch - Fix Guide

## ✅ Code Fixes Applied

All Google Sign-In implementations have been updated with:
1. ✅ **Debugging logs** - Console will show exact redirect URI being used
2. ✅ **Better error handling** - Specific error messages for redirect_uri_mismatch
3. ✅ **Error callbacks** - Catches OAuth errors properly

## 🔍 How to Debug

1. **Open browser console** (F12)
2. **Click Google Sign-In button**
3. **Check console logs** - You'll see:
   ```
   🔍 Google Sign-In Debug Info:
     Current Origin: https://www.alphafreightuk.com
     Current Path: /pages/supplier/signin.html
     Full URL: https://www.alphafreightuk.com/pages/supplier/signin.html
     Client ID: 834712514965-j9od0ea97k00nvkg92214eas912n8n5v.apps.googleusercontent.com
     Redirect URI (implicit): https://www.alphafreightuk.com/pages/supplier/signin.html
   ```

4. **If error occurs**, console will show:
   ```
   ❌ Redirect URI Mismatch!
     Expected in Google Cloud Console: https://www.alphafreightuk.com/pages/supplier/signin.html
     Also try: https://www.alphafreightuk.com
   ```

## 🚨 Google Cloud Console Configuration

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Select your project (or create one)
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID: `834712514965-j9od0ea97k00nvkg92214eas912n8n5v`
5. Click **Edit** (pencil icon)

### Step 2: Configure Authorized JavaScript Origins

Add **ALL** these origins (one per line):

```
https://www.alphafreightuk.com
https://alphafreightuk.com
https://alpha-freight-frontend.onrender.com
http://localhost:3000
http://127.0.0.1:3000
http://localhost
http://127.0.0.1
```

**Important Notes:**
- ✅ Include **www** and **non-www** versions
- ✅ Include **http** and **https** (for localhost)
- ✅ Include **port numbers** for localhost (3000)
- ✅ **NO trailing slashes** in origins
- ✅ **NO paths** in origins (just domain + protocol)

### Step 3: Configure Authorized Redirect URIs

**For `initTokenClient` (which we're using), Google uses the current page URL as redirect URI.**

Add **ALL** these redirect URIs (one per line):

#### Production Domain (alphafreightuk.com):
```
https://www.alphafreightuk.com/
https://www.alphafreightuk.com/pages/supplier/signin.html
https://www.alphafreightuk.com/pages/supplier/supplier-registration.html
https://www.alphafreightuk.com/pages/carrier/signin.html
https://www.alphafreightuk.com/pages/carrier/register.html
https://www.alphafreightuk.com/pages/carrier/login.html
https://alphafreightuk.com/
https://alphafreightuk.com/pages/supplier/signin.html
https://alphafreightuk.com/pages/supplier/supplier-registration.html
https://alphafreightuk.com/pages/carrier/signin.html
https://alphafreightuk.com/pages/carrier/register.html
https://alphafreightuk.com/pages/carrier/login.html
```

#### Render Test Domain:
```
https://alpha-freight-frontend.onrender.com/
https://alpha-freight-frontend.onrender.com/pages/supplier/signin.html
https://alpha-freight-frontend.onrender.com/pages/supplier/supplier-registration.html
https://alpha-freight-frontend.onrender.com/pages/carrier/signin.html
https://alpha-freight-frontend.onrender.com/pages/carrier/register.html
https://alpha-freight-frontend.onrender.com/pages/carrier/login.html
```

#### Localhost (Development):
```
http://localhost:3000/
http://localhost:3000/pages/supplier/signin.html
http://localhost:3000/pages/supplier/supplier-registration.html
http://localhost:3000/pages/carrier/signin.html
http://localhost:3000/pages/carrier/register.html
http://localhost:3000/pages/carrier/login.html
http://127.0.0.1:3000/
http://127.0.0.1:3000/pages/supplier/signin.html
http://127.0.0.1:3000/pages/supplier/supplier-registration.html
http://127.0.0.1:3000/pages/carrier/signin.html
http://127.0.0.1:3000/pages/carrier/register.html
http://127.0.0.1:3000/pages/carrier/login.html
```

**Important Notes:**
- ✅ **WITH trailing slashes** for root paths (`/`)
- ✅ **WITH full paths** for specific pages
- ✅ Include **both www and non-www** versions
- ✅ Include **http and https** for localhost
- ✅ Include **port numbers** for localhost

### Step 4: Save Changes

1. Click **Save** button
2. **Wait 5-10 minutes** for changes to propagate
3. Clear browser cache and cookies
4. Test again

## 🔍 Common Issues & Solutions

### Issue 1: Still Getting redirect_uri_mismatch

**Solution:**
1. Check browser console for exact redirect URI being used
2. Copy that exact URI
3. Add it to Google Cloud Console
4. Wait 5-10 minutes
5. Clear cache and test again

### Issue 2: Works on localhost but not production

**Solution:**
- Ensure production domain is added to **both**:
  - Authorized JavaScript Origins
  - Authorized Redirect URIs
- Check for www vs non-www mismatch
- Check for http vs https mismatch

### Issue 3: Works on one page but not others

**Solution:**
- Each page URL needs to be added as a redirect URI
- Or add a wildcard pattern (if supported)
- Check console logs to see exact URL being used

### Issue 4: Changes not taking effect

**Solution:**
- Wait 5-10 minutes for Google to propagate changes
- Clear browser cache and cookies
- Try incognito/private browsing mode
- Check if you're editing the correct OAuth client ID

## 📋 Quick Checklist

- [ ] All domains added to **Authorized JavaScript Origins**
- [ ] All page URLs added to **Authorized Redirect URIs**
- [ ] Both www and non-www versions added
- [ ] Both http and https for localhost
- [ ] Port numbers included for localhost
- [ ] Changes saved in Google Cloud Console
- [ ] Waited 5-10 minutes for propagation
- [ ] Cleared browser cache
- [ ] Tested in browser console (check logs)

## 🧪 Testing Steps

1. **Open browser console** (F12)
2. **Navigate to sign-in page**
3. **Click Google Sign-In button**
4. **Check console logs** for:
   - Current Origin
   - Current Path
   - Redirect URI being used
5. **If error occurs**, copy the exact redirect URI from console
6. **Add it to Google Cloud Console**
7. **Wait and test again**

## 📞 Still Having Issues?

1. **Check browser console** - Look for exact error message
2. **Check Google Cloud Console** - Verify all URIs are added correctly
3. **Check OAuth Consent Screen** - Ensure it's configured
4. **Check API Status** - Ensure Google+ API or Identity API is enabled
5. **Check Client ID** - Ensure you're using the correct client ID

## 🔐 Security Notes

- ✅ Never commit OAuth client secrets to git
- ✅ Use different client IDs for development and production
- ✅ Regularly rotate OAuth credentials
- ✅ Monitor Google Cloud Console for unauthorized access

---

**Last Updated:** After applying fixes, check browser console for exact redirect URI and add it to Google Cloud Console if still getting errors.
