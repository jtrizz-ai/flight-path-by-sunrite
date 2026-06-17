# Flight Path App

A complete iOS application that pulls content from a Notion database called "Flight Path Program". The app consists of a Node.js/TypeScript backend and a SwiftUI iOS app.

## Architecture

```
Notion Database ← Backend API (Node.js/TypeScript) ← iOS App (SwiftUI)
```

## Project Structure

- `flight-path-backend/` - Node.js/TypeScript backend server
- `FlightPathApp/` - SwiftUI iOS application

## Prerequisites

1. **Node.js** (v18 or higher) and npm
2. **Xcode** (for iOS development)
3. **Notion account** with access to "Flight Path Program" database
4. **macOS** (required for iOS development)

## Setup Instructions

### Part 1: Backend Setup

#### 1. Install Dependencies

```bash
cd flight-path-backend
npm install
```

#### 2. Create Notion Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click "+ New integration"
3. Give it a name (e.g., "Flight Path Backend")
4. Select your workspace
5. Click "Submit"
6. Copy the "Internal Integration Secret" (this is your `NOTION_API_KEY`)

#### 3. Get Your Database ID

1. Open your "Flight Path Program" database in Notion
2. The URL will look like: `https://notion.so/workspace/{DATABASE_ID}?v=...`
3. Copy the `{DATABASE_ID}` part (32 characters with dashes)

#### 4. Share Database with Integration

1. In your Notion database, click "..."
2. Select "Add connections"
3. Find and select your integration
4. Click "Confirm"

#### 5. Configure Environment Variables

Edit `flight-path-backend/.env`:

```bash
# Notion API Configuration
NOTION_API_KEY=your_copied_integration_secret
NOTION_DATABASE_ID=your_copied_database_id

# Server Configuration
PORT=3000
```

#### 6. Start the Backend Server

```bash
cd flight-path-backend
npm run dev
```

The server will start at `http://localhost:3000`

#### 7. Test the Backend

Open a new terminal and test the endpoints:

```bash
# Health check
curl http://localhost:3000/api/health

# Get all modules
curl http://localhost:3000/api/modules

# Get single module (replace {id} with actual module ID)
curl http://localhost:3000/api/modules/{id}
```

### Part 2: iOS App Setup

#### 1. Create Xcode Project

**Important:** The Swift files have been created, but you need to create the actual Xcode project:

1. Open Xcode
2. File → New → Project
3. Select "App" under iOS
4. Product Name: `FlightPathApp`
5. Interface: SwiftUI
6. Language: Swift
7. Save it in the `FlightPathApp` directory (replace the existing folder)

#### 2. Add Files to Xcode Project

Once you've created the Xcode project, add the existing Swift files:

1. In Xcode, right-click on `FlightPathApp` group
2. Select "Add Files to FlightPathApp..."
3. Navigate to the `FlightPathApp/FlightPathApp` directory
4. Add these folders:
   - `Models/Module.swift`
   - `Services/APIService.swift`
   - `ViewModels/ModuleViewModel.swift`
   - `Views/HomeView.swift`
   - `Views/LibraryView.swift`
   - `Views/ModuleDetailView.swift`
   - `Views/SettingsView.swift`
   - `Views/Components/ModuleCard.swift`
   - `Views/Components/TagView.swift`
   - `Views/Components/ContentBlockView.swift`

5. Make sure to check "Copy items if needed" and "Create groups"

#### 3. Configure Info.plist

Your Info.plist should include these entries (add them if missing):

```xml
<key>NSLocalNetworkUsageDescription</key>
<string>This app needs to access your local network to connect to the Flight Path backend server.</string>

<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsLocalNetworking</key>
    <true/>
</dict>
```

#### 4. Update Backend URL (if needed)

In `APIService.swift`, the backend URL is set to `http://localhost:3000/api`. If you're using a different URL or port, update this line:

```swift
private let baseURL: String = "http://localhost:3000/api"
```

#### 5. Build and Run

