import { View, Text, Pressable, FlatList, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useSessions, useStoreLoaded } from '@/hooks/use-store';
import { getGymById } from '@/data/gyms';
import { Session, getHighestGrade, calculateSessionSummary } from '@/lib/types';

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekday = weekdays[date.getDay()];
  return `${month}/${day} (${weekday})`;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}

function SessionCard({ session, onPress }: { session: Session; onPress: () => void }) {
  const colors = useColors();
  const gym = getGymById(session.gymId);
  const summary = calculateSessionSummary(session);
  const highestGrade = getHighestGrade(session.entries, true) || getHighestGrade(session.entries, false);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.sessionCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={styles.sessionHeader}>
        <View style={styles.dateContainer}>
          <Text style={[styles.dateText, { color: colors.foreground }]}>
            {formatDate(session.startTime)}
          </Text>
          <Text style={[styles.timeText, { color: colors.muted }]}>
            {formatTime(session.startTime)}
          </Text>
        </View>
        {highestGrade && (
          <View style={[styles.gradeBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.gradeBadgeText}>{highestGrade}</Text>
          </View>
        )}
      </View>

      <View style={styles.gymRow}>
        <IconSymbol name="figure.climbing" size={18} color={colors.primary} />
        <Text style={[styles.gymName, { color: colors.foreground }]} numberOfLines={1}>
          {gym?.name || '未知攀岩館'}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>{summary.conquerCount}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Conquer</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.warning }]}>{summary.failCount}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Not Yet</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{summary.completionRate}%</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>完成率</Text>
        </View>
      </View>

      <IconSymbol
        name="chevron.right"
        size={18}
        color={colors.muted}
        style={styles.chevron}
      />
    </Pressable>
  );
}

export default function HistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const isLoaded = useStoreLoaded();
  const sessions = useSessions();

  const handleSessionPress = (session: Session) => {
    router.push(`/session/${session.id}` as any);
  };

  if (!isLoaded) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text style={{ color: colors.muted }}>載入中...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>歷史紀錄</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          回顧你的攀爬旅程
        </Text>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '20' }]}>
            <IconSymbol name="clock.fill" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            還沒有攀爬紀錄
          </Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            開始你的第一次攀爬，紀錄會顯示在這裡
          </Text>
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push('/(tabs)');
            }}
            style={({ pressed }) => [
              styles.emptyButton,
              { backgroundColor: colors.primary },
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            ]}
          >
            <Text style={styles.emptyButtonText}>探索攀岩館</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SessionCard session={item} onPress={() => handleSessionPress(item)} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  // Sports Tech Style
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sessionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    position: 'relative',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateContainer: {
    gap: 2,
  },
  dateText: {
    fontSize: 17,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 13,
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  gradeBadgeText: {
    color: '#0D0D0F',
    fontSize: 14,
    fontWeight: '800',
  },
  gymRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  gymName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  chevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -9,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
