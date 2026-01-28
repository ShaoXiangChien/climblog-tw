import { View, Text, Pressable, ScrollView, StyleSheet, Platform, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useSessions, useSettings, useStoreLoaded } from '@/hooks/use-store';
import { getHighestGrade, calculateSessionSummary } from '@/lib/types';

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: any;
  value: string | number;
  label: string;
  color: string;
}) {
  const colors = useColors();

  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20', borderColor: color + '40' }]}>
        <IconSymbol name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

function SettingItem({
  icon,
  title,
  value,
  onPress,
  showChevron = true,
}: {
  icon: any;
  title: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={() => {
        if (onPress) {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onPress();
        }
      }}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.settingItem,
        { backgroundColor: colors.surface },
        pressed && onPress && { opacity: 0.7 },
      ]}
    >
      <IconSymbol name={icon} size={22} color={colors.primary} />
      <Text style={[styles.settingTitle, { color: colors.foreground }]}>{title}</Text>
      {value && <Text style={[styles.settingValue, { color: colors.muted }]}>{value}</Text>}
      {showChevron && onPress && (
        <IconSymbol name="chevron.right" size={18} color={colors.muted} />
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const isLoaded = useStoreLoaded();
  const sessions = useSessions();
  const settings = useSettings();

  // Calculate overall stats
  const totalSessions = sessions.length;
  const totalClimbs = sessions.reduce((sum, s) => sum + s.entries.length, 0);
  const allEntries = sessions.flatMap((s) => s.entries);
  const highestGrade = getHighestGrade(allEntries, true) || '-';
  const totalConquers = allEntries.filter((e) => e.result === 'conquer').length;

  const handleExportData = () => {
    Alert.alert('功能開發中', '資料匯出功能將在未來版本推出');
  };

  const handleAbout = () => {
    Alert.alert(
      'ClimbLog TW',
      '版本 1.0.0\n\n台灣攀岩 Logbook\n快速找館、記錄攀爬、分享成果',
      [{ text: '確定' }]
    );
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <IconSymbol name="person.fill" size={40} color="#FFFFFF" />
          </View>
          <Text style={[styles.greeting, { color: colors.foreground }]}>攀岩者</Text>
          <Text style={[styles.subGreeting, { color: colors.muted }]}>
            持續挑戰，突破自我
          </Text>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>總覽</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="flame.fill"
              value={totalSessions}
              label="攀爬次數"
              color={colors.primary}
            />
            <StatCard
              icon="checkmark"
              value={totalConquers}
              label="完攀數"
              color={colors.success}
            />
            <StatCard
              icon="trophy.fill"
              value={highestGrade}
              label="最高難度"
              color={colors.warning}
            />
            <StatCard
              icon="chart.bar.fill"
              value={totalClimbs}
              label="總紀錄"
              color={colors.primary}
            />
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>設定</Text>
          <View style={[styles.settingsGroup, { borderColor: colors.border }]}>
            <SettingItem
              icon="chart.bar.fill"
              title="等級系統"
              value="V 級"
              showChevron={false}
            />
            <View style={[styles.settingDivider, { backgroundColor: colors.border }]} />
            <SettingItem
              icon="square.and.arrow.up"
              title="匯出資料"
              onPress={handleExportData}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>關於</Text>
          <View style={[styles.settingsGroup, { borderColor: colors.border }]}>
            <SettingItem
              icon="figure.climbing"
              title="關於 ClimbLog TW"
              onPress={handleAbout}
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.muted }]}>
            ClimbLog TW v1.0.0
          </Text>
          <Text style={[styles.footerText, { color: colors.muted }]}>
            Made with ❤️ for climbers in Taiwan
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  // Sports Tech Style
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
  },
  subGreeting: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsGroup: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  settingTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 15,
  },
  settingDivider: {
    height: 1,
    marginLeft: 50,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
