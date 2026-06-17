# Flight Path App

**Flight Path** is a modern Notion-powered content platform with a Next.js frontend, iOS mobile app, and automated Notion crawler.

## 🏗️ Architecture (Monorepo)

```
flight-path-by-sunrite/
├── web/              # Next.js full-stack app (website + admin + JSON API)
├── ios/              # SwiftUI iOS mobile app
├── node-worker/      # Notion crawler and sync worker
└── README.md         # This file
```

### Component Overview

**1. web/ (Next.js Full-Stack)**
- Public website: Super.so-style Notion page viewer
- Admin portal: Manage users, crawling config, hidden pages
- JSON API: Supabase-backed API for iOS app
- Tech: Next.js 15, Supabase (auth + database), Tailwind CSS

**2. ios/ (SwiftUI iOS App)**
- Native iOS app for viewing Flight Path content
- Custom dark UI matching Super.so aesthetic
- Tech: SwiftUI, iOS 17+, native URLSession

**3. node-worker/ (Notion Crawler)**
- Recursively crawls Notion pages from a root page
- Implements "Hidden Pages" toggle rule
- Syncs content to Supabase
- Tech: Node.js, TypeScript, @notionhq/client

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v20 or higher) and npm
2. **Supabase** account (free tier works)
3. **Notion API key** and root page ID
4. **Xcode** (for iOS development only)
5. **macOS** (for iOS development only)

### 1. Setup Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. In Supabase SQL Editor, run the schema from `web/supabase-schema.sql`
4. Get your project URL and service role key from Settings → API

### 2. Setup Notion Integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Create a new integration ("Flight Path Crawler")
3. Copy the "Internal Integration Token" (this is your NOTION_API_KEY)
4. In your Notion workspace, go to your root Flight Path page
5. Click `...` → `Add connections` → select your integration
6. Copy the page ID from the URL (the part after the last `-` and before `?`)

### 3. Configure Environment Variables

#### For `web/`:

```bash
cd web
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NOTION_ROOT_PAGE_ID=your_notion_root_page_id
```

#### For `node-worker/`:

```bash
cd node-worker
cp .env.example .env
```

Edit `.env`:
```env
NOTION_API_KEY=your_notion_api_key
NOTION_ROOT_PAGE_ID=your_notion_root_page_id
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

### 4. Start the Development Servers

#### Start the Next.js web app:
```bash
cd web
npm run dev
# Visit http://localhost:3000
```

#### Start the crawler worker:
```bash
cd node-worker
npm run dev
# Worker will start crawling your Notion pages
```

#### (Optional) Start the iOS app:
```bash
cd ios
# Open FlightPathApp.xcodeproj in Xcode
# Select a simulator and press Run (⌘+R)
```

## 📚 Usage

### Website Users
1. Visit your deployed site
2. Sign up/login with Supabase auth
3. Browse your Notion content in a beautiful Super.so-style interface
4. Access "hidden" pages based on subscription rules

### Admin Users
1. Log in as admin (set in Supabase)
2. Access `/admin` portal
3. Configure crawling settings
4. Manage users and permissions
5. Toggle "Hidden Pages" visibility

### iOS Users
1. Download the iOS app
2. Sign in with Supabase auth
3. Browse Flight Path content natively
4. Offline mode (cached content)

## 🔧 Development Scripts

### Web (Next.js)
```bash
cd web
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Node Worker
```bash
cd node-worker
npm run dev          # Start worker in watch mode
npm run build        # Compile TypeScript
npm run start        # Start compiled worker
```

### iOS
```bash
cd ios
# Open in Xcode and use Xcode build system
```

## 🗄️ Database Schema

The Supabase database stores:
- **users**: User profiles with subscription tiers
- **notion_pages**: Crawled Notion pages and content
- **page_versions**: Version history for change tracking
- **crawl_logs**: Crawler activity logs
- **admin_settings**: Admin configuration

Full schema: `web/supabase-schema.sql`

## 🔒 Security

- All API routes protected with Supabase auth
- Notion API key stored in environment variables only
- Service role key only used in server-side code
- iOS app uses Supabase anon key for client operations
- Never commit `.env` or `.env.local` files

## 🌐 Deployment

### Web (Vercel recommended)
```bash
cd web
vercel deploy
```

### Node Worker (Railway, Fly.io, or any Node.js host)
```bash
cd node-worker
# Deploy with your preferred Node.js host
```

### iOS App
1. Open in Xcode
2. Configure code signing
3. Archive and upload to App Store Connect

## 🐛 Troubleshooting

**Problem**: "Supabase connection error"
- **Solution**: Check your `.env.local` file has correct Supabase URL and keys

**Problem**: "Notion API unauthorized"
- **Solution**: Verify your Notion integration is added to the root page in Notion

**Problem**: "No pages showing after crawl"
- **Solution**: Check worker logs, ensure NOTION_ROOT_PAGE_ID is correct

**Problem**: "iOS app can't connect"
- **Solution**: Ensure Supabase project is enabled for iOS and proper bundle ID configured

## 📖 Documentation

- **CLAUDE.md**: Complete specification for AI coding agents
- **web/README.md**: Web-specific setup and architecture
- **ios/README.md**: iOS-specific development guide
- **node-worker/README.md**: Worker configuration and crawling logic

## 📝 License

MIT

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review component-specific READMEs
3. Check Supabase and Notion API docs
4. Create an issue in the repository

---

Built with ❤️ by Sunrite
