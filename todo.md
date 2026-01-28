# Project TODO

## Core Setup
- [x] Configure theme colors (climbing orange palette)
- [x] Setup tab navigation (Explore, Record, History, Profile)
- [x] Add icon mappings for all tabs
- [x] Create data models (Gym, Session, ClimbEntry, Settings)
- [x] Setup state management with AsyncStorage persistence
- [x] Create gym seed data (26+ Taiwan climbing gyms)

## Explore Tab (探索)
- [x] Gym list screen with cards
- [x] Search functionality (gym name/area)
- [x] Filter by region (台北/新北/桃園/台中/台南/高雄/其他)
- [x] Filter by type (抱石/上攀/混合)
- [x] Gym detail screen
- [x] Navigation to maps app (address tap)

## Record Tab (記錄)
- [x] Quick start screen (gym selector)
- [x] Session running screen with timer
- [x] Live stats display (conquer/fail count, highest grade)
- [x] Add entry modal (bottom sheet)
- [x] Grade picker (V0-V10+)
- [x] Result toggle (Conquer/Not Yet)
- [x] Attempts stepper (1-10)
- [ ] Photo capture/selection
- [x] Note input (max 80 chars)
- [x] End session functionality
- [x] Session persistence (survive app restart)

## History Tab (歷史)
- [x] Session list screen
- [x] Session card (date, gym, stats)
- [x] Session detail screen
- [x] Entry list view
- [ ] Photo gallery view

## Profile Tab (我)
- [x] Profile screen layout
- [x] Settings section
- [x] Grade system display (V級)
- [x] Privacy settings placeholder
- [x] Export data placeholder (P1)

## Session Summary & Share
- [x] Session summary modal
- [x] Stats calculation (conquer, fail, rate, duration, attempts)
- [x] Story card generator (1080x1920)
- [x] Hero Summary template
- [x] Background image handling (photo/gym cover/default)
- [x] Text overlay with semi-transparent mask
- [x] Share to system share sheet
- [x] Save to gallery

## Branding
- [x] Generate custom app logo
- [x] Update app.config.ts with branding

## Explore Page Enhancement (v1.1)
- [x] Add expo-location for user location access
- [x] Calculate distance from user to each gym
- [x] Sort gyms by distance (nearest first) as default
- [x] Display distance badge on gym cards
- [x] Add visual improvements to explore page:
  - [x] Hero banner/carousel section
  - [x] Featured gyms section
  - [x] Improved card design with gradient/shadow
  - [x] Quick action buttons (nearest gym, recently visited)

## Map View Feature (v1.2)
- [x] Install react-native-maps package
- [x] Create map view component with gym markers
- [x] Add list/map toggle button in explore page
- [x] Show gym info callout on marker tap
- [x] Center map on user location
- [x] Navigate to gym detail from map marker

## New Features (v1.3)

### Recently Visited Section
- [x] Track recently visited gyms in store
- [x] Display recently visited section on explore page
- [x] Show last visit date and session count per gym
- [x] Quick start session from recently visited card

### Gym Favorites Feature
- [x] Add favorites array to store
- [x] Add favorite toggle button on gym detail page
- [ ] Add favorite toggle on gym cards
- [x] Create favorites section on explore page
- [x] Heart icon animation on toggle

### Photo Capture Feature
- [x] Install expo-image-picker package
- [x] Add photo capture button in add entry modal
- [x] Support camera capture and gallery selection
- [x] Display photo thumbnail in entry card
- [ ] Include photo in session detail view
- [ ] Use photo as share card background option

## UI Style Redesign - Sports Tech Style (v1.4)
- [x] Update theme.config.js with dark mode colors (deep dark background, neon orange/green accents)
- [x] Update Hero Banner gradient to dark tech style
- [x] Update card designs with subtle glow effects
- [x] Update buttons with neon accent colors
- [x] Update tab bar styling for dark theme
- [x] Ensure all text has proper contrast on dark backgrounds
- [x] Update gym cards with tech-inspired design
- [x] Update session running screen with data-focused layout

## Bug Fixes (v1.4.1)
- [x] Fix Hero Banner being cut off by status bar (SafeArea issue)
- [x] Fix Tab Bar icons not displaying properly
