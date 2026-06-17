# Flight Path iOS App

The Flight Path iOS app provides a native experience for browsing Flight Path content with Supabase authentication and subscription-based access control.

## 🎯 Features

- **Supabase Authentication**: Sign in with Google OAuth
- **Beautiful Dark UI**: Super.so-style design with FlightPathTheme
- **Content Browsing**: Browse all accessible pages with search
- **Premium Content**: Access exclusive content with premium subscription
- **Real-time Updates**: Pull-to-refresh and live data sync
- **Connection Status**: Monitor backend connectivity
- **Settings Management**: User profile and app information

## 🔧 Setup Instructions

### Prerequisites

1. **Xcode 15+** (iOS development requires macOS)
2. **iOS 17+** deployment target
3. **Active Flight Path web backend** (running on localhost or deployed)
4. **Supabase project** with authentication enabled

### 1. Configure Xcode Project

The Swift files are already created, but you need to create the actual Xcode project:

1. Open Xcode
2. File → New → Project
3. Select "App" under iOS
4. Product Name: `FlightPathApp`
5. Interface: SwiftUI
6. Language: Swift
7. Save it in the `FlightPathApp` directory (replace the existing folder)

### 2. Add Files to Xcode Project

Once you've created the Xcode project, add the existing Swift files:

1. In Xcode, right-click on `FlightPathApp` group
2. Select "Add Files to FlightPathApp..."
3. Navigate to the `FlightPathApp` directory
4. Add all folders and files

### 3. Configure Supabase

Create a `SupabaseConfig.swift` file or update the existing one:

```swift
struct SupabaseConfig {
    let url: String
    let anonKey: String

    static let shared = SupabaseConfig(
        url: "https://your-project.supabase.co",
        anonKey: "your-anon-key-here"
    )
}
```

**Important**: Replace with your actual Supabase project credentials from the web app setup.

### 4. Configure Backend URL

Update `APIService.swift` with your backend URL:

```swift
private init() {
    // For local development with web app running on localhost:3000
    self.baseURL = "http://localhost:3000/api"

    // For production, use your deployed URL
    // self.baseURL = "https://your-domain.com/api"

    let configuration = URLSessionConfiguration.default
    configuration.timeoutIntervalForRequest = 30.0
    configuration.timeoutIntervalForResource = 60.0
    self.session = URLSession(configuration: configuration)
}
```

### 5. Configure Info.plist

Your Info.plist should include:

```xml
<key>NSLocalNetworkUsageDescription</key>
<string>This app needs to access your local network to connect to the Flight Path backend server.</string>

<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsLocalNetworking</key>
    <true/>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

### 6. Enable Google Sign-In

1. In Xcode, go to Target Settings
2. Signing & Capabilities
3. Add Capability: "Sign in with Apple"
4. For Google OAuth, you'll need to configure URL Types in Info.plist:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleTypeRole</key>
        <string>Editor</string>
        <key>CFBundleURLName</key>
        <string>flightpath</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>flightpath</string>
        </array>
    </dict>
</array>
```

## 🚀 Building and Running

### Development

1. Select an iOS simulator (iPhone 14 or later recommended)
2. Make sure the web backend is running: `cd web && npm run dev`
3. Click the Run button (⌘+R) in Xcode

### Production

1. Update the baseURL in `APIService.swift` to your production domain
2. Update Supabase credentials to production values
3. Configure code signing in Xcode settings
4. Archive and upload to App Store Connect

## 🎨 App Architecture

### View Structure

- **HomeView**: Main screen with authentication and stats
- **LibraryView**: Browse all accessible content
- **PageDetailView**: View individual page content
- **SettingsView**: User profile and connection management

### Components

- **FlightPathBackground**: Gradient background with accent circles
- **FlightPathCard**: Dark card component with borders
- **ContentBlockView**: Renders various Notion block types
- **MonoLabel**: Monospaced uppercase labels

