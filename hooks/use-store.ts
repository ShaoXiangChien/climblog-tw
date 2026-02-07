import { useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import {
  subscribe,
  getState,
  getSessions,
  getActiveSession,
  getSettings,
  getFavorites,
  getRecentGyms,
  isStoreLoaded,
  loadStore,
  startSession as storeStartSession,
  endSession as storeEndSession,
  addEntry as storeAddEntry,
  updateSettings as storeUpdateSettings,
  getSessionById as storeGetSessionById,
  getSessionsByGymId as storeGetSessionsByGymId,
  toggleFavorite as storeToggleFavorite,
  isFavorite as storeIsFavorite,
  RecentGymVisit,
} from '@/lib/store';
import { Session, ClimbEntry, Settings } from '@/lib/types';

// Hook to subscribe to store changes
export function useStore() {
  const state = useSyncExternalStore(subscribe, getState, getState);
  return state;
}

// Hook for sessions
export function useSessions(): Session[] {
  const state = useStore();
  return state.sessions;
}

// Hook for active session
export function useActiveSession(): Session | null {
  const state = useStore();
  return state.activeSession;
}

// Hook for settings
export function useSettings(): Settings {
  const state = useStore();
  return state.settings;
}

// Hook for favorites
export function useFavorites(): string[] {
  const state = useStore();
  return state.favorites;
}

// Hook for recent gyms
export function useRecentGyms(): RecentGymVisit[] {
  const state = useStore();
  return state.recentGyms;
}

// Hook to check if a gym is favorited
export function useIsFavorite(gymId: string): boolean {
  const state = useStore();
  return state.favorites.includes(gymId);
}

// Hook to check if store is loaded
export function useStoreLoaded(): boolean {
  const state = useStore();
  return state.isLoaded;
}

// Hook for session by ID
export function useSessionById(id: string): Session | undefined {
  const state = useStore();
  if (state.activeSession?.id === id) return state.activeSession;
  return state.sessions.find(s => s.id === id);
}

// Hook for sessions by gym ID
export function useSessionsByGymId(gymId: string): Session[] {
  const state = useStore();
  return state.sessions.filter(s => s.gymId === gymId);
}

// Hook for store actions
export function useStoreActions() {
  const startSession = useCallback(async (gymId: string, note?: string) => {
    return storeStartSession(gymId, note);
  }, []);

  const endSession = useCallback(async () => {
    return storeEndSession();
  }, []);

  const addEntry = useCallback(async (entry: Omit<ClimbEntry, 'id' | 'sessionId' | 'createdAt'>) => {
    return storeAddEntry(entry);
  }, []);

  const deleteEntry = useCallback(async (entryId: string) => {
    const { deleteEntry: storeDeleteEntry } = await import('@/lib/store');
    return storeDeleteEntry(entryId);
  }, []);

  const updateSettings = useCallback(async (updates: Partial<Settings>) => {
    return storeUpdateSettings(updates);
  }, []);

  const toggleFavorite = useCallback(async (gymId: string) => {
    return storeToggleFavorite(gymId);
  }, []);

  return {
    startSession,
    endSession,
    addEntry,
    deleteEntry,
    updateSettings,
    toggleFavorite,
  };
}

// Hook to initialize store on app start
export function useInitStore() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    loadStore().then(() => {
      setIsInitialized(true);
    });
  }, []);

  return isInitialized;
}
