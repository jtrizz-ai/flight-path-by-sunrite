# Flight Path Worker

Notion crawler and sync worker for Flight Path platform.

## 🚀 What It Does

- **Recursive Notion Crawling**: Starts from a root page and recursively discovers all child pages
- **"Hidden Pages" Toggle Rule**: Automatically detects and marks premium/exclusive content
- **Supabase Sync**: Saves crawled content to Supabase database with version tracking
- **Scheduled Crawling**: Runs on customizable schedules (default: every 30 minutes)
- **Error Resilience**: Continues crawling even if individual pages fail

## 🔧 Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
```

3. **Fill in your credentials**:
```env
NOTION_API_KEY=your_notion_integration_token
NOTION_ROOT_PAGE_ID=your_root_page_id
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

## 🎮 Usage

### Development Mode (with watch)
```bash
npm run dev
```

### Manual Single Crawl
```bash
WORKER_MODE=manual npm start
```

### Scheduled Crawling (default)
```bash
npm start
# Runs every 30 minutes by default
```

### Custom Schedule
```bash
CRON_EXPRESSION="*/15 * * * *" npm start
# Runs every 15 minutes
```

## 📊 "Hidden Pages" Toggle Rule

The worker automatically marks pages as hidden if:

1. **Title contains**: 🔒, "hidden", "premium", "exclusive", "members only"
2. **Tags contain**: "hidden", "premium", "exclusive"
3. **Properties contain**: Hidden property set to true

Hidden pages automatically require "premium" subscription tier.

## 🗄️ Database Schema

The worker uses these Supabase tables:

- **notion_pages**: Main page content with hidden/subscription flags
- **page_versions**: Version history for change tracking
- **crawl_logs**: Activity logs and statistics

## 🔍 How It Works

1. **Connection Testing**: Validates Notion API and Supabase connections
2. **Recursive Discovery**: Starts at root page, finds all child pages recursively
3. **Content Extraction**: Fetches page content, metadata, and child relationships
4. **Hidden Detection**: Applies "Hidden Pages" toggle rule logic
5. **Database Sync**: Creates/updates pages with unique slugs and version tracking
6. **Status Logging**: Records crawl statistics and completion status

## 📈 Crawl Statistics

Each crawl logs:
- Total pages processed
- New pages created
- Existing pages updated
- Completion status and any errors

View recent crawls in Supabase `crawl_logs` table.

## 🛠️ Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `WORKER_MODE` | `schedule` | `manual`, `schedule`, or `cron` |
| `MAX_DEPTH` | `5` | Maximum recursion depth for page discovery |
| `CONCURRENT_REQUESTS` | `3` | Concurrent Notion API requests |
| `DELAY_BETWEEN_REQUESTS` | `1000` | Delay between requests (ms) |
| `CRON_EXPRESSION` | `*/30 * * * *` | Cron pattern for scheduling |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |

## 🐛 Troubleshooting

**Problem**: "Notion API unauthorized"
- **Solution**: Verify NOTION_API_KEY is correct and integration is added to root page in Notion

**Problem**: "No pages found during crawl"
- **Solution**: Check NOTION_ROOT_PAGE_ID and ensure page is shared with integration

**Problem**: "Supabase connection failed"
- **Solution**: Verify SUPABASE_URL and SUPABASE_SERVICE_KEY are correct

**Problem**: "Rate limiting errors"
- **Solution**: Increase DELAY_BETWEEN_REQUESTS or decrease CONCURRENT_REQUESTS

## 🔒 Security

- Uses service role key for database operations
- Never exposes Notion API key in logs
- Rate limiting built-in to respect Notion API limits
- All secrets loaded from environment variables

## 📝 Development

**Build for production**:
```bash
npm run build
```

**Run compiled version**:
```bash
npm start
```

**Watch mode for development**:
```bash
npm run dev
```
