import { useMemo, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { GymCard } from '@/components/gym-card';
import { useColors } from '@/hooks/use-colors';
import { useFavorites } from '@/hooks/use-store';
import { useLocation, calculateDistance } from '@/hooks/use-location';
import { GYMS } from '@/data/gyms';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function FavoritesScreen() {
  const colors = useColors();
  const router = useRouter();
  const favorites = useFavorites();
  const { location } = useLocation();

  const favoriteGyms = useMemo(() => {
    return GYMS
      .filter(gym => favorites.includes(gym.id))
      .map(gym => ({
        ...gym,
        distance: location
          ? calculateDistance(location.latitude, location.longitude, gym.lat, gym.lng)
          : null,
      }))
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }, [favorites, location]);

  const handleGymPress = useCallback((gymId: string) => {
    router.push(`/gym/${gymId}` as any);
  }, [router]);

  return (
    <ScreenContainer edges={['left', 'right', 'bottom']}>
      <Stack.Screen 
        options={{ 
          title: '我的收藏', 
          headerBackTitle: '返回',
          headerShown: true,
          headerTintColor: colors.primary,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            color: colors.foreground,
          }
        }} 
      />
      
      <FlatList
        data={favoriteGyms}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <GymCard
            gym={item}
            distance={item.distance}
            onPress={() => handleGymPress(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
              <IconSymbol name="heart.fill" size={48} color={colors.muted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              還沒有收藏的攀岩館
            </Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              在探索頁面點擊愛心圖示，將喜歡的攀岩館加入收藏
            </Text>
            <Pressable
              onPress={() => router.back()}
              style={[styles.button, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.buttonText, { color: '#000000' }]}>
                去探索
              </Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
    gap: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
