import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, ClimbEntry, Settings, generateId } from './types';

const STORAGE_KEYS = {
  SESSIONS: 'rockr_sessions',
  ACTIVE_SESSION: 'rockr_active_session',
  SETTINGS: 'rockr_settings',
  FAVORITES: 'rockr_favorites',
  RECENT_GYMS: 'rockr_recent_gyms',
};

// Default settings
const DEFAULT_SETTINGS: Settings = {
  gradeSystem: 'v-grade',
  defaultPrivacy: 'private',
  userName: null,
  avatarUri: null,
};

// Recent gym visit record
export interface RecentGymVisit {
  gymId: string;
  lastVisitTime: number;
  visitCount: number;
}

// Store state
interface StoreState {
  sessions: Session[];
  activeSession: Session | null;
  settings: Settings;
  favorites: string[]; // Array of gym IDs
  recentGyms: RecentGymVisit[];
  isLoaded: boolean;
}

let state: StoreState = {
  sessions: [],
  activeSession: null,
  settings: DEFAULT_SETTINGS,
  favorites: [],
  recentGyms: [],
  isLoaded: false,
};

// Listeners for state changes
type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notifyListeners() {
  listeners.forEach(listener => listener());
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Load data from AsyncStorage
export async function loadStore(): Promise<void> {
  try {
    const [sessionsJson, activeSessionJson, settingsJson, favoritesJson, recentGymsJson] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.SESSIONS),
      AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION),
      AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
      AsyncStorage.getItem(STORAGE_KEYS.FAVORITES),
      AsyncStorage.getItem(STORAGE_KEYS.RECENT_GYMS),
    ]);

    state = {
      sessions: sessionsJson ? JSON.parse(sessionsJson) : [],
      activeSession: activeSessionJson ? JSON.parse(activeSessionJson) : null,
      settings: settingsJson ? JSON.parse(settingsJson) : DEFAULT_SETTINGS,
      favorites: favoritesJson ? JSON.parse(favoritesJson) : [],
      recentGyms: recentGymsJson ? JSON.parse(recentGymsJson) : [],
      isLoaded: true,
    };
    notifyListeners();
  } catch (error) {
    console.error('Failed to load store:', error);
    // Create a new state object to ensure React detects the change
    state = {
      ...state,
      isLoaded: true,
    };
    notifyListeners();
  }
}

// Save sessions to AsyncStorage
async function saveSessions(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(state.sessions));
  } catch (error) {
    console.error('Failed to save sessions:', error);
  }
}

// Save active session to AsyncStorage
async function saveActiveSession(): Promise<void> {
  try {
    if (state.activeSession) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(state.activeSession));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    }
  } catch (error) {
    console.error('Failed to save active session:', error);
  }
}

// Save settings to AsyncStorage
async function saveSettings(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

// Save favorites to AsyncStorage
async function saveFavorites(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(state.favorites));
  } catch (error) {
    console.error('Failed to save favorites:', error);
  }
}

// Save recent gyms to AsyncStorage
async function saveRecentGyms(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.RECENT_GYMS, JSON.stringify(state.recentGyms));
  } catch (error) {
    console.error('Failed to save recent gyms:', error);
  }
}

// Getters
export function getState(): StoreState {
  return state;
}

export function getSessions(): Session[] {
  return state.sessions;
}

export function getActiveSession(): Session | null {
  return state.activeSession;
}

export function getSettings(): Settings {
  return state.settings;
}

export function getFavorites(): string[] {
  return state.favorites;
}

export function getRecentGyms(): RecentGymVisit[] {
  return state.recentGyms;
}

export function isStoreLoaded(): boolean {
  return state.isLoaded;
}

// Check if a gym is favorited
export function isFavorite(gymId: string): boolean {
  return state.favorites.includes(gymId);
}

// Get session by ID
export function getSessionById(id: string): Session | undefined {
  if (state.activeSession?.id === id) return state.activeSession;
  return state.sessions.find(s => s.id === id);
}

// Get sessions for a specific gym
export function getSessionsByGymId(gymId: string): Session[] {
  return state.sessions.filter(s => s.gymId === gymId);
}

// Actions

