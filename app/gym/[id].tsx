import { View, Text, Pressable, ScrollView, StyleSheet, Linking, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { getGymById } from '@/data/gyms';
import { useStoreActions, useActiveSession, useIsFavorite } from '@/hooks/use-store';
import { GymType } from '@/lib/types';

const TYPE_LABELS: Record<GymType, string> = {
  bouldering: '抱石',
  lead: '上攀',
  mixed: '混合',
};

export default function GymDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { startSession, toggleFavorite } = useStoreActions();
  const activeSession = useActiveSession();
  const isFavorite = useIsFavorite(id);

  const gym = getGymById(id);

  if (!gym) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text style={{ color: colors.muted }}>找不到此攀岩館</Text>
      </ScreenContainer>
    );
  }

  const handleOpenMaps = () => {
    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:',
      default: 'https://maps.google.com/?q=',
    });
    const url = Platform.select({
      ios: `maps:?address=${encodeURIComponent(gym.address)}`,
      android: `geo:0,0?q=${encodeURIComponent(gym.address)}`,
      default: `https://maps.google.com/?q=${encodeURIComponent(gym.address)}`,
    });
    Linking.openURL(url);
  };

  const handleStartSession = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    if (activeSession) {
      Alert.alert(
        '已有進行中的 Session',
        '你目前有一個進行中的攀爬紀錄。要結束它並開始新的嗎？',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '查看進行中',
            onPress: () => router.push('/record'),
          },
        ]
      );
      return;
    }

    await startSession(gym.id);
    router.push('/record');
  };

  const handleGoBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleToggleFavorite = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await toggleFavorite(id);
  };

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleGoBack}
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: colors.surface },
            pressed && { opacity: 0.7 },
          ]}
        >
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </Pressable>
        <Pressable
          onPress={handleToggleFavorite}
          style={({ pressed }) => [
            styles.favoriteButton,
            { backgroundColor: colors.surface },
            pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
          ]}
        >
          <IconSymbol 
            name={isFavorite ? "heart.fill" : "heart"} 
            size={22} 
            color={isFavorite ? colors.error : colors.foreground} 
          />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Image Placeholder */}
        <View style={[styles.heroImage, { backgroundColor: colors.primary + '20' }]}>
          <IconSymbol name="figure.climbing" size={64} color={colors.primary} />
        </View>

        {/* Gym Info */}
        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <Text style={[styles.gymName, { color: colors.foreground }]}>{gym.name}</Text>
            <View style={[styles.typeBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.typeBadgeText, { color: colors.primary }]}>
                {TYPE_LABELS[gym.type]}
              </Text>
            </View>
          </View>

          {/* Address */}
          <Pressable
            onPress={handleOpenMaps}
            style={({ pressed }) => [
              styles.infoRow,
              pressed && { opacity: 0.7 },
            ]}
          >
            <IconSymbol name="location.fill" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.foreground }]}>{gym.address}</Text>
            <IconSymbol name="chevron.right" size={16} color={colors.muted} />
          </Pressable>

          {/* Hours */}
          {gym.hoursText && (
            <View style={styles.infoRow}>
              <IconSymbol name="clock" size={20} color={colors.muted} />
              <Text style={[styles.infoText, { color: colors.muted }]}>{gym.hoursText}</Text>
            </View>
          )}

          {/* Price */}
          {gym.priceFrom && (
            <View style={styles.infoRow}>
              <Text style={[styles.priceLabel, { color: colors.muted }]}>入場費</Text>
              <Text style={[styles.priceValue, { color: colors.foreground }]}>
                ${gym.priceFrom} 起
              </Text>
            </View>
          )}

          {/* Tags */}
          {gym.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>特色</Text>
              <View style={styles.tagsRow}>
                {gym.tags.map((tag, index) => (
                  <View key={index} style={[styles.tag, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.tagText, { color: colors.foreground }]}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomCTA, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Pressable
          onPress={handleStartSession}
          style={({ pressed }) => [
            styles.startButton,
            { backgroundColor: colors.primary },
            pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
          ]}
        >
          <IconSymbol name="flame.fill" size={22} color="#FFFFFF" />
          <Text style={styles.startButtonText}>開始本次攀爬</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heroImage: {
    height: 200,
    marginHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    padding: 16,
    gap: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  gymName: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
  },
  priceLabel: {
    fontSize: 15,
    width: 60,
  },
  priceValue: {
    fontSize: 17,
    fontWeight: '600',
  },
  tagsSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
