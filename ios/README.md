# Flight Path — iOS (SwiftUI)

Native SwiftUI rebuild of the **Flight Path App v2** design: a dark, cinematic
field app for SunRite Solar reps with four views — **Home / Launch Pad**,
**Schedule**, **Tally**, and **Chat** — plus a slide-in navigation drawer.

> This build focuses on recreating the design exactly. Data is local/mock for
> now (Notion, auth, and the live AI assistant get wired in later).

---

## Requirements

- **Xcode 16+** (the project uses the modern file-system-synchronized group
  format, `objectVersion = 77`)
- **iOS 17.0+** deployment target
- A Mac — SwiftUI cannot be compiled on Linux

## Open & Run

1. Open `ios/FlightPathApp.xcodeproj` in Xcode.
2. Select the **FlightPathApp** scheme and an iPhone simulator (iPhone 15/16).
3. Set your **Signing Team** if you want to run on a physical device
   (Target → Signing & Capabilities). Simulator needs no signing.
4. Press **⌘R**.

Because the project uses a **synchronized root group**, every file under
`FlightPathApp/` (Swift, the asset catalog, and the bundled fonts) is included
in the target automatically — no manual "Add Files…" step, and new files you
drop in are picked up on the next build.

## What's implemented

| View | Notes |
|------|-------|
| **Home / Launch Pad** | Full-bleed rocket image, layered scrims, animated converging **runway approach lights** (Canvas + `TimelineView`), hero wordmark, film-grain overlay. |
| **Schedule** | Runway background, 4 program module rows with index, title, subtitle, chevron. |
| **Tally** | Field tracker — big "Doors Knocked" card with progress bar + counter, plus Conversations & Appointments mini-cards. Goals: 40 / 15 / 5. |
| **Chat** | AI/▒me chat bubbles with tail corners, composer with send button, auto-scroll, placeholder assistant reply. |
| **Drawer** | Slide-in from the right: user block, nav links, Program/Profile/Settings, footer. |
| **Chrome** | Translucent app header (brand → Home, welcome + name, hamburger) and a 3-item bottom tab bar. |

## Project layout

```
FlightPathApp/
├── App/
│   ├── FlightPathApp.swift   # @main entry, registers fonts
│   ├── RootView.swift        # header + active view + tab bar + drawer
│   └── AppState.swift        # navigation, tally counters, chat state
├── Models/
│   └── Models.swift          # ScheduleModule, ChatMessage, TallyMetric
├── Theme/
│   ├── Theme.swift           # color + radius tokens
│   ├── Fonts.swift           # runtime font registration + FPFont helpers
│   └── Color+Hex.swift       # Color(hex:)
├── Components/
│   ├── AppHeader.swift  TabBar.swift  SideDrawer.swift
│   ├── LaunchLights.swift  GrainOverlay.swift  Icons.swift (BrandMark)
│   └── SharedUI.swift        # ViewHeader, card surface, background, buttons
├── Views/
│   ├── HomeView.swift  ScheduleView.swift  TallyView.swift  ChatView.swift
└── Resources/
    ├── Assets.xcassets/      # HomeScene, ScheduleBG, TallyBG, AppIcon, AccentColor
    └── Fonts/                # Anton, JetBrains Mono, Archivo (.ttf)
```

## Design system

- **Colors** — bg `#060607`, accent `#E8472A`, accent-2 `#FF8A5B`, white-alpha
  ink/line/card tokens. See `Theme.swift`.
- **Fonts** — **Anton** (display/wordmarks), **JetBrains Mono** (labels/eyebrows),
  **Archivo** (body/UI). Bundled as `.ttf` and registered at launch in
  `Fonts.swift` via `CTFontManagerRegisterFontsForURL` (no `UIAppFonts` plist
  entry needed). Referenced by PostScript name through `FPFont`.

## Notes for later phases

- `AppState` exposes `userName` / `userEmail` and the tally goals — swap these
  for real session + backend data.
- `AppState.send(_:)` currently appends a canned assistant reply; replace with
  the Flight Path AI (Notion MCP) call.
- Schedule rows and drawer Program/Profile/Settings links are non-navigating
  placeholders ready to be wired to detail screens.