// Toggle favorite status for a gym
export async function toggleFavorite(gymId: string): Promise<boolean> {
  const isFav = state.favorites.includes(gymId);
  let newFavorites;
  
  if (isFav) {
    newFavorites = state.favorites.filter(id => id !== gymId);
  } else {
    newFavorites = [...state.favorites, gymId];
  }
  
  // Update state immediately
  state = {
    ...state,
    favorites: newFavorites
  };
  
  // Notify listeners immediately for UI update
  notifyListeners();
  
  // Save to storage asynchronously
  saveFavorites().catch(err => console.error('Failed to save favorites:', err));
  
  return !isFav; // Return new favorite status
}

// Update recent gym visit
export async function updateRecentGym(gymId: string): Promise<void> {
  const existingIndex = state.recentGyms.findIndex(r => r.gymId === gymId);
  
  let newRecentGyms: RecentGymVisit[];
  
  if (existingIndex >= 0) {
    // Update existing record
    const existing = state.recentGyms[existingIndex];
    newRecentGyms = [
      {
        gymId,
        lastVisitTime: Date.now(),
        visitCount: existing.visitCount + 1,
      },
      ...state.recentGyms.filter((_, i) => i !== existingIndex),
    ];
  } else {
    // Add new record
    newRecentGyms = [
      {
        gymId,
        lastVisitTime: Date.now(),
        visitCount: 1,
      },
      ...state.recentGyms,
    ];
  }
  
  // Keep only the 10 most recent gyms
  newRecentGyms = newRecentGyms.slice(0, 10);
  
  // Create a new state object to ensure React detects the change
  state = {
    ...state,
    recentGyms: newRecentGyms,
  };
  
  notifyListeners();
  await saveRecentGyms();
}

export async function startSession(gymId: string, note?: string): Promise<Session> {
  const session: Session = {
    id: generateId(),
    userId: 'local-user',
    gymId,
    startTime: Date.now(),
    endTime: null,
    note: note || null,
    entries: [],
  };

  // Create a new state object to ensure React detects the change
  state = {
    ...state,
    activeSession: session,
  };
  notifyListeners();
  await saveActiveSession();
  
  // Update recent gym visit
  await updateRecentGym(gymId);
  
  return session;
}

export async function endSession(): Promise<Session | null> {
  if (!state.activeSession) return null;

  const completedSession: Session = {
    ...state.activeSession,
    endTime: Date.now(),
  };

  // Create a new state object to ensure React detects the change
  state = {
    ...state,
    sessions: [completedSession, ...state.sessions],
    activeSession: null,
  };
  notifyListeners();

  await Promise.all([saveSessions(), saveActiveSession()]);
  return completedSession;
}

export async function addEntry(entry: Omit<ClimbEntry, 'id' | 'sessionId' | 'createdAt'>): Promise<ClimbEntry | null> {
  if (!state.activeSession) return null;

  const newEntry: ClimbEntry = {
    ...entry,
    id: generateId(),
    sessionId: state.activeSession.id,
    createdAt: Date.now(),
  };

  state = {
    ...state,
    activeSession: state.activeSession ? {
      ...state.activeSession,
      entries: [...state.activeSession.entries, newEntry],
    } : null,
  };
  notifyListeners();
  await saveActiveSession();
  return newEntry;
}

// Delete entry from active session
export async function deleteEntry(entryId: string): Promise<void> {
  if (!state.activeSession) return;

  state = {
    ...state,
    activeSession: {
      ...state.activeSession,
      entries: state.activeSession.entries.filter(e => e.id !== entryId),
    },
  };
  notifyListeners();
  await saveActiveSession();
}

export async function updateSettings(updates: Partial<Settings>): Promise<void> {
  // Create a new state object to ensure React detects the change
  state = {
    ...state,
    settings: { ...state.settings, ...updates },
  };
  notifyListeners();
  await saveSettings();
}

// Delete session
export async function deleteSession(sessionId: string): Promise<void> {
  // Create a new state object to ensure React detects the change
  state = {
    ...state,
    sessions: state.sessions.filter(s => s.id !== sessionId),
  };
  notifyListeners();
  await saveSessions();
}

// Clear all data (for testing/reset)
export async function clearAllData(): Promise<void> {
  state = {
    sessions: [],
    activeSession: null,
    settings: DEFAULT_SETTINGS,
    favorites: [],
    recentGyms: [],
    isLoaded: true,
  };
  notifyListeners();
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.SESSIONS),
    AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION),
    AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS),
    AsyncStorage.removeItem(STORAGE_KEYS.FAVORITES),
    AsyncStorage.removeItem(STORAGE_KEYS.RECENT_GYMS),
  ]);
}
