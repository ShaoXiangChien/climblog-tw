import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  },
}));

import { 
  V_GRADES, 
  formatDuration, 
  getHighestGrade, 
  calculateSessionSummary,
  ClimbEntry,
  Session 
} from '../lib/types';

describe('V_GRADES', () => {
  it('should contain all V grades from VB to V10+', () => {
    expect(V_GRADES).toContain('VB');
    expect(V_GRADES).toContain('V0');
    expect(V_GRADES).toContain('V5');
    expect(V_GRADES).toContain('V10+');
    expect(V_GRADES.length).toBe(13);
  });
});

describe('formatDuration', () => {
  it('should format seconds correctly', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(59)).toBe('00:59');
    expect(formatDuration(60)).toBe('01:00');
    expect(formatDuration(3600)).toBe('1:00:00');
    expect(formatDuration(3661)).toBe('1:01:01');
  });
});

describe('getHighestGrade', () => {
  it('should return null for empty entries', () => {
    expect(getHighestGrade([], true)).toBeNull();
    expect(getHighestGrade([], false)).toBeNull();
  });

  it('should return highest grade for conquer entries', () => {
    const entries: ClimbEntry[] = [
      { id: '1', sessionId: 's1', grade: 'V2', result: 'conquer', attempts: 1, note: null, mediaUri: null, createdAt: Date.now() },
      { id: '2', sessionId: 's1', grade: 'V5', result: 'conquer', attempts: 2, note: null, mediaUri: null, createdAt: Date.now() },
      { id: '3', sessionId: 's1', grade: 'V3', result: 'fail', attempts: 1, note: null, mediaUri: null, createdAt: Date.now() },
    ];
    expect(getHighestGrade(entries, true)).toBe('V5');
  });

  it('should return highest grade for all entries when onlyConquer is false', () => {
    const entries: ClimbEntry[] = [
      { id: '1', sessionId: 's1', grade: 'V2', result: 'conquer', attempts: 1, note: null, mediaUri: null, createdAt: Date.now() },
      { id: '2', sessionId: 's1', grade: 'V7', result: 'fail', attempts: 2, note: null, mediaUri: null, createdAt: Date.now() },
    ];
    expect(getHighestGrade(entries, false)).toBe('V7');
  });
});

describe('calculateSessionSummary', () => {
  it('should calculate correct summary for a session', () => {
    const session: Session = {
      id: 'test-session',
      userId: 'local-user',
      gymId: 'gym-1',
      startTime: Date.now() - 3600000, // 1 hour ago
      endTime: Date.now(),
      note: null,
      entries: [
        { id: '1', sessionId: 'test-session', grade: 'V2', result: 'conquer', attempts: 1, note: null, mediaUri: null, createdAt: Date.now() },
        { id: '2', sessionId: 'test-session', grade: 'V3', result: 'conquer', attempts: 2, note: null, mediaUri: null, createdAt: Date.now() },
        { id: '3', sessionId: 'test-session', grade: 'V4', result: 'fail', attempts: 3, note: null, mediaUri: null, createdAt: Date.now() },
      ],
    };

    const summary = calculateSessionSummary(session);
    
    expect(summary.conquerCount).toBe(2);
    expect(summary.failCount).toBe(1);
    expect(summary.completionRate).toBe(67); // 2/3 * 100 rounded
    expect(summary.totalAttempts).toBe(6);
    expect(summary.highestGrade).toBe('V3'); // highest conquer
    expect(summary.duration).toBeGreaterThan(3500); // approximately 1 hour in seconds
  });

  it('should handle session with no entries', () => {
    const session: Session = {
      id: 'empty-session',
      userId: 'local-user',
      gymId: 'gym-1',
      startTime: Date.now() - 1800000,
      endTime: Date.now(),
      note: null,
      entries: [],
    };

    const summary = calculateSessionSummary(session);
    
    expect(summary.conquerCount).toBe(0);
    expect(summary.failCount).toBe(0);
    expect(summary.completionRate).toBe(0);
    expect(summary.highestGrade).toBeNull();
  });
});
