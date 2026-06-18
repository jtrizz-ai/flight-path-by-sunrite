# Google OAuth Setup Required

## The Issue

Your app is configured and ready, but Google OAuth needs **one critical setting** to work with the Abacus AI preview URL.

---

## ✅ What You Need to Do (2 minutes)

### Step 1: Add Authorized Redirect URI

1. Go to: **https://console.cloud.google.com/apis/credentials**

2. Find your OAuth 2.0 Client ID:
   ```
   1007966664828-5ic5tvdqv09q8sricuud7f2gsr6fl85v
   ```

3. Click the **pencil icon** (Edit) next to it

4. Scroll to **"Authorized redirect URIs"**

5. Click **"+ ADD URI"**

6. Paste this EXACT URL:
   ```
   https://14f6d652c.na121.preview.abacusai.app/api/auth/callback/google
   ```

7. Click **"SAVE"** at the bottom

8. **Wait 1-2 minutes** for Google to propagate the changes

---

## ⚠️ If You Still See "Error 403: org_internal"

This means your OAuth app is set to "Internal" (Google Workspace only). You have two options:

### Option A: Change to External (Recommended for Testing)

1. Go to: **https://console.cloud.google.com/apis/credentials/consent**
2. Look for "User Type" section
3. If it says "Internal", click **"MAKE EXTERNAL"**
4. Choose **"Testing"** mode
5. Add `jrizzo@sunritesolarllc.com` as a test user
6. Save

### Option B: Keep Internal (If you prefer)

If "Internal" is required:
- Make sure `jrizzo@sunritesolarllc.com` is a **Google Workspace** email
- Make sure the OAuth app is created under the **same Google Workspace organization**
- The domain `@sunritesolarllc.com` must be verified in your Google Workspace

---

## 🧪 Test After Configuration

1. Visit: **https://14f6d652c.na121.preview.abacusai.app**
2. Click **"Sign in with Google"**
3. Select **jrizzo@sunritesolarllc.com**
4. Grant permissions
5. You should be redirected to `/pages`

---

## 📊 What's Already Configured

✅ Database has your admin account  
✅ Domain `sunritesolarllc.com` is on the allowlist  
✅ Your email `jrizzo@sunritesolarllc.com` is invited  
✅ Your role is set to `Admin`  
✅ Your status is `active`  
✅ Google OAuth credentials are configured in the app  
✅ NextAuth v5 is properly configured  

**The ONLY missing piece is the redirect URI in Google Cloud Console.**

---

## 🔍 Debugging

If you still have issues after adding the redirect URI, I've added detailed logging to the console. 

Let me know and I can check the server logs to see exactly where the OAuth flow is failing.

---

## 📝 Current URLs

- **App URL**: https://14f6d652c.na121.preview.abacusai.app
- **OAuth Callback**: https://14f6d652c.na121.preview.abacusai.app/api/auth/callback/google
- **Your OAuth Client ID**: 1007966664828-5ic5tvdqv09q8sricuud7f2gsr6fl85v

**Add the OAuth Callback URL to your Google Cloud Console and you're good to go!**
