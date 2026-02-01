import { useState, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Platform,
  RefreshControl,
  ScrollView,
  Dimensions,
  Linking,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useLocation, calculateDistance, formatDistance } from '@/hooks/use-location';
import { useFavorites, useRecentGyms, useStoreActions } from '@/hooks/use-store';
import { GYMS } from '@/data/gyms';
import { Gym } from '@/lib/types';
import { RegionFilter, TypeFilter, GymType } from '@/lib/types';

// Conditionally import MapView only on native platforms
let MapView: any = null;
let Marker: any = null;
let Callout: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Callout = Maps.Callout;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const REGIONS: RegionFilter[] = ['全部', '台北', '新北', '桃園', '台中', '台南', '高雄', '其他'];
const TYPES: TypeFilter[] = ['全部', '抱石', '上攀', '混合'];

const TYPE_MAP: Record<string, GymType> = {
  '抱石': 'bouldering',
  '上攀': 'lead',
  '混合': 'mixed',
};

const TYPE_LABELS: Record<GymType, string> = {
  bouldering: '抱石',
  lead: '上攀',
  mixed: '混合',
};

// Featured gyms (hand-picked popular ones)
const FEATURED_GYM_IDS = ['gym-001', 'gym-002', 'gym-005', 'gym-008'];

// Taiwan center coordinates
const TAIWAN_CENTER = {
  latitude: 25.0330,
  longitude: 121.5654,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

interface GymWithDistance extends Gym {
  distance: number | null;
}

type ViewMode = 'list' | 'map';

// View Mode Toggle Component
function ViewModeToggle({ mode, onModeChange }: { mode: ViewMode; onModeChange: (mode: ViewMode) => void }) {
  const colors = useColors();

  return (
    <View style={[styles.viewToggle, { backgroundColor: colors.surface }]}>
      <Pressable
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onModeChange('list');
        }}
        style={[
          styles.viewToggleButton,
          mode === 'list' && { backgroundColor: colors.primary },
        ]}
      >
        <IconSymbol name="list.bullet" size={18} color={mode === 'list' ? '#FFFFFF' : colors.muted} />
        <Text style={[styles.viewToggleText, { color: mode === 'list' ? '#FFFFFF' : colors.muted }]}>
          列表
        </Text>
      </Pressable>
      <Pressable
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onModeChange('map');
        }}
        style={[
          styles.viewToggleButton,
          mode === 'map' && { backgroundColor: colors.primary },
        ]}
      >
        <IconSymbol name="map.fill" size={18} color={mode === 'map' ? '#FFFFFF' : colors.muted} />
        <Text style={[styles.viewToggleText, { color: mode === 'map' ? '#FFFFFF' : colors.muted }]}>
          地圖
        </Text>
      </Pressable>
    </View>
  );
}

// Hero Banner Component - Sports Tech Style
function HeroBanner({ onNearestPress, onMapPress }: { onNearestPress: () => void; onMapPress: () => void }) {
  const colors = useColors();

  return (
    <View style={styles.heroBanner}>
      <LinearGradient
        colors={['#1A1A1E', '#0D0D0F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        {/* Neon glow accent line */}
        <View style={[styles.heroAccentLine, { backgroundColor: colors.primary }]} />
        
        <View style={styles.heroContent}>
          <Text style={[styles.heroTitle, { color: colors.primary }]}>探索攀岩館</Text>
          <Text style={[styles.heroSubtitle, { color: colors.muted }]}>找到適合你的攀岩場地</Text>
          <View style={styles.heroButtons}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                onNearestPress();
              }}
              style={({ pressed }) => [
                styles.heroButton,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
              ]}
            >
              <IconSymbol name="location.fill" size={16} color="#0D0D0F" />
              <Text style={[styles.heroButtonText, { color: '#0D0D0F' }]}>最近的館</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                onMapPress();
              }}
              style={({ pressed }) => [
                styles.heroButtonOutline,
                { borderColor: colors.primary },
                pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
              ]}
            >
              <IconSymbol name="map.fill" size={16} color={colors.primary} />
              <Text style={[styles.heroButtonOutlineText, { color: colors.primary }]}>開啟地圖</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.heroDecoration}>
          <IconSymbol name="figure.climbing" size={120} color={colors.primary + '15'} />
        </View>
      </LinearGradient>
    </View>
  );
}

