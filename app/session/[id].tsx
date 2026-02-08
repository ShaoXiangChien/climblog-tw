import { useState, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform, Alert, Share, Modal, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';

import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useSessionById, useSettings } from '@/hooks/use-store';
import { getGymById } from '@/data/gyms';
import { calculateSessionSummary, formatDuration, getHighestGrade } from '@/lib/types';

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

// Story Card Component (for capture)
function StoryCard({
  summary,
  gymName,
  date,
  cardRef,
  textColor = 'white',
  userName,
}: {
  summary: ReturnType<typeof calculateSessionSummary>;
  gymName: string;
  date: string;
  cardRef: React.RefObject<View | null>;
  textColor?: 'white' | 'black';
  userName?: string | null;
}) {
  // TODO: 左上角放rockr logo + 用戶名
  // Define color based on textColor prop
  const primaryTextColor = textColor === 'white' ? '#FFFFFF' : '#000000';
  const secondaryTextOpacity = textColor === 'white' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)';
  const tertiaryTextOpacity = textColor === 'white' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
  const quaternaryTextOpacity = textColor === 'white' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const badgeBackground = textColor === 'white' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  const dividerColor = textColor === 'white' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';

  return (
    <View
      ref={cardRef as any}
      style={styles.storyCard}
      collapsable={false}
    >
      {/* Background gradient overlay */}
      <View style={styles.storyOverlay} />

      {/* Content */}
      <View style={styles.storyContent}>
        {/* Top badge */}
        <View style={[styles.storyBadge, { backgroundColor: badgeBackground }]}>
          <Text style={[styles.storyBadgeText, { color: primaryTextColor }]}>
            🧗 Rockr{userName ? ` • ${userName}` : ''}
          </Text>
        </View>

        {/* Main stats */}
        <View style={styles.storyMain}>
          <Text style={[styles.storyConquerLabel, { color: secondaryTextOpacity }]}>CONQUER</Text>
          <Text style={[styles.storyConquerValue, { color: primaryTextColor }]}>{summary.conquerCount}</Text>
        </View>

        {/* Secondary stats */}
        <View style={styles.storyStats}>
          <View style={styles.storyStatItem}>
            <Text style={[styles.storyStatValue, { color: primaryTextColor }]}>{summary.highestGrade || '-'}</Text>
            <Text style={[styles.storyStatLabel, { color: tertiaryTextOpacity }]}>最高難度</Text>
          </View>
          <View style={[styles.storyStatDivider, { backgroundColor: dividerColor }]} />
          <View style={styles.storyStatItem}>
            <Text style={[styles.storyStatValue, { color: primaryTextColor }]}>{summary.completionRate}%</Text>
            <Text style={[styles.storyStatLabel, { color: tertiaryTextOpacity }]}>完成率</Text>
          </View>
          <View style={[styles.storyStatDivider, { backgroundColor: dividerColor }]} />
          <View style={styles.storyStatItem}>
            <Text style={[styles.storyStatValue, { color: primaryTextColor }]}>{formatDuration(summary.duration)}</Text>
            <Text style={[styles.storyStatLabel, { color: tertiaryTextOpacity }]}>時長</Text>
          </View>
        </View>

        {/* Bottom info */}
        <View style={styles.storyFooter}>
          <Text style={[styles.storyGymName, { color: primaryTextColor }]}>{gymName}</Text>
          <Text style={[styles.storyDate, { color: secondaryTextOpacity }]}>{date}</Text>
          <Text style={[styles.storyLocation, { color: quaternaryTextOpacity }]}>Taiwan 🇹🇼</Text>
        </View>
      </View>
    </View>
  );
}

