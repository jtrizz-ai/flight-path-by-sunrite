# Quick Start Guide - Flight Path App

## Immediate Next Steps

### 1. Set Up Backend (5 minutes)

**Install Dependencies:**
```bash
cd flight-path-backend
npm install
```

**Configure Environment:**
1. Get Notion credentials: https://www.notion.so/my-integrations
2. Edit `.env` file with your credentials:
```bash
NOTION_API_KEY=your_secret_here
NOTION_DATABASE_ID=your_database_id_here
```

**Start Server:**
```bash
npm run dev
```

**Test It:**
```bash
curl http://localhost:3000/api/health
```

### 2. Set Up iOS App (10 minutes)

**Create Xcode Project:**
1. Open Xcode → New Project → iOS App
2. Name: "FlightPathApp"
3. Interface: SwiftUI
4. Save in `FlightPathApp/` directory

**Add Existing Files:**
1. Right-click project → Add Files
2. Navigate to `FlightPathApp/FlightPathApp/`
3. Add all folders (Models, Services, ViewModels, Views)

**Update Info.plist:**
Add these keys to Info.plist:
- `NSLocalNetworkUsageDescription`: "This app needs to access your local network to connect to the Flight Path backend server."
- `NSAppTransportSecurity` → `NSAllowsLocalNetworking`: `true`

**Run App:**
1. Select iPhone simulator
2. Make sure backend is running
3. Press ⌘+R

### 3. Test Integration

**In the App:**
1. You should see the Home screen
2. Tap "Browse Program" to see modules
3. Tap the gear icon → "Test Connection" to verify backend

**If Something Doesn't Work:**
- Backend: Check `.env` file has correct credentials
- iOS: Check Info.plist has network permissions
- Both: See full README.md troubleshooting section

## File Locations

**Backend:**
- `/flight-path-backend/src/server.ts` - Main entry point
- `/flight-path-backend/src/services/notion.service.ts` - Notion integration
- `/flight-path-backend/.env` - Your secrets

**iOS:**
- `/FlightPathApp/FlightPathApp/Services/APIService.swift` - API calls (backend URL)
- `/FlightPathApp/FlightPathApp/ViewModels/ModuleViewModel.swift` - State management
- `/FlightPathApp/FlightPathApp/Views/HomeView.swift` - Main screen

## Common Issues

**"Connection refused"** → Make sure backend is running (`npm run dev`)

**"Failed to fetch from Notion"** → Check:
1. Integration is added to database
2. API key is correct
3. Database ID is correct

**iOS shows "Backend unavailable"** → Check:
1. Backend is running
2. APIService.swift has correct URL
3. Info.plist has local network permissions

## Success Indicators

✅ Backend: Terminal shows "🚀 Flight Path API Server"
✅ Backend: `curl http://localhost:3000/api/health` returns status ok
✅ iOS: Home screen shows welcome message
✅ iOS: Settings shows "Connected"
✅ iOS: Library shows modules from Notion

## Need More Help?

- Full documentation: `README.md`
- Backend logs: Check terminal where `npm run dev` is running
- iOS logs: Xcode console (⇧⌘C)

---

**Estimated Total Time**: 15-20 minutes
**Difficulty**: Intermediate
**Prerequisites**: Node.js, Xcode, Notion account
