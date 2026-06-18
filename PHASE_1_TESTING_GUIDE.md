# Phase 1 Testing Guide — User Management

## ✅ What Was Built

Phase 1 added **Admin User Management** with:
- 5 new user roles: **Admin**, **Manager**, **Team Lead**, **Sales**, **Field Marketer**
- User status: **active** (can log in) or **paused** (blocked at login)
- Profile fields: **phone** and **town** (added to database, ready for Phase 2)
- Admin-only UI to add, edit roles, pause/unpause, and delete users
- Auth gate now blocks paused users

---

## 🛠️ Step 1: Run the Database Migration

The new schema needs to be applied to your local Postgres database. **You only need to do this once.**

### Copy/Paste Command:
```bash
cd ~/flight-path-by-sunrite
docker exec -i flightpath-postgres psql -U flightpath -d flightpath < db/migrations/001-extend-user-management.sql
```

### What This Does:
- Adds `status` column to `app_users` (default: `active`)
- Adds `phone` and `town` columns for Phase 2 profiles
- Changes the `role` constraint from 2 roles (`member`, `admin`) to 5 roles
- Migrates your existing admin role: `admin` → `Admin` (capitalized)
- Creates indexes on `status` and `role` for fast queries

### Expected Output:
```
BEGIN
ALTER TABLE
ALTER TABLE
ALTER TABLE
ALTER TABLE
UPDATE 1
CREATE INDEX
CREATE INDEX
COMMIT
```

If you see `ERROR: column "status" already exists`, it means you ran the migration before—that's fine, ignore it.

---

## 🚀 Step 2: Start the Web App

```bash
cd ~/flight-path-by-sunrite/web
npm run dev
```

The app should start at **http://localhost:3000**.

---

## 🧪 Step 3: Test User Management (Admin Portal)

### 3.1 Log In
1. Go to http://localhost:3000
2. Click **"Sign in with Google"**
3. Choose your **jrizzo@sunritesolarllc.com** account
4. You should be redirected to **/pages** (the library)

### 3.2 Open the Admin Portal
1. In the top-right nav, click **"Admin"**
2. You should see the admin dashboard with:
   - Stats (Total Pages, Hidden Pages, Last Sync)
   - **NEW: User Management section** (this is Phase 1!)

### 3.3 Test: View Users
- You should see a table with **at least 1 user** (yourself: `jrizzo@sunritesolarllc.com`)
- Columns: Email, Name, Role, Status, Actions
- Your role should be **Admin** and status **active**

### 3.4 Test: Add a New User
1. Click **"+ Add User"** button
2. Fill in:
   - **Email**: `testuser@sunritesolarllc.com` (or another @sunritesolarllc.com email)
   - **Role**: Choose **"Sales"** from the dropdown
3. Click **"Add User"**
4. The user should appear in the table with:
   - Email: `testuser@sunritesolarllc.com`
   - Role: **Sales**
   - Status: **active** (green badge)

### 3.5 Test: Change a User's Role
1. Find the test user in the table
2. Click the **Role dropdown** (currently shows "Sales")
3. Change it to **"Manager"**
4. The change should save immediately (watch for the dropdown to update)

### 3.6 Test: Pause a User
1. Click the **active** status badge (green) for the test user
2. It should change to **paused** (red badge)
3. Now log out and try to sign in as that user (if you have access to that email)
   - **Expected**: Login should be **denied** with a message about being paused

### 3.7 Test: Unpause a User
1. Click the **paused** badge again
2. It should change back to **active** (green)
3. The user can now log in again

### 3.8 Test: Delete a User
1. Click **"Delete"** in the Actions column for the test user
2. Confirm the deletion in the popup
3. The user should disappear from the table

### 3.9 Test: Try to Delete Yourself
1. Try clicking **"Delete"** on your own account (`jrizzo@sunritesolarllc.com`)
2. **Expected**: You should see an error: **"Cannot delete your own account"**

---

## 🔒 Step 4: Test Auth Gate (Paused Users Are Blocked)

1. Create a new test user and set their status to **paused**
2. Open an **incognito/private browser window**
3. Go to http://localhost:3000
4. Try to sign in with that paused user's email
5. **Expected**: You should be **redirected back to the login page** (no access)

Check the terminal where `npm run dev` is running. You should see:
```
[auth] login denied (user_paused): testuser@sunritesolarllc.com
```

---

## ✅ Acceptance Checklist

- [ ] Database migration ran successfully
- [ ] Admin portal shows the User Management section
- [ ] I can see the list of users (including myself)
- [ ] I can add a new user with a specific role
- [ ] I can change a user's role via the dropdown
- [ ] I can pause a user (status changes to red badge)
- [ ] Paused users cannot log in (tested in incognito)
- [ ] I can unpause a user (status changes back to green)
- [ ] I can delete a user
- [ ] I cannot delete my own account (error shows)

---

## 🐛 If Something Goes Wrong

### Error: "Invalid role"
- Make sure you ran the migration. The database still has the old 2-role constraint.

### Error: "Unauthorized: Admin role required"
- Your role in the database is still `admin` (lowercase). The migration should have fixed this.
- Manual fix:
  ```sql
  docker exec -it flightpath-postgres psql -U flightpath -d flightpath -c "UPDATE app_users SET role = 'Admin' WHERE lower(role) = 'admin';"
  ```

### Can't see the User Management section
- Make sure you're logged in as an **Admin** (not another role)
- Check the browser console for errors (press F12)

### "Failed to fetch users" error
- Check that the database is running:
  ```bash
  docker ps | grep postgres
  ```
- Check the terminal running `npm run dev` for database connection errors

---

## 🎯 Next Steps

Once Phase 1 is tested and working, we have two options:

1. **Proceed to Phase 2: User Profiles**  
   - Add profile page where users edit their photo, phone, email, town
   - Estimated time: 1-2 hours

2. **Proceed to Phase 3: AI Chat with Notion MCP**  
   - Add chat page with read-only access to Notion content
   - Requires: Notion integration token, OpenAI API key (or z.ai endpoint)
   - Estimated time: 2-3 hours

Let me know which you'd like to tackle next, or if you'd like to pause and test Phase 1 thoroughly first!
