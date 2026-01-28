import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

// Re-export distance utilities
export { calculateDistance, formatDistance } from '@/lib/distance';

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface LocationState {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  permissionStatus: Location.PermissionStatus | null;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    location: null,
    loading: true,
    error: null,
    permissionStatus: null,
  });

  const requestLocation = useCallback(async () => {
    // Skip on web for now (could use browser geolocation API)
    if (Platform.OS === 'web') {
      // Try browser geolocation
      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 300000, // 5 minutes cache
            });
          });
          setState({
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            loading: false,
            error: null,
            permissionStatus: 'granted' as Location.PermissionStatus,
          });
          return;
        } catch (err) {
          setState({
            location: null,
            loading: false,
            error: '無法取得位置',
            permissionStatus: 'denied' as Location.PermissionStatus,
          });
          return;
        }
      }
      setState({
        location: null,
        loading: false,
        error: '瀏覽器不支援位置服務',
        permissionStatus: null,
      });
      return;
    }

    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setState({
          location: null,
          loading: false,
          error: '需要位置權限才能顯示距離',
          permissionStatus: status,
        });
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setState({
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        loading: false,
        error: null,
        permissionStatus: status,
      });
    } catch (err) {
      setState({
        location: null,
        loading: false,
        error: '無法取得位置',
        permissionStatus: null,
      });
    }
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return {
    ...state,
    refresh: requestLocation,
  };
}
