# Rockr (岩究生)

A React Native mobile app for tracking bouldering sessions at climbing gyms in Taiwan, built with Expo Router and NativeWind.

## Features

- 📍 Find climbing gyms on an interactive map
- 📝 Log climbing sessions and routes
- 📊 Track your climbing progress and history
- 🎨 Modern UI with NativeWind (Tailwind CSS for React Native)
- 🔐 OAuth authentication with Manus
- 🗺️ Location-based gym discovery

## Tech Stack

- **Framework**: [Expo](https://expo.dev/) ~54.0
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- **Styling**: [NativeWind](https://www.nativewind.dev/) v4 (Tailwind CSS)
- **Backend**: tRPC + Express
- **Database**: MySQL with Drizzle ORM
- **State Management**: TanStack Query (React Query)
- **Maps**: react-native-maps

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (v9.12.0 or higher)
  ```bash
  npm install -g pnpm
  ```
- **Xcode** (for iOS development on Mac)
  - Install from the Mac App Store
  - Open Xcode and install iOS Simulator from Settings > Platforms
- **Android Studio** (for Android development - optional)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rockr
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Backend API URL (for local development)
   EXPO_PUBLIC_API_BASE_URL=http://localhost:3000

   # Database (optional - only needed for backend features)
   # DATABASE_URL=mysql://user:password@host:port/database
   ```

## Running the App

### First Time Setup

Build the native iOS app (required for the first run):

```bash
npx expo run:ios
```

This will:
- Install CocoaPods dependencies
- Build the native app with Xcode (takes 5-10 minutes)
- Install and launch the app on the iOS Simulator

### Daily Development

After the initial build, use:

```bash
npx expo start --dev-client
```

Or press `i` when prompted to open in iOS Simulator.

### Running with Backend Server

To run both the backend API server and Metro bundler concurrently:

```bash
pnpm dev
```

This starts:
- Backend server on `http://localhost:3000`
- Metro bundler on `http://localhost:8081`

## Project Structure

```
rockr/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigator screens
│   │   ├── index.tsx      # Home screen
│   │   ├── record.tsx     # Record session screen
│   │   ├── history.tsx    # Session history
│   │   └── profile.tsx    # User profile
│   ├── gym/[id].tsx       # Gym details screen
│   └── session/[id].tsx   # Session details screen
├── components/            # Reusable UI components
│   ├── ui/               # UI primitives
│   └── gym-map.tsx       # Map component
├── server/               # Backend API
│   ├── routers.ts        # tRPC routes
│   ├── db.ts            # Database queries
│   └── _core/           # Framework code
├── drizzle/             # Database schema & migrations
│   ├── schema.ts        # Database tables
│   └── relations.ts     # Table relationships
├── hooks/               # Custom React hooks
│   ├── use-auth.ts      # Authentication hook
│   └── use-store.ts     # State management
├── lib/                 # Utilities & helpers
│   ├── trpc.ts         # tRPC client
│   └── store.ts        # App state
├── constants/          # App constants
└── data/              # Static data (gyms, etc.)
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run backend + Metro bundler |
| `pnpm dev:server` | Run backend server only |
| `pnpm dev:metro` | Run Metro bundler only |
| `pnpm ios` | Build and run on iOS |
| `pnpm android` | Build and run on Android |
| `pnpm check` | Type-check TypeScript |
| `pnpm lint` | Lint code with ESLint |
| `pnpm format` | Format code with Prettier |
| `pnpm test` | Run tests with Vitest |
| `pnpm db:push` | Push database schema changes |

## Development Workflow

1. **Start the development server**
   ```bash
   pnpm dev
   ```

2. **Make changes to your code**
   - The app will hot reload automatically in the simulator
   - Backend changes restart the server automatically

3. **When adding native dependencies**
   ```bash
   pnpm add <package-name>
   npx expo run:ios  # Rebuild native app
   ```

## Troubleshooting

### "Unable to resolve module" errors

If you encounter module resolution errors:

```bash
rm -rf node_modules .expo
rm -rf $TMPDIR/metro-cache
pnpm install
npx expo start -c --ios
```

### Rebuild the app

If the app isn't reflecting native changes:

```bash
npx expo run:ios
```

### Clear all caches

```bash
rm -rf node_modules .expo ios/build android/build
rm -rf $TMPDIR/metro-cache $TMPDIR/haste-map-*
pnpm install
npx expo run:ios
```

## Database Setup (Optional)

The app can run without a database for UI development. To enable full backend features:

1. Set up a MySQL/TiDB database
2. Add `DATABASE_URL` to your `.env` file
3. Push the schema:
   ```bash
   pnpm db:push
   ```

## Authentication (Optional)

The app uses Manus OAuth for authentication. Backend OAuth configuration requires:
- `VITE_APP_ID`
- `OAUTH_SERVER_URL`
- `VITE_OAUTH_PORTAL_URL`

See `server/README.md` for full backend setup instructions.

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

This project is private and proprietary.

## Support

For issues or questions, please open an issue on GitHub or contact the development team.
