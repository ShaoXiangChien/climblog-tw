import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Dimensions } from 'react-native';
import MapView, { Marker, Callout, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { Gym, GymType } from '@/lib/types';
import { formatDistance } from '@/lib/distance';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Taiwan center coordinates
const TAIWAN_CENTER = {
  latitude: 25.0330,
  longitude: 121.5654,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

const TYPE_LABELS: Record<GymType, string> = {
  bouldering: '抱石',
  lead: '上攀',
  mixed: '混合',
};

interface GymWithDistance extends Gym {
  distance: number | null;
}

interface GymMapProps {
  gyms: GymWithDistance[];
  userLocation: { latitude: number; longitude: number } | null;
  onGymPress: (gymId: string) => void;
  selectedGymId?: string | null;
}

export function GymMap({ gyms, userLocation, onGymPress, selectedGymId }: GymMapProps) {
  const colors = useColors();
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initial region based on user location or Taiwan center
  const initialRegion: Region = userLocation
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }
    : TAIWAN_CENTER;

  // Center on user location
  const centerOnUser = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 500);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [userLocation]);

  // Fit to show all gyms
  const fitToGyms = useCallback(() => {
    if (gyms.length > 0 && mapRef.current) {
      const coordinates = gyms.map(gym => ({
        latitude: gym.lat,
        longitude: gym.lng,
      }));
      
      if (userLocation) {
        coordinates.push(userLocation);
      }

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
        animated: true,
      });
    }
  }, [gyms, userLocation]);

  // Focus on selected gym
  useEffect(() => {
    if (selectedGymId && mapRef.current && mapReady) {
      const gym = gyms.find(g => g.id === selectedGymId);
      if (gym) {
        mapRef.current.animateToRegion({
          latitude: gym.lat,
          longitude: gym.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }, 500);
      }
    }
  }, [selectedGymId, gyms, mapReady]);

  const handleMarkerPress = useCallback((gymId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        onMapReady={() => setMapReady(true)}
      >
        {gyms.map(gym => (
          <Marker
            key={gym.id}
            coordinate={{ latitude: gym.lat, longitude: gym.lng }}
            onPress={() => handleMarkerPress(gym.id)}
          >
            {/* Custom Marker */}
            <View style={[styles.markerContainer, { backgroundColor: colors.primary }]}>
              <IconSymbol name="figure.climbing" size={16} color="#FFFFFF" />
            </View>
            <View style={[styles.markerArrow, { borderTopColor: colors.primary }]} />

            {/* Callout */}
            <Callout
              tooltip
              onPress={() => onGymPress(gym.id)}
            >
              <View style={[styles.callout, { backgroundColor: colors.surface }]}>
                <Text style={[styles.calloutTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {gym.name}
                </Text>
                <View style={styles.calloutMeta}>
                  <View style={[styles.calloutBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.calloutBadgeText, { color: colors.primary }]}>
                      {TYPE_LABELS[gym.type]}
                    </Text>
                  </View>
                  {gym.distance !== null && (
                    <Text style={[styles.calloutDistance, { color: colors.success }]}>
                      {formatDistance(gym.distance)}
                    </Text>
                  )}
                </View>
                <Text style={[styles.calloutAddress, { color: colors.muted }]} numberOfLines={1}>
                  {gym.city}・{gym.district}
                </Text>
                <View style={styles.calloutAction}>
                  <Text style={[styles.calloutActionText, { color: colors.primary }]}>
                    點擊查看詳情 →
                  </Text>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Map Controls */}
      <View style={styles.controls}>
        {userLocation && (
          <Pressable
            onPress={centerOnUser}
            style={({ pressed }) => [
              styles.controlButton,
              { backgroundColor: colors.surface },
              pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
            ]}
          >
            <IconSymbol name="location.fill" size={20} color={colors.primary} />
          </Pressable>
        )}
        <Pressable
          onPress={fitToGyms}
          style={({ pressed }) => [
            styles.controlButton,
            { backgroundColor: colors.surface },
            pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
          ]}
        >
          <IconSymbol name="map.fill" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {/* Gym Count Badge */}
      <View style={[styles.countBadge, { backgroundColor: colors.surface }]}>
        <IconSymbol name="figure.climbing" size={14} color={colors.primary} />
        <Text style={[styles.countText, { color: colors.foreground }]}>
          {gyms.length} 間攀岩館
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  
  // Marker
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    alignSelf: 'center',
    marginTop: -2,
  },

  // Callout
  callout: {
    width: 220,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  calloutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  calloutBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  calloutBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  calloutDistance: {
    fontSize: 12,
    fontWeight: '600',
  },
  calloutAddress: {
    fontSize: 12,
    marginBottom: 8,
  },
  calloutAction: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 8,
  },
  calloutActionText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Controls
  controls: {
    position: 'absolute',
    right: 16,
    top: 100,
    gap: 10,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  // Count Badge
  countBadge: {
    position: 'absolute',
    left: 16,
    top: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  countText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
