import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, ClimbEntry, Settings, generateId } from './types';

const STORAGE_KEYS = {
  SESSIONS: 'climblog_sessions',
  ACTIVE_SESSION: 'climblog_active_session',
  SETTINGS: 'climblog_settings',
  FAVORITES: 'climblog_favorites',
  RECENT_GYMS: 'climblog_recent_gyms',
};

// Default settings
const DEFAULT_SETTINGS: Settings = {
  gradeSystem: 'v-grade',
  defaultPrivacy: 'private',
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
    state.isLoaded = true;
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
  if (isFav) {
    state.favorites = state.favorites.filter(id => id !== gymId);
  } else {
    state.favorites = [...state.favorites, gymId];
  }
  notifyListeners();
  await saveFavorites();
  return !isFav; // Return new favorite status
}

// Update recent gym visit
export async function updateRecentGym(gymId: string): Promise<void> {
  const existingIndex = state.recentGyms.findIndex(r => r.gymId === gymId);
  
  if (existingIndex >= 0) {
    // Update existing record
    const existing = state.recentGyms[existingIndex];
    state.recentGyms = [
      {
        gymId,
        lastVisitTime: Date.now(),
        visitCount: existing.visitCount + 1,
      },
      ...state.recentGyms.filter((_, i) => i !== existingIndex),
    ];
  } else {
    // Add new record
    state.recentGyms = [
      {
        gymId,
        lastVisitTime: Date.now(),
        visitCount: 1,
      },
      ...state.recentGyms,
    ];
  }
  
  // Keep only the 10 most recent gyms
  state.recentGyms = state.recentGyms.slice(0, 10);
  
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

  state.activeSession = session;
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

  state.sessions = [completedSession, ...state.sessions];
  state.activeSession = null;
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

  state.activeSession = {
    ...state.activeSession,
    entries: [...state.activeSession.entries, newEntry],
  };
  notifyListeners();
  await saveActiveSession();
  return newEntry;
}

export async function updateSettings(updates: Partial<Settings>): Promise<void> {
  state.settings = { ...state.settings, ...updates };
  notifyListeners();
  await saveSettings();
}

// Delete session
export async function deleteSession(sessionId: string): Promise<void> {
  state.sessions = state.sessions.filter(s => s.id !== sessionId);
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