// Story Card Modal
function StoryCardModal({
  visible,
  onClose,
  summary,
  gymName,
  date,
  userName,
}: {
  visible: boolean;
  onClose: () => void;
  summary: ReturnType<typeof calculateSessionSummary>;
  gymName: string;
  date: string;
  userName?: string | null;
}) {
  const colors = useColors();
  const cardRef = useRef<View | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [textColor, setTextColor] = useState<'white' | 'black'>('white');

  const handleShare = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        width: 1080,
        height: 1920,
      });

      await Share.share({
        url: uri,
        message: `今天在 ${gymName} 完攀了 ${summary.conquerCount} 條路線！最高難度 ${summary.highestGrade || '-'} 🧗`,
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('分享失敗', '無法分享圖片');
    }
  };

  const handleSave = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSaving(true);

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('需要權限', '請允許存取相簿以儲存圖片');
        setIsSaving(false);
        return;
      }

      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        width: 1080,
        height: 1920,
      });

      await MediaLibrary.saveToLibraryAsync(uri);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('已儲存', '圖片已存到相簿');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('儲存失敗', '無法儲存圖片');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>分享圖片卡</Text>
            <Pressable onPress={onClose}>
              <IconSymbol name="xmark" size={24} color={colors.muted} />
            </Pressable>
          </View>

          {/* Text Color Selector */}
          <View style={styles.colorSelectorContainer}>
            <Text style={[styles.colorSelectorLabel, { color: colors.muted }]}>字體顏色</Text>
            <View style={styles.colorSelectorButtons}>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setTextColor('white');
                }}
                style={({ pressed }) => [
                  styles.colorButton,
                  { 
                    backgroundColor: '#FFFFFF',
                    borderColor: textColor === 'white' ? colors.primary : colors.border,
                    borderWidth: textColor === 'white' ? 3 : 1,
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                {textColor === 'white' && (
                  <View style={[styles.colorButtonCheck, { backgroundColor: colors.primary }]}>
                    <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setTextColor('black');
                }}
                style={({ pressed }) => [
                  styles.colorButton,
                  { 
                    backgroundColor: '#000000',
                    borderColor: textColor === 'black' ? colors.primary : colors.border,
                    borderWidth: textColor === 'black' ? 3 : 1,
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                {textColor === 'black' && (
                  <View style={[styles.colorButtonCheck, { backgroundColor: colors.primary }]}>
                    <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            </View>
          </View>

          {/* Card Preview */}
          <View style={styles.cardPreviewContainer}>
            <View style={styles.cardPreviewWrapper}>
              <StoryCard
                summary={summary}
                gymName={gymName}
                date={date}
                cardRef={cardRef}
                textColor={textColor}
                userName={userName}
              />
            </View>
          </View>

          {/* Actions */}
          <View style={styles.modalActions}>
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.7 },
                isSaving && { opacity: 0.5 },
              ]}
            >
              <IconSymbol name="arrow.down.to.line" size={22} color={colors.foreground} />
              <Text style={[styles.actionButtonText, { color: colors.foreground }]}>
                {isSaving ? '儲存中...' : '存到相簿'}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [
                styles.actionButton,
                styles.primaryButton,
                { backgroundColor: colors.primary },
                pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
              ]}
            >
              <IconSymbol name="square.and.arrow.up" size={22} color="#FFFFFF" />
              <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>分享</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function SessionDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSessionById(id);
  const settings = useSettings();
  const [showStoryCard, setShowStoryCard] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  if (!session) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text style={{ color: colors.muted }}>找不到此紀錄</Text>
      </ScreenContainer>
    );
  }

  const gym = getGymById(session.gymId);
  const summary = calculateSessionSummary(session);
  const dateStr = formatDate(session.startTime);

  const handleGoBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>攀爬紀錄</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Date & Gym */}
        <View style={styles.infoSection}>
          <Text style={[styles.dateText, { color: colors.foreground }]}>{dateStr}</Text>
          <View style={styles.gymRow}>
            <IconSymbol name="figure.climbing" size={18} color={colors.primary} />
            <Text style={[styles.gymName, { color: colors.muted }]}>{gym?.name || '未知攀岩館'}</Text>
          </View>
        </View>

        {/* Summary Stats */}
        <View style={styles.summarySection}>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, { backgroundColor: colors.success + '15' }]}>
              <Text style={[styles.summaryValue, { color: colors.success }]}>{summary.conquerCount}</Text>
              <Text style={[styles.summaryLabel, { color: colors.success }]}>Conquer</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.warning + '15' }]}>
              <Text style={[styles.summaryValue, { color: colors.warning }]}>{summary.failCount}</Text>
              <Text style={[styles.summaryLabel, { color: colors.warning }]}>Not Yet</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>{summary.highestGrade || '-'}</Text>
              <Text style={[styles.summaryLabel, { color: colors.primary }]}>最高難度</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>{summary.completionRate}%</Text>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>完成率</Text>
            </View>
          </View>

          <View style={styles.extraStats}>
            <View style={styles.extraStatItem}>
              <Text style={[styles.extraStatLabel, { color: colors.muted }]}>總嘗試</Text>
              <Text style={[styles.extraStatValue, { color: colors.foreground }]}>{summary.totalAttempts} 次</Text>
            </View>
            <View style={styles.extraStatItem}>
              <Text style={[styles.extraStatLabel, { color: colors.muted }]}>時長</Text>
              <Text style={[styles.extraStatValue, { color: colors.foreground }]}>{formatDuration(summary.duration)}</Text>
            </View>
          </View>
        </View>

        {/* Entries List */}
        <View style={styles.entriesSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            攀爬紀錄 ({session.entries.length})
          </Text>
          {session.entries.map((entry, index) => (
            <Pressable
              key={entry.id}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                if (entry.mediaUri) {
                  setSelectedEntry(entry);
                }
              }}
              style={({ pressed }) => [
                styles.entryCard,
                { backgroundColor: colors.surface },
                pressed && entry.mediaUri && { opacity: 0.7 },
              ]}
            >
              <View
                style={[
                  styles.entryGrade,
                  { backgroundColor: entry.result === 'conquer' ? colors.success : colors.warning },
                ]}
              >
                <Text style={styles.entryGradeText}>{entry.grade}</Text>
              </View>
              <View style={styles.entryInfo}>
                <Text style={[styles.entryResult, { color: colors.foreground }]}>
                  {entry.result === 'conquer' ? 'Conquer' : 'Not Yet'}
                </Text>
                <Text style={[styles.entryAttempts, { color: colors.muted }]}>
                  {entry.attempts} 次嘗試
                </Text>
                {entry.note && (
                  <Text style={[styles.entryNote, { color: colors.muted }]} numberOfLines={2}>
                    {entry.note}
                  </Text>
                )}
              </View>
              {entry.mediaUri && (
                <Image source={{ uri: entry.mediaUri }} style={styles.entryThumbnail} />
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomCTA, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            setShowStoryCard(true);
          }}
          style={({ pressed }) => [
            styles.shareButton,
            { backgroundColor: colors.primary },
            pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
          ]}
        >
          <IconSymbol name="square.and.arrow.up" size={22} color="#FFFFFF" />
          <Text style={styles.shareButtonText}>生成分享圖片卡</Text>
        </Pressable>
      </View>

      <StoryCardModal
        visible={showStoryCard}
        onClose={() => setShowStoryCard(false)}
        summary={summary}
        gymName={gym?.name || '攀岩館'}
        date={dateStr}
        userName={settings.userName}
      />

      {/* Entry Detail Modal */}
      <Modal visible={!!selectedEntry} animationType="fade" transparent>
        <Pressable 
          style={styles.entryModalOverlay}
          onPress={() => setSelectedEntry(null)}
        >
          <View style={styles.entryModalContent}>
            {selectedEntry?.mediaUri && (
              <Image 
                source={{ uri: selectedEntry.mediaUri }} 
                style={styles.entryModalImage}
                resizeMode="contain"
              />
            )}
            {selectedEntry?.note && (
              <View style={[styles.entryModalNote, { backgroundColor: colors.surface }]}>
                <Text style={[styles.entryModalNoteText, { color: colors.foreground }]}>
                  {selectedEntry.note}
                </Text>
              </View>
            )}
            <Pressable
              onPress={() => setSelectedEntry(null)}
              style={[styles.entryModalClose, { backgroundColor: colors.surface }]}
            >
              <IconSymbol name="xmark" size={24} color={colors.foreground} />
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  dateText: {
    fontSize: 22,
    fontWeight: '700',
  },
  gymRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gymName: {
    fontSize: 15,
  },
  summarySection: {
    paddingHorizontal: 16,
    gap: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  extraStats: {
    flexDirection: 'row',
    gap: 24,
  },
  extraStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  extraStatLabel: {
    fontSize: 14,
  },
  extraStatValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  entriesSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  entryGrade: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryGradeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  entryInfo: {
    flex: 1,
  },
  entryResult: {
    fontSize: 15,
    fontWeight: '600',
  },
  entryAttempts: {
    fontSize: 13,
    marginTop: 2,
  },
  entryNote: {
    fontSize: 12,
    flex: 1,
  },
  entryThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  entryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryModalContent: {
    width: '90%',
    maxHeight: '80%',
  },
  entryModalImage: {
    width: '100%',
    height: 400,
    borderRadius: 12,
  },
  entryModalNote: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  entryModalNoteText: {
    fontSize: 15,
    lineHeight: 22,
  },
  entryModalClose: {
    position: 'absolute',
    top: -50,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  cardPreviewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cardPreviewWrapper: {
    width: 200,
    height: 355,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  primaryButton: {
    borderWidth: 0,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  // Color Selector styles
  colorSelectorContainer: {
    marginBottom: 20,
  },
  colorSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  colorSelectorButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  colorButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  colorButtonCheck: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Story Card styles
  storyCard: {
    width: 1080,
    height: 1920,
    backgroundColor: 'transparent',
    transform: [{ scale: 200 / 1080 }],
    transformOrigin: 'top left',
  },
  storyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  storyContent: {
    flex: 1,
    padding: 80,
    justifyContent: 'space-between',
  },
  storyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 40,
  },
  storyBadgeText: {
    fontSize: 36,
    fontWeight: '600',
  },
  storyMain: {
    alignItems: 'center',
    gap: 20,
  },
  storyConquerLabel: {
    fontSize: 48,
    fontWeight: '600',
    letterSpacing: 8,
  },
  storyConquerValue: {
    fontSize: 280,
    fontWeight: '800',
    lineHeight: 300,
  },
  storyStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  storyStatItem: {
    alignItems: 'center',
    gap: 8,
  },
  storyStatValue: {
    fontSize: 56,
    fontWeight: '700',
  },
  storyStatLabel: {
    fontSize: 28,
  },
  storyStatDivider: {
    width: 2,
    height: 60,
  },
  storyFooter: {
    alignItems: 'center',
    gap: 12,
  },
  storyGymName: {
    fontSize: 44,
    fontWeight: '700',
    textAlign: 'center',
  },
  storyDate: {
    fontSize: 32,
  },
  storyLocation: {
    fontSize: 28,
    marginTop: 8,
  },
});
