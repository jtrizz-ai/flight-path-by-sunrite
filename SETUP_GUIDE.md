# 🚀 Flight Path Platform - Complete Setup Guide

This guide walks you through setting up the entire Flight Path platform, including the worker, web app, and iOS app.

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Node.js** v20 or higher
- [ ] **npm** or yarn package manager
- [ ] **Supabase** account (free tier works)
- [ ] **Notion** account with a workspace
- [ ] **Xcode** (for iOS app development only)
- [ ] **macOS** (for iOS development only)

## 🗄️ Step 1: Setup Supabase Database

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization (or create one)
4. Enter project details:
   - **Name**: Flight Path
   - **Database Password**: (choose a strong password)
   - **Region**: Choose nearest to your users
5. Wait for project to be created (2-3 minutes)

### 1.2 Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the contents of `web/supabase-schema.sql`
4. Paste into the editor
5. Click **Run** (or press Cmd+Enter)

This creates all necessary tables, indexes, and security policies.

### 1.3 Get Your Supabase Credentials

1. In Supabase dashboard, go to **Settings → API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: For public access
   - **service_role key**: For admin operations (keep this secret!)

## 🔌 Step 2: Setup Notion Integration

### 2.1 Create Notion Integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Fill in details:
   - **Name**: Flight Path Crawler
   - **Associated workspace**: Choose your workspace
   - **Type**: Internal
   - **Capabilities**: All capabilities (read content is sufficient)
4. Click **Submit**

### 2.2 Copy Integration Token

