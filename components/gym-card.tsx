import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { formatDistance } from '@/hooks/use-location';
import { Gym } from '@/lib/types';

interface GymCardProps {
  gym: Gym;
  distance: number | null;
  onPress: () => void;
}

export function GymCard({ gym, distance, onPress }: GymCardProps) {
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

const styles = StyleSheet.create({
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
});
