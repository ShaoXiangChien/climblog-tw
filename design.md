# Rockr (岩究生) - Mobile App Interface Design

## Design Philosophy

This app follows **Apple Human Interface Guidelines (HIG)** to create a native iOS-like experience. The design prioritizes **one-handed usage** in **portrait orientation (9:16)** with quick, intuitive interactions for climbers.

---

## Screen List

### Tab 1: Explore (探索)
- **Gym List Screen** - Main exploration view with search, filters, and gym cards
- **Gym Detail Screen** - Individual gym information with CTA to start session

### Tab 2: Record (記錄)
- **Session Running Screen** - Active climbing session with live stats and entry button
- **Quick Start Screen** - Gym selector when no session is active
- **Add Entry Modal** - Bottom sheet for quick climb entry (grade, result, attempts, photo, note)

### Tab 3: History (歷史)
- **Session List Screen** - Chronological list of past sessions
- **Session Detail Screen** - Full session summary with all entries

### Tab 4: Profile (我)
- **Profile Screen** - User stats, settings, and preferences

### Modals & Sheets
- **Session Summary Modal** - Post-session stats with share card CTA
- **Story Card Generator** - 9:16 image card preview and share/save options

---

## Primary Content and Functionality

### Explore Tab
| Element | Content |
|---------|---------|
| Search Bar | Search by gym name or area |
| Toggle | List / Map view (Map P1) |
| Filter Pills | Region (台北/新北/桃園/台中/台南/高雄/其他), Type (抱石/上攀/混合), Tags |
| Gym Cards | Cover image, name, city/district, type badge, tags, price range |

### Gym Detail Screen
| Element | Content |
|---------|---------|
| Hero Image | Gym cover photo (full width) |
| Info Section | Name, address (tappable for navigation), hours, type, tags, price |
| Primary CTA | "開始本次攀爬" button (large, prominent) |

### Record Tab - Session Running
| Element | Content |
|---------|---------|
| Header | Gym name, elapsed timer (HH:MM:SS) |
| Stats Cards | Conquer count, Fail count, Highest grade |
| Primary FAB | "+" button for adding entry |
| Secondary Action | "結束 Session" button |

### Add Entry Modal (Bottom Sheet)
| Element | Content |
|---------|---------|
| Grade Picker | Horizontal scroll V0-V10+ |
| Result Toggle | Conquer (green) / Not Yet (orange) |
| Attempts Stepper | 1-10, default 1 |
| Photo Button | Camera/gallery picker |
| Note Input | Short text, max 80 chars |
| Save Button | Primary action |

### History Tab
| Element | Content |
|---------|---------|
| Session Cards | Date, gym name, Conquer count, highest grade |
| Empty State | Illustration + "開始你的第一次攀爬" CTA |

### Session Detail Screen
| Element | Content |
|---------|---------|
| Summary Header | Total stats (conquer, fail, rate, duration, attempts) |
| Photo Grid | Thumbnails of session photos |
| Entry List | Each climb entry with grade, result, attempts, note |
| Share CTA | "生成分享圖片卡" button |

### Profile Tab
| Element | Content |
|---------|---------|
| Stats Section | Total sessions, total climbs, highest grade (P1) |
| Settings List | Grade system (V級), Privacy, Export data (P1) |
| App Info | Version, about |

### Story Card Generator
| Element | Content |
|---------|---------|
| Preview | 9:16 card with stats overlay on photo background |
| Template | Hero Summary (big Conquer number, grade, rate, duration) |
| Actions | Share button, Save to gallery button |

---

## Key User Flows

### Flow A: Find Gym → Start Session
1. User opens app → lands on Explore tab
2. User scrolls gym list or uses search/filter
3. User taps gym card → Gym Detail screen
4. User taps "開始本次攀爬" → Session starts
5. App switches to Record tab with active session

### Flow B: Quick 3-Second Entry
1. User is in active session (Record tab)
2. User taps "+" FAB → Add Entry modal slides up
3. User selects grade (horizontal scroll)
4. User taps "Conquer" or "Not Yet"
5. User taps "Save" → Entry saved, modal closes
6. User can immediately tap "+" again for next entry

### Flow C: End Session → Share Card
1. User taps "結束 Session" button
2. Session Summary modal appears with stats
3. User taps "生成分享圖片卡"
4. Story Card Generator shows preview
5. User taps "分享" → System share sheet
6. Or user taps "存圖" → Saved to gallery

### Flow D: Review History
1. User taps History tab
2. User scrolls session list
3. User taps session card → Session Detail
4. User can view all entries and photos
5. User can generate share card from detail view

---

## Color Choices

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `primary` | #FF6B35 | #FF8C5A | Accent, CTAs, active states (climbing orange) |
| `background` | #FFFFFF | #1A1A1A | Screen backgrounds |
| `surface` | #F5F5F5 | #2A2A2A | Cards, elevated surfaces |
| `foreground` | #1A1A1A | #F5F5F5 | Primary text |
| `muted` | #6B7280 | #9CA3AF | Secondary text, labels |
| `border` | #E5E7EB | #374151 | Dividers, card borders |
| `success` | #22C55E | #4ADE80 | Conquer state, success |
| `warning` | #F59E0B | #FBBF24 | Not Yet state, warnings |
| `error` | #EF4444 | #F87171 | Errors, destructive actions |

### Brand Identity
- **Primary Orange (#FF6B35)**: Energetic, adventurous, associated with climbing holds
- **Clean backgrounds**: Focus on content and quick scanning
- **High contrast**: Easy readability in gym lighting conditions

---

## Typography

| Style | Size | Weight | Usage |
|-------|------|--------|-------|
| Hero | 48px | Bold | Big numbers on share card |
| Title | 24px | Bold | Screen titles |
| Headline | 20px | Semibold | Section headers |
| Body | 16px | Regular | Primary content |
| Caption | 14px | Regular | Secondary info, labels |
| Small | 12px | Regular | Timestamps, metadata |

---

## Component Specifications

### Gym Card
- Height: 120px
- Border radius: 16px
- Shadow: subtle elevation
- Image: 80x80px square, left side
- Content: right side with name, location, type badge

### Grade Picker
- Horizontal ScrollView
- Each grade: 56x56px circle
- Selected: primary color background
- Unselected: surface background with border

### Result Toggle
- Two buttons side by side
- Conquer: success color when selected
- Not Yet: warning color when selected
- Unselected: surface background

### FAB (Floating Action Button)
- Size: 64x64px
- Position: bottom center, above tab bar
- Icon: "+" 
- Color: primary
- Shadow: prominent elevation

### Session Timer
- Font: monospace
- Size: 32px
- Format: HH:MM:SS
- Updates every second

---

## Interaction Patterns

### Press Feedback
- Primary buttons: scale 0.97 + haptic light
- Cards: opacity 0.7
- Icons: opacity 0.6

### Haptics
- Entry save: success notification
- Session start/end: medium impact
- Button taps: light impact

### Animations
- Modal slide up: 300ms ease-out
- Card press: 80ms scale
- Counter increment: spring animation

---

## Offline Behavior

All core functionality works offline:
- Gym data: bundled JSON seed
- Sessions: stored in AsyncStorage
- Entries: stored in AsyncStorage
- Photos: stored locally
- Share card: generated client-side

---

## Accessibility

- Minimum touch target: 44x44px
- Color contrast: WCAG AA compliant
- VoiceOver labels on all interactive elements
- Support for Dynamic Type (P1)