1. Select an iOS simulator (iPhone 14 or later recommended)
2. Make sure the backend server is running
3. Click the Run button (⌘+R)
4. The app should launch and show the Home screen

## Testing

### Backend Testing

1. **Health Check**: `curl http://localhost:3000/api/health`
2. **Get All Modules**: `curl http://localhost:3000/api/modules`
3. **Get Single Module**: `curl http://localhost:3000/api/modules/{id}`

### iOS App Testing

1. **Home Screen**: Should show welcome message and "Browse Program" button
2. **Library View**: Tap "Browse Program" to see all modules
3. **Search**: Use the search bar to filter modules
4. **Tag Filtering**: Tap tags to filter by category
5. **Module Detail**: Tap a module to see its content
6. **Settings**: Tap gear icon to check backend connection
7. **Pull to Refresh**: Drag down in LibraryView to reload content

## Features

### Backend (Node.js/TypeScript)
- ✅ Express.js server with TypeScript
- ✅ Notion API integration
- ✅ RESTful API endpoints
- ✅ CORS configuration
- ✅ Error handling
- ✅ Health check endpoint

### iOS App (SwiftUI)
- ✅ Home screen with welcome message
- ✅ Library view with all modules
- ✅ Real-time search functionality
- ✅ Tag-based filtering
- ✅ Module detail view with content rendering
- ✅ Multiple content block types (paragraphs, headings, lists, todos)
- ✅ Pull-to-refresh
- ✅ Backend connection status
- ✅ Relative date formatting
- ✅ Material design cards

## API Endpoints

### GET /api/health
```json
{
  "status": "ok",
  "timestamp": "2026-06-16T15:00:00Z"
}
```

### GET /api/modules
Returns array of modules with basic info (no content blocks)

```json
[
  {
    "id": "notion-page-id",
    "title": "Module Title",
    "tags": [{"id": "tag-id", "name": "Tag Name", "color": "blue"}],
    "last_edited_time": "2026-06-16T15:00:00Z",
    "verified": false
  }
]
```

### GET /api/modules/:id
Returns single module with full content blocks

```json
{
  "id": "notion-page-id",
  "title": "Module Title",
  "tags": [...],
  "last_edited_time": "2026-06-16T15:00:00Z",
  "verified": false,
  "content_blocks": [
    {
      "type": "paragraph",
      "text": "Example content"
    }
  ]
}
```

## Supported Notion Block Types

- ✅ Paragraphs
- ✅ Headings (1, 2, 3)
- ✅ Bulleted lists
- ✅ Numbered lists
- ✅ To-do items

## Troubleshooting

### Backend Issues

**Problem**: Server won't start
- **Solution**: Check that `.env` file exists and contains valid API key and database ID

**Problem**: "Failed to fetch modules from Notion"
- **Solution**: Verify that:
  - Your Notion integration has access to the database
  - The database ID is correct
  - The API key is valid

### iOS App Issues

**Problem**: App shows "Backend connection unavailable"
- **Solution**:
  - Make sure backend server is running
  - Check that the simulator can reach localhost
  - Try changing localhost to 127.0.0.1 in APIService.swift

**Problem**: "Network error"
- **Solution**:
  - Verify backend is running: `curl http://localhost:3000/api/health`
  - Check Info.plist has local network permissions
  - Make sure no firewall is blocking the connection

## Next Steps

### Phase 4 (Future)
- Caching support
- Better loading states
- Enhanced error handling
- Offline mode

### Phase 5 (Future)
- User accounts
- Progress tracking
- Completed modules
- Achievement system

### Phase 6 (Future)
- Supabase integration
- Write-back to Notion
- User-generated content
- Social features

## Development

### Backend Development

```bash
cd flight-path-backend
npm run dev        # Start development server with watch mode
npm run build      # Compile TypeScript
npm start          # Start production server
```

### iOS Development

1. Open `FlightPathApp.xcodeproj` in Xcode
2. Select target simulator or device
3. Press ⌘+R to build and run

## License

MIT

## Support

For issues or questions, please check the troubleshooting section or create an issue in the repository.
