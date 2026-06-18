# ✅ Flight Path is READY TO TEST!

## 🚀 Your App is Live

**Public URL:** https://14f6d652c.na121.preview.abacusai.app

✅ Database running (PostgreSQL 15)  
✅ Phase 1 migration applied  
✅ Next.js dev server running  
✅ Google OAuth credentials configured  
✅ All TypeScript checks passing

---

## ⚠️ ONE FINAL STEP: Configure Google OAuth Redirect URI

Your Google OAuth credentials are configured in the app, but you need to **add the redirect URI** to your Google Cloud Console:

### Quick Fix (2 minutes):

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID: `1007966664828-5ic5tvdqv09q8sricuud7f2gsr6fl85v`
3. Click "Edit" (pencil icon)
4. Under **"Authorized redirect URIs"**, add this URL:
   ```
   https://14f6d652c.na121.preview.abacusai.app/api/auth/callback/google
   ```
5. Click **Save**
6. Wait 1-2 minutes for Google to propagate the changes

---

## 🧪 Testing the App

### Step 1: Visit the App
Open in YOUR browser (not the Abacus AI Agent browser):
👉 **https://14f6d652c.na121.preview.abacusai.app**

### Step 2: Sign In
1. Click **"Sign in with Google"**
2. Select your Google account: **jrizzo@sunritesolarllc.com**
3. Grant permissions
4. You should be redirected to the app (landing page)

### Step 3: Access Admin Panel
1. Navigate to: **https://14f6d652c.na121.preview.abacusai.app/admin**
2. You should see the admin dashboard with:
   - ✅ Stats cards (Total Users, Active Users, etc.)
   - ✅ **User Management Section** (Phase 1!)

### Step 4: Test User Management Features

**Add a New User:**
1. Scroll to "User Management" section
2. Enter email: `test@sunritesolarllc.com`
3. Select role: "Sales" or "Field Marketer"
4. Click "Add User"
5. ✅ New user appears in the table

**Change a User's Role:**
1. Find the test user in the table
2. Click the role dropdown
3. Select a different role (e.g., "Team Lead")
4. ✅ Role updates immediately

**Pause a User:**
1. Click the green "Active" badge next to a user
2. It changes to red "Paused"
3. ✅ That user cannot log in now (try signing in with that account)

**Reactivate a User:**
1. Click the red "Paused" badge
2. It changes back to green "Active"
3. ✅ User can log in again

**Delete a User:**
1. Click the 🗑️ delete icon
2. Confirm the deletion
3. ✅ User disappears from the table
4. Try deleting your own account → ❌ Should show error "Cannot delete your own account"

---

## 🔍 What to Verify

### Phase 1 Features (User Management):
- [ ] Can add users with all 5 role options (Admin, Manager, Team Lead, Sales, Field Marketer)
- [ ] Can change user roles via dropdown
- [ ] Can pause/unpause users (status toggle works)
- [ ] Paused users cannot log in (test with a paused account)
- [ ] Can delete users (except yourself)
- [ ] User table updates immediately after changes
- [ ] All users must have @sunritesolarllc.com email (domain gate enforcement)

### Design System (Sunrite OS):
- [ ] Dark backgrounds (#060607)
- [ ] Orange accent color (#E8472A) on buttons/badges
- [ ] White text with opacity variants
- [ ] JetBrains Mono font for code/data
- [ ] Smooth transitions and grain texture overlay

---

## 📊 Database Check

Your admin account was migrated:
```
Email: jrizzo@sunritesolarllc.com
Role: Admin (capitalized)
Status: active
```

To verify the database directly (from Abacus AI Agent), run:
```bash
PGPASSWORD='xutUSdG/z8FFFehE9DvvEnLMK+UNablTZm7pRh7/cuY=' psql -h localhost -U flightpath -d flightpath -c "SELECT email, role, status FROM app_users;"
```

---

## 🐛 Troubleshooting

### "Error 400: redirect_uri_mismatch"
- **Cause:** Redirect URI not added to Google Cloud Console
- **Fix:** Follow the "Configure Google OAuth Redirect URI" steps above

### "Unauthorized" or "Admin role required"
- **Cause:** Not logged in, or logged in as non-admin
- **Fix:** Sign in with jrizzo@sunritesolarllc.com (the only admin user)

### App won't load
- **Cause:** Dev server stopped
- **Fix:** Let me know and I'll restart it

### "Email domain not allowed"
- **Cause:** Trying to sign in with non-@sunritesolarllc.com email
- **Fix:** Only sunritesolarllc.com emails are allowed (domain gate)
- To add more domains, I can help you update the `allowed_domains` table

---

## 📝 Next Steps After Testing

Once you've verified Phase 1 works, choose what's next:

1. **Phase 2: User Profiles**
   - Photo upload with avatar display
   - Phone number editor
   - Town/location selector
   - User profile page

2. **Phase 3: AI Chat with Notion MCP**
   - Read-only Notion integration
   - Chat interface with source citations
   - Admin controls for system prompt
   - OpenAI-compatible API (z.ai)

3. **Bug Fixes / Refinements**
   - If anything doesn't work as expected during testing

---

## 💡 Important Notes

- **This localhost refers to the Abacus AI Agent VM**, not your local computer
- The app is temporarily hosted here for testing
- The VM will shut down after inactivity (your data is saved)
- To run this on your Mac later, you'll download the files and run them locally
- All code is version controlled with Git ✅

---

**Ready to test! Let me know how it goes.** 🚀