// Featured Gym Card (horizontal scroll)
function FeaturedGymCard({ gym, distance, onPress }: { gym: Gym; distance: number | null; onPress: () => void }) {
  const colors = useColors();

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
      }}
      style={({ pressed }) => [
        styles.featuredCard,
        { backgroundColor: colors.surface },
        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={[styles.featuredImage, { backgroundColor: colors.primary + '15' }]}>
        <IconSymbol name="figure.climbing" size={32} color={colors.primary} />
      </View>
      <View style={styles.featuredInfo}>
        <Text style={[styles.featuredName, { color: colors.foreground }]} numberOfLines={1}>
          {gym.name}
        </Text>
        <View style={styles.featuredMeta}>
          <Text style={[styles.featuredLocation, { color: colors.muted }]}>
            {gym.city}
          </Text>
          {distance !== null && (
            <View style={[styles.distanceBadgeSmall, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.distanceTextSmall, { color: colors.primary }]}>
                {formatDistance(distance)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// Recent Gym Card (with visit info)
function RecentGymCard({ 
  gym, 
  distance, 
  lastVisitTime, 
  visitCount, 
  onPress 
}: { 
  gym: Gym; 
  distance: number | null; 
  lastVisitTime: number;
  visitCount: number;
  onPress: () => void;
}) {
  const colors = useColors();

  // Format relative time
  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days} 天前`;
    if (days < 30) return `${Math.floor(days / 7)} 週前`;
    return `${Math.floor(days / 30)} 月前`;
  };

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
      }}
      style={({ pressed }) => [
        styles.recentCard,
        { backgroundColor: colors.surface },
        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={[styles.recentImage, { backgroundColor: colors.primary + '15' }]}>
        <IconSymbol name="figure.climbing" size={28} color={colors.primary} />
        <View style={[styles.visitBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.visitBadgeText}>{visitCount}</Text>
        </View>
      </View>
      <View style={styles.recentInfo}>
        <Text style={[styles.recentName, { color: colors.foreground }]} numberOfLines={1}>
          {gym.name}
        </Text>
        <View style={styles.recentMeta}>
          <IconSymbol name="clock" size={12} color={colors.muted} />
          <Text style={[styles.recentTime, { color: colors.muted }]}>
            {getRelativeTime(lastVisitTime)}
          </Text>
        </View>
        {distance !== null && (
          <Text style={[styles.recentDistance, { color: colors.success }]}>
            {formatDistance(distance)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// Gym List Card - Sports Tech Style
function GymCard({ gym, distance, onPress }: { gym: Gym; distance: number | null; onPress: () => void }) {
  const colors = useColors();

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
      }}
      style={({ pressed }) => [
        styles.gymCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
      ]}
    >
      {/* Left: Icon with glow effect */}
      <View style={[styles.gymIcon, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
        <IconSymbol name="figure.climbing" size={28} color={colors.primary} />
      </View>

      {/* Middle: Info */}
      <View style={styles.gymInfo}>
        <View style={styles.gymNameRow}>
          <Text style={[styles.gymName, { color: colors.foreground }]} numberOfLines={1}>
            {gym.name}
          </Text>
        </View>
        <Text style={[styles.gymLocation, { color: colors.muted }]}>
          {gym.city}・{gym.district}
        </Text>
        <View style={styles.gymMeta}>
          <View style={[styles.typeBadge, { backgroundColor: colors.primary + '30', borderColor: colors.primary + '50' }]}>
            <Text style={[styles.typeBadgeText, { color: colors.primary }]}>
              {TYPE_LABELS[gym.type]}
            </Text>
          </View>
          {gym.priceFrom && (
            <Text style={[styles.priceText, { color: colors.muted }]}>
              ${gym.priceFrom}起
            </Text>
          )}
        </View>
        {gym.tags.length > 0 && (
          <Text style={[styles.tagsText, { color: colors.muted }]} numberOfLines={1}>
            {gym.tags.slice(0, 3).map(t => `#${t}`).join(' ')}
          </Text>
        )}
      </View>

      {/* Right: Distance & Arrow */}
      <View style={styles.gymRight}>
        {distance !== null && (
          <View style={[styles.distanceBadge, { backgroundColor: colors.success + '20', borderColor: colors.success + '40' }]}>
            <IconSymbol name="location.fill" size={12} color={colors.success} />
            <Text style={[styles.distanceText, { color: colors.success }]}>
              {formatDistance(distance)}
            </Text>
          </View>
        )}
        <IconSymbol name="chevron.right" size={18} color={colors.primary} />
      </View>
    </Pressable>
  );
}

// Filter Chip Component
function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
      }}
      style={({ pressed }) => [
        styles.filterChip,
        {
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text
        style={[
          styles.filterChipText,
          { color: selected ? '#FFFFFF' : colors.foreground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Web Map Card (for web platform fallback)
function WebMapCard({ gym, distance, onPress, onMapOpen }: { 
  gym: GymWithDistance; 
  distance: number | null; 
  onPress: () => void;
  onMapOpen: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.webMapCard,
        { backgroundColor: colors.surface },
        pressed && { opacity: 0.9 },
      ]}
    >
      <View style={styles.webMapCardContent}>
        <View style={[styles.webMapIcon, { backgroundColor: colors.primary + '15' }]}>
          <IconSymbol name="figure.climbing" size={24} color={colors.primary} />
        </View>
        <View style={styles.webMapInfo}>
          <Text style={[styles.webMapName, { color: colors.foreground }]} numberOfLines={1}>
            {gym.name}
          </Text>
          <Text style={[styles.webMapLocation, { color: colors.muted }]}>
            {gym.city}・{gym.district}
          </Text>
          <View style={styles.webMapMeta}>
            <View style={[styles.typeBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.typeBadgeText, { color: colors.primary }]}>
                {TYPE_LABELS[gym.type]}
              </Text>
            </View>
            {distance !== null && (
              <Text style={[styles.webMapDistance, { color: colors.success }]}>
                {formatDistance(distance)}
              </Text>
            )}
          </View>
        </View>
        <Pressable
          onPress={onMapOpen}
          style={({ pressed }) => [
            styles.webMapButton,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.8 },
          ]}
        >
          <IconSymbol name="map.fill" size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    </Pressable>
  );
}

// Sort Options
type SortOption = 'distance' | 'price';

export default function ExploreScreen() {
  const colors = useColors();
  const router = useRouter();
  const navigation = useNavigation();
  const mapRef = useRef<any>(null);
  const { location, loading: locationLoading, refresh: refreshLocation } = useLocation();
  const favorites = useFavorites();
  const recentGyms = useRecentGyms();
  const { toggleFavorite } = useStoreActions();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('全部');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('全部');
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [refreshing, setRefreshing] = useState(false);

  // Hide tab bar when in map view
  useLayoutEffect(() => {
    navigation.setOptions({
      tabBarStyle: viewMode === 'map' ? { display: 'none' } : undefined,
    });
  }, [viewMode, navigation]);

  // Calculate distances and sort gyms
  const gymsWithDistance = useMemo<GymWithDistance[]>(() => {
    return GYMS.map(gym => ({
      ...gym,
      distance: location
        ? calculateDistance(location.latitude, location.longitude, gym.lat, gym.lng)
        : null,
    }));
  }, [location]);

  // Filter gyms
  const filteredGyms = useMemo(() => {
    let result = gymsWithDistance;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        gym =>
          gym.name.toLowerCase().includes(query) ||
          gym.city.includes(query) ||
          gym.district.includes(query) ||
          gym.tags.some(tag => tag.includes(query))
      );
    }

    // Region filter
    if (regionFilter !== '全部') {
      if (regionFilter === '其他') {
        const mainCities = ['台北', '新北', '桃園', '台中', '台南', '高雄'];
        result = result.filter(gym => !mainCities.includes(gym.city));
      } else {
        result = result.filter(gym => gym.city === regionFilter);
      }
    }

    // Type filter
    if (typeFilter !== '全部') {
      const gymType = TYPE_MAP[typeFilter];
      result = result.filter(gym => gym.type === gymType);
    }

    // Sort
    if (sortBy === 'distance' && location) {
      result = [...result].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    } else if (sortBy === 'price') {
      result = [...result].sort((a, b) => (a.priceFrom ?? Infinity) - (b.priceFrom ?? Infinity));
    }

    return result;
  }, [gymsWithDistance, searchQuery, regionFilter, typeFilter, sortBy, location]);

  // Featured gyms
  const featuredGyms = useMemo(() => {
    return gymsWithDistance
      .filter(gym => FEATURED_GYM_IDS.includes(gym.id))
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }, [gymsWithDistance]);

  // Favorite gyms
  const favoriteGyms = useMemo(() => {
    return gymsWithDistance
      .filter(gym => favorites.includes(gym.id))
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }, [gymsWithDistance, favorites]);

  // Recently visited gyms
  const recentVisitedGyms = useMemo(() => {
    return recentGyms
      .map(recent => {
        const gym = gymsWithDistance.find(g => g.id === recent.gymId);
        if (!gym) return null;
        return {
          ...gym,
          lastVisitTime: recent.lastVisitTime,
          visitCount: recent.visitCount,
        };
      })
      .filter((g): g is GymWithDistance & { lastVisitTime: number; visitCount: number } => g !== null)
      .slice(0, 5);
  }, [gymsWithDistance, recentGyms]);

  // Map initial region
  const mapRegion = useMemo(() => {
    if (location) {
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }
    return TAIWAN_CENTER;
  }, [location]);

  const handleGymPress = useCallback((gymId: string) => {
    router.push(`/gym/${gymId}` as any);
  }, [router]);

  const handleNearestPress = useCallback(() => {
    if (filteredGyms.length > 0 && filteredGyms[0].distance !== null) {
      handleGymPress(filteredGyms[0].id);
    }
  }, [filteredGyms, handleGymPress]);

  const handleMapPress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setViewMode('map');
  }, []);

  const openInGoogleMaps = useCallback((gym: Gym) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${gym.lat},${gym.lng}`;
    Linking.openURL(url);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshLocation();
    setRefreshing(false);
  }, [refreshLocation]);

  const renderListHeader = () => (
    <>
      {/* Hero Banner */}
      <HeroBanner onNearestPress={handleNearestPress} onMapPress={handleMapPress} />

      {/* Recently Visited Section */}
      {recentVisitedGyms.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>最近造訪</Text>
            <IconSymbol name="clock.fill" size={18} color={colors.primary} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredScroll}
          >
            {recentVisitedGyms.map(gym => (
              <RecentGymCard
                key={gym.id}
                gym={gym}
                distance={gym.distance}
                lastVisitTime={gym.lastVisitTime}
                visitCount={gym.visitCount}
                onPress={() => handleGymPress(gym.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Favorites Section */}
      {favoriteGyms.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>我的收藏</Text>
            <IconSymbol name="heart.fill" size={18} color={colors.error} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredScroll}
          >
            {favoriteGyms.map(gym => (
              <FeaturedGymCard
                key={gym.id}
                gym={gym}
                distance={gym.distance}
                onPress={() => handleGymPress(gym.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Featured Section */}
      {featuredGyms.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>熱門攀岩館</Text>
            <IconSymbol name="flame.fill" size={18} color={colors.primary} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredScroll}
          >
            {featuredGyms.map(gym => (
              <FeaturedGymCard
                key={gym.id}
                gym={gym}
                distance={gym.distance}
                onPress={() => handleGymPress(gym.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* View Mode Toggle */}
      <View style={styles.viewToggleContainer}>
        <ViewModeToggle mode={viewMode} onModeChange={setViewMode} />
      </View>

      {/* Search Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.searchSection}>
            <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
              <TextInput
                style={[styles.searchInput, { color: colors.foreground }]}
                placeholder="搜尋館名或地區..."
                placeholderTextColor={colors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                blurOnSubmit={true}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <IconSymbol name="xmark.circle.fill" size={20} color={colors.muted} />
                </Pressable>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.muted }]}>地區</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterChips}>
              {REGIONS.map(region => (
                <FilterChip
                  key={region}
                  label={region}
                  selected={regionFilter === region}
                  onPress={() => setRegionFilter(region)}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: colors.muted }]}>類型</Text>
          <View style={styles.filterChips}>
            {TYPES.map(type => (
              <FilterChip
                key={type}
                label={type}
                selected={typeFilter === type}
                onPress={() => setTypeFilter(type)}
              />
            ))}
          </View>
        </View>

        {/* Sort Options */}
        <View style={styles.sortRow}>
          <Text style={[styles.filterLabel, { color: colors.muted }]}>排序</Text>
          <View style={styles.sortOptions}>
            <Pressable
              onPress={() => setSortBy('distance')}
              style={[
                styles.sortOption,
                sortBy === 'distance' && { backgroundColor: colors.primary + '15' },
              ]}
            >
              <IconSymbol
                name="location.fill"
                size={14}
                color={sortBy === 'distance' ? colors.primary : colors.muted}
              />
              <Text
                style={[
                  styles.sortOptionText,
                  { color: sortBy === 'distance' ? colors.primary : colors.muted },
                ]}
              >
                距離
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSortBy('price')}
              style={[
                styles.sortOption,
                sortBy === 'price' && { backgroundColor: colors.primary + '15' },
              ]}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  { color: sortBy === 'price' ? colors.primary : colors.muted },
                ]}
              >
                價格
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsCount, { color: colors.muted }]}>
          找到 {filteredGyms.length} 間攀岩館
        </Text>
        {locationLoading && (
          <Text style={[styles.locationStatus, { color: colors.muted }]}>
            正在取得位置...
          </Text>
        )}
      </View>
    </>
  );

  // Native Map View
  const renderNativeMapView = () => {
    if (!MapView) return null;

    return (
      <View style={styles.fullScreenMapContainer}>
        <MapView
          ref={mapRef}
          style={styles.fullScreenMap}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={mapRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
        >
          {filteredGyms.map(gym => (
            <Marker
              key={gym.id}
              coordinate={{ latitude: gym.lat, longitude: gym.lng }}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
            >
              {/* Custom Marker */}
              <View style={[styles.markerContainer, { backgroundColor: colors.primary }]}>
                <IconSymbol name="figure.climbing" size={16} color="#FFFFFF" />
              </View>
              <View style={[styles.markerArrow, { borderTopColor: colors.primary }]} />

              {/* Callout */}
              <Callout tooltip onPress={() => handleGymPress(gym.id)}>
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

        {/* Back Button - Top Left */}
        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            setViewMode('list');
          }}
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: 'rgba(26, 26, 27, 0.92)' },
            pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
          ]}
        >
          <IconSymbol name="chevron.left" size={28} color="#FFFFFF" />
        </Pressable>

        {/* Map Filter Chips */}
        <View style={styles.mapFilters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.mapFilterChips}>
              {REGIONS.slice(0, 5).map(region => (
                <Pressable
                  key={region}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setRegionFilter(region);
                  }}
                  style={[
                    styles.mapFilterChip,
                    {
                      backgroundColor: regionFilter === region ? colors.primary : colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.mapFilterChipText,
                      { color: regionFilter === region ? '#FFFFFF' : colors.foreground },
                    ]}
                  >
                    {region}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Gym Count Badge */}
        <View style={[styles.countBadge, { backgroundColor: colors.surface }]}>
          <IconSymbol name="figure.climbing" size={14} color={colors.primary} />
          <Text style={[styles.countText, { color: colors.foreground }]}>
            {filteredGyms.length} 間
          </Text>
        </View>
      </View>
    );
  };

  // Web Map View (fallback with list + map links)
  const renderWebMapView = () => (
    <ScreenContainer>
      <View style={styles.webMapContainer}>
        {/* Header */}
        <View style={[styles.webMapHeader, { backgroundColor: colors.background }]}>
          <View style={styles.mapHeaderContent}>
            <Text style={[styles.mapHeaderTitle, { color: colors.foreground }]}>
              地圖檢視
            </Text>
            <Text style={[styles.mapHeaderSubtitle, { color: colors.muted }]}>
              點擊地圖按鈕在 Google Maps 中查看
            </Text>
          </View>
          <ViewModeToggle mode={viewMode} onModeChange={setViewMode} />
        </View>

        {/* Filter Chips */}
        <View style={styles.webMapFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.mapFilterChips}>
              {REGIONS.map(region => (
                <Pressable
                  key={region}
                  onPress={() => setRegionFilter(region)}
                  style={[
                    styles.mapFilterChip,
                    {
                      backgroundColor: regionFilter === region ? colors.primary : colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.mapFilterChipText,
                      { color: regionFilter === region ? '#FFFFFF' : colors.foreground },
                    ]}
                  >
                    {region}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Gym List with Map Buttons */}
        <FlatList
          data={filteredGyms}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <WebMapCard
              gym={item}
              distance={item.distance}
              onPress={() => handleGymPress(item.id)}
              onMapOpen={() => openInGoogleMaps(item)}
            />
          )}
          contentContainerStyle={styles.webMapList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ScreenContainer>
  );

  // Map View (platform-specific)
  if (viewMode === 'map') {
    if (Platform.OS === 'web') {
      return renderWebMapView();
    }
    return renderNativeMapView();
  }

  // List View
  return (
    <ScreenContainer>
      <FlatList
        data={filteredGyms}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <GymCard
            gym={item}
            distance={item.distance}
            onPress={() => handleGymPress(item.id)}
          />
        )}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconSymbol name="magnifyingglass" size={48} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              找不到符合條件的攀岩館
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  // View Toggle
  viewToggleContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  viewToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Hero Banner - Sports Tech Style
  heroBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2E',
  },
  heroGradient: {
    padding: 24,
    minHeight: 160,
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'relative',
  },
  heroAccentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  heroSubtitle: {
    fontSize: 15,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  heroButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  heroButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
  },
  heroButtonOutlineText: {
    fontSize: 14,
    fontWeight: '700',
  },
  heroDecoration: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    opacity: 1,
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  // Featured Cards
  featuredScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  featuredCard: {
    width: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  featuredImage: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredInfo: {
    padding: 12,
  },
  featuredName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featuredLocation: {
    fontSize: 12,
  },
  distanceBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  distanceTextSmall: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Recent Cards
  recentCard: {
    width: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
  },
  recentImage: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  visitBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visitBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recentInfo: {
    padding: 10,
  },
  recentName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  recentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  recentTime: {
    fontSize: 11,
  },
  recentDistance: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Search
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },

  // Filters
  filtersSection: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  filterRow: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Sort
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sortOptionText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Results
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 13,
  },
  locationStatus: {
    fontSize: 12,
  },

  // Gym Card - Sports Tech Style
  gymCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 14,
  },
  gymIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gymInfo: {
    flex: 1,
    gap: 4,
  },
  gymNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gymName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  gymLocation: {
    fontSize: 13,
  },
  gymMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  priceText: {
    fontSize: 12,
  },
  tagsText: {
    fontSize: 11,
    marginTop: 2,
  },
  gymRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // List
  listContent: {
    paddingBottom: 120,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
  },

  // Map View
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  // Full Screen Map View
  fullScreenMapContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: '100%',
  },
  fullScreenMap: {
    ...StyleSheet.absoluteFillObject,
  },
  // Back Button
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  mapHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  mapHeaderContent: {
    gap: 2,
  },
  mapHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  mapHeaderSubtitle: {
    fontSize: 13,
  },
  mapFilters: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 110,
    left: 0,
    right: 0,
  },
  mapFilterChips: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  mapFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mapFilterChipText: {
    fontSize: 13,
    fontWeight: '500',
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

  // Count Badge
  countBadge: {
    position: 'absolute',
    left: 16,
    bottom: 100,
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

  // Web Map View
  webMapContainer: {
    flex: 1,
  },
  webMapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  webMapFiltersContainer: {
    paddingBottom: 12,
  },
  webMapList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  webMapCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  webMapCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  webMapIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webMapInfo: {
    flex: 1,
    gap: 4,
  },
  webMapName: {
    fontSize: 15,
    fontWeight: '600',
  },
  webMapLocation: {
    fontSize: 12,
  },
  webMapMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  webMapDistance: {
    fontSize: 12,
    fontWeight: '600',
  },
  webMapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
