// Data Models for Rocker (岩究生)

export type GymType = 'bouldering' | 'lead' | 'mixed';

export interface Gym {
  id: string;
  name: string;
  city: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  type: GymType;
  priceFrom: number | null;
  hoursText: string | null;
  tags: string[];
  coverImageUri: string | null;
}

export type ClimbResult = 'conquer' | 'fail';

export interface ClimbEntry {
  id: string;
  sessionId: string;
  grade: string; // V0, V1, V2, etc.
  result: ClimbResult;
  attempts: number;
  note: string | null;
  mediaUri: string | null;
  createdAt: number; // timestamp
}

export interface Session {
  id: string;
  userId: string; // local user id
  gymId: string;
  startTime: number; // timestamp
  endTime: number | null; // timestamp, null if ongoing
  note: string | null; // companions note
  entries: ClimbEntry[];
}

export type GradeSystem = 'v-grade';

export interface Settings {
  gradeSystem: GradeSystem;
  defaultPrivacy: 'private' | 'public';
}

// Computed types for UI
export interface SessionSummary {
  conquerCount: number;
  failCount: number;
  highestGrade: string | null;
  completionRate: number; // 0-100
  totalAttempts: number;
  duration: number; // in seconds
  photos: string[];
}

// Filter types for Explore
export type RegionFilter = '全部' | '台北' | '新北' | '桃園' | '台中' | '台南' | '高雄' | '其他';
export type TypeFilter = '全部' | '抱石' | '上攀' | '混合';

// V-grade levels
export const V_GRADES = ['VB', 'V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V10+'] as const;
export type VGrade = typeof V_GRADES[number];

// Grade comparison utility
export function compareGrades(a: string, b: string): number {
  const indexA = V_GRADES.indexOf(a as VGrade);
  const indexB = V_GRADES.indexOf(b as VGrade);
  if (indexA === -1 && indexB === -1) return 0;
  if (indexA === -1) return -1;
  if (indexB === -1) return 1;
  return indexA - indexB;
}

// Get highest grade from entries
export function getHighestGrade(entries: ClimbEntry[], onlyConquer: boolean = true): string | null {
  const filtered = onlyConquer ? entries.filter(e => e.result === 'conquer') : entries;
  if (filtered.length === 0) return null;
  
  return filtered.reduce((highest, entry) => {
    if (!highest) return entry.grade;
    return compareGrades(entry.grade, highest) > 0 ? entry.grade : highest;
  }, null as string | null);
}

// Calculate session summary
export function calculateSessionSummary(session: Session): SessionSummary {
  const entries = session.entries;
  const conquerCount = entries.filter(e => e.result === 'conquer').length;
  const failCount = entries.filter(e => e.result === 'fail').length;
  const total = conquerCount + failCount;
  
  return {
    conquerCount,
    failCount,
    highestGrade: getHighestGrade(entries, true) || getHighestGrade(entries, false),
    completionRate: total > 0 ? Math.round((conquerCount / total) * 100) : 0,
    totalAttempts: entries.reduce((sum, e) => sum + e.attempts, 0),
    duration: session.endTime ? Math.floor((session.endTime - session.startTime) / 1000) : 0,
    photos: entries.filter(e => e.mediaUri).map(e => e.mediaUri!),
  };
}

// Format duration as MM:SS or H:MM:SS
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