1. After creation, you'll see **"Internal Integration Token"**
2. Click **"Copy to clipboard"**
3. Save this token (you'll need it for `.env` files)

### 2.3 Share Your Root Page with Integration

1. Open your root Flight Path page in Notion
2. Click `...` (more options) in the top-right
3. Scroll down to **"Add connections"**
4. Find and select **"Flight Path Crawler"**
5. Click **"Confirm"**

### 2.4 Get Your Root Page ID

1. Open your root Flight Path page
2. Copy the URL from your browser
3. The page ID is the part after the last `-` and before `?`
   - Example: `https://notion.so/Flight-Path-abc123def456` → Page ID: `abc123def456`

## 🤖 Step 3: Setup Node Worker

### 3.1 Install Dependencies

```bash
cd node-worker
npm install
```

### 3.2 Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file with your credentials:

```env
# Notion Configuration
NOTION_API_KEY=secret_xxx... (from Step 2.2)
NOTION_ROOT_PAGE_ID=abc123def456 (from Step 2.4)

# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co (from Step 1.3)
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (from Step 1.3)

# Worker Configuration
WORKER_MODE=schedule              # Options: schedule, manual, cron
CRON_EXPRESSION=*/30 * * * *    # Every 30 minutes
MAX_DEPTH=5                       # Maximum recursion depth
CONCURRENT_REQUESTS=3              # Concurrent API calls
DELAY_BETWEEN_REQUESTS=1000       # Delay between calls (ms)

# Logging
LOG_LEVEL=info                    # Options: debug, info, warn, error
```

### 3.3 Test Worker Setup

```bash
./test-setup.sh
```

This validates your configuration and tests compilation.

### 3.4 Run Initial Crawl

```bash
# Test with manual crawl first
WORKER_MODE=manual npm start
```

**Expected output:**
```
🚀 Flight Path Worker Starting...
🔧 Environment: development
✅ Configuration validated successfully
✅ Notion API connection successful
✅ Supabase connection successful
🔍 Starting recursive Notion crawl...
📄 Crawling page (depth 0): abc123def456
📄 Crawling page (depth 1): xyz789012345
✅ Crawling complete. Found 15 pages.
💾 Saving 15 pages to Supabase...
✅ Created page: Getting Started (getting-started)
✅ Updated page: Flight Path Overview (flight-path-overview)
✅ Pages saved: 14 created, 1 updated
✅ Crawl completed successfully!
```

## 🌐 Step 4: Setup Web Application

### 4.1 Install Dependencies

```bash
cd web
npm install
```

### 4.2 Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (same as worker)

# Notion Configuration (for admin portal manual sync)
NOTION_ROOT_PAGE_ID=abc123def456

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Flight Path
NEXT_PUBLIC_SITE_DESCRIPTION=Your Flight Path content platform

# Admin Configuration
ADMIN_EMAIL=admin@flightpath.com
```

### 4.3 Test Web Application

```bash
npm run dev
```

Visit `http://localhost:3000` and you should see:
- ✅ Dark-themed Flight Path homepage
- ✅ "Sign In" button (for Supabase auth)
- ✅ Feature cards and branding

## 📱 Step 5: Setup iOS App (Optional)

### 5.1 Open Xcode Project

```bash
cd ios
# Open FlightPathApp.xcodeproj in Xcode
```

### 5.2 Configure iOS App

1. Update `APIService.swift` with your Supabase credentials
2. Configure code signing in Xcode settings
3. Update bundle identifier

### 5.3 Test iOS App

1. Select an iOS simulator (iPhone 14 or later)
2. Press Run (⌘+R)
3. App should launch with sign-in screen

## 🎯 Step 6: Verify Integration

### 6.1 Check Database

In Supabase dashboard, go to **Table Editor**:

1. **notion_pages** table should show:
   - Your crawled Notion pages
   - Proper titles, slugs, and content
   - Hidden pages marked with `is_hidden: true`

2. **crawl_logs** table should show:
   - Recent crawl activity
   - Success status and page counts

### 6.2 Test "Hidden Pages" Rule

1. In Notion, create a test page with title: "🔒 Premium Content"
2. Run manual crawl: `cd node-worker && WORKER_MODE=manual npm start`
3. In Supabase, check that the page has `is_hidden: true`
4. The page should require "premium" subscription

### 6.3 Test Recursive Discovery

1. Create a child page under your root page
2. Create a grandchild page under that child page
3. Run manual crawl
4. Verify both pages appear in Supabase with proper parent-child relationships

## 🔧 Step 7: Start Production Services

### 7.1 Worker (Production)

```bash
cd node-worker

# Build for production
npm run build

# Start with schedule mode (default)
npm start

# Or run in background
nohup npm start > worker.log 2>&1 &
```

### 7.2 Web Application (Production)

```bash
cd web

# Build for production
npm run build

# Start production server
npm start

# Or deploy to Vercel
vercel deploy
```

## 🧪 Step 8: Testing Checklist

- [ ] Worker successfully connects to Notion API
- [ ] Worker successfully connects to Supabase
- [ ] Recursive crawling discovers all pages
- [ ] "Hidden Pages" toggle rule works correctly
- [ ] Pages save to Supabase with correct data
- [ ] Crawl logs record activity properly
- [ ] Web app displays homepage correctly
- [ ] Supabase auth works in web app
- [ ] Version tracking creates page versions
- [ ] Scheduled crawling runs automatically

## 🐛 Common Issues & Solutions

**"Notion API unauthorized"**
- Verify integration token is correct
- Ensure integration is added to root page in Notion
- Check page has "Read" permissions for integration

**"Supabase connection failed"**
- Verify SUPABASE_URL is correct
- Check service_role_key is valid
- Ensure Supabase project is active

**"No pages found during crawl"**
- Verify NOTION_ROOT_PAGE_ID is correct
- Check root page exists and is accessible
- Try increasing MAX_DEPTH in config

**"Rate limiting errors"**
- Increase DELAY_BETWEEN_REQUESTS
- Decrease CONCURRENT_REQUESTS
- Check Notion API limits

## 📚 Next Steps

Once everything is running:

1. **Monitor Worker**: Check crawl logs regularly
2. **Configure Admin**: Access `/admin` in web app
3. **Customize Design**: Modify web app styling
4. **Setup iOS**: Configure and test iOS app
5. **Deploy**: Deploy to production servers

## 🆘 Support

If you encounter issues:

1. Check logs: `node-worker/worker.log`
2. Verify all environment variables are set
3. Test connections individually
4. Check Supabase and Notion dashboards
5. Review error messages in console output

For specific help, check component READMEs:
- Worker: `node-worker/README.md`
- Web: `web/README.md`
- iOS: `ios/README.md`
