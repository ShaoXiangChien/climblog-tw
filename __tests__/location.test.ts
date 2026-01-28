import { describe, it, expect } from 'vitest';
import { calculateDistance, formatDistance } from '../lib/distance';

describe('calculateDistance', () => {
  it('should calculate distance between two points correctly', () => {
    // Taipei 101 to Taipei Main Station (approximately 2.5km)
    const taipei101 = { lat: 25.0339, lng: 121.5645 };
    const taipeiStation = { lat: 25.0478, lng: 121.5170 };
    
    const distance = calculateDistance(
      taipei101.lat, taipei101.lng,
      taipeiStation.lat, taipeiStation.lng
    );
    
    // Should be approximately 5km (allowing some tolerance)
    expect(distance).toBeGreaterThan(4);
    expect(distance).toBeLessThan(6);
  });

  it('should return 0 for same coordinates', () => {
    const distance = calculateDistance(25.0339, 121.5645, 25.0339, 121.5645);
    expect(distance).toBe(0);
  });

  it('should handle long distances', () => {
    // Taipei to Kaohsiung (approximately 300km)
    const taipei = { lat: 25.0330, lng: 121.5654 };
    const kaohsiung = { lat: 22.6273, lng: 120.3014 };
    
    const distance = calculateDistance(
      taipei.lat, taipei.lng,
      kaohsiung.lat, kaohsiung.lng
    );
    
    expect(distance).toBeGreaterThan(280);
    expect(distance).toBeLessThan(350);
  });
});

describe('formatDistance', () => {
  it('should format distances under 1km in meters', () => {
    expect(formatDistance(0.5)).toBe('500m');
    expect(formatDistance(0.1)).toBe('100m');
    expect(formatDistance(0.05)).toBe('50m');
  });

  it('should format distances under 10km with one decimal', () => {
    expect(formatDistance(1.5)).toBe('1.5km');
    expect(formatDistance(5.25)).toBe('5.3km');
    expect(formatDistance(9.99)).toBe('10.0km');
  });

  it('should format distances 10km and above as integers', () => {
    expect(formatDistance(10)).toBe('10km');
    expect(formatDistance(25.7)).toBe('26km');
    expect(formatDistance(100)).toBe('100km');
  });
});