### Services

- **SupabaseService**: Authentication and user management
- **APIService**: Backend API communication

### ViewModels

- **FlightPathViewModel**: Manages app state and data

## 🔒 Security Features

- **Supabase Authentication**: Secure OAuth flow
- **Subscription-Based Access**: Premium content protection
- **Local Network Access**: Configured for local development
- **Token Management**: Secure API communication

## 🎯 Data Flow

1. User signs in with Google via Supabase
2. App fetches user profile and subscription tier
3. App requests pages from backend API
4. Backend filters pages based on user's subscription
5. App displays only accessible content
6. Premium pages show lock screen for free users

## 📱 User Experience

### Free Users
- ✅ Browse all non-hidden content
- ✅ Read public pages
- ❌ Cannot access premium content
- ❌ See lock screens on premium pages

### Premium Users
- ✅ Browse all content including hidden pages
- ✅ Read premium pages
- ✅ Premium badge in user profile
- ✅ Full access to exclusive content

## 🐛 Troubleshooting

**Problem**: App shows "Connection failed"
- **Solution**: Ensure web backend is running on localhost:3000
- **Solution**: Check that baseURL in APIService.swift is correct

**Problem**: Sign in doesn't work
- **Solution**: Verify Supabase credentials are correct
- **Solution**: Check that Google OAuth is enabled in Supabase

**Problem**: Can't access premium content
- **Solution**: Update user subscription tier in Supabase database
- **Solution**: Check that backend is properly filtering content

**Problem**: Local network access error
- **Solution**: Ensure Info.plist has local network permissions
- **Solution**: Try using your Mac's IP address instead of localhost

## 🔑 Environment Variables

The iOS app uses these configurations (update in code):

- **Supabase URL**: Your Supabase project URL
- **Supabase Anon Key**: Your Supabase anonymous/public key
- **Backend URL**: Your web app API base URL
- **OAuth Redirect**: `flightpath://auth/callback`

## 📊 Performance Considerations

- **Caching**: App caches user sessions and page data
- **Lazy Loading**: Pages load content on demand
- **Image Optimization**: AsyncImage with proper placeholders
- **Refresh Strategy**: Pull-to-refresh for data updates

## 🎨 Customization

### Theme Colors
Update `FlightPathTheme.swift` to customize colors:
- Background colors
- Text colors
- Accent colors
- Border colors

### Components
All components are reusable and can be customized:
- FlightPathBackground
- FlightPathCard
- ContentBlockView
- MonoLabel

## 🚀 Next Steps

Once the iOS app is running:

1. **Test Authentication**: Verify Google sign-in works
2. **Test Content Loading**: Browse pages and verify content displays
3. **Test Premium Content**: Verify premium pages are properly locked
4. **Test Settings**: Check connection status and user profile
5. **Test Refresh**: Verify pull-to-refresh functionality

## 📝 File Structure

```
FlightPathApp/
├── AppEntry.swift              # App entry point
├── Services/
│   ├── SupabaseService.swift  # Supabase integration
│   └── APIService.swift       # Backend API communication
├── ViewModels/
│   └── FlightPathViewModel.swift # Main view model
├── Views/
│   ├── HomeView.swift         # Home screen
│   ├── LibraryView.swift       # Content library
│   ├── PageDetailView.swift   # Individual page view
│   └── SettingsView.swift      # Settings screen
├── Components/
│   ├── FlightPathBackground.swift
│   ├── FlightPathCard.swift
│   ├── ContentBlockView.swift
│   └── [Other UI components]
└── Theme/
    ├── FlightPathTheme.swift
    ├── FlightPathFonts.swift
    └── Color+Hex.swift
```

## 🆘 Support

For issues or questions:
1. Check the main README.md
2. Verify web backend is running
3. Check Supabase project status
4. Review Xcode build logs
5. Ensure all dependencies are properly configured
