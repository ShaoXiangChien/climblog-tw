import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Modal, TextInput, ScrollView, FlatList, Alert, Image, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useKeepAwake } from 'expo-keep-awake';

import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useActiveSession, useStoreActions, useStoreLoaded } from '@/hooks/use-store';
import { getGymById, GYMS } from '@/data/gyms';
import { V_GRADES, formatDuration, getHighestGrade, ClimbResult } from '@/lib/types';

// Quick Start Screen - Select a gym to start session
function QuickStartScreen() {
  const colors = useColors();
  const router = useRouter();
  const { startSession } = useStoreActions();

  const handleSelectGym = async (gymId: string) => {
    const gym = getGymById(gymId);
    if (!gym) return;

    Alert.alert(
      '開始攀爬',
      `確定要在 ${gym.name} 開始記錄嗎？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '開始',
          onPress: async () => {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            await startSession(gymId);
            router.push('/record');
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>開始攀爬</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          選擇攀岩館開始記錄
        </Text>
      </View>

      <FlatList
        data={GYMS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleSelectGym(item.id)}
            style={({ pressed }) => [
              styles.quickStartCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <View style={[styles.quickStartIcon, { backgroundColor: colors.primary + '20' }]}>
              <IconSymbol name="figure.climbing" size={24} color={colors.primary} />
            </View>
            <View style={styles.quickStartInfo}>
              <Text style={[styles.quickStartName, { color: colors.foreground }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.quickStartLocation, { color: colors.muted }]}>
                {item.city} · {item.district}
              </Text>
            </View>
            <IconSymbol name="plus.circle.fill" size={28} color={colors.primary} />
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

// Add Entry Modal
function AddEntryModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (entry: { grade: string; result: ClimbResult; attempts: number; note: string | null; mediaUri: string | null }) => void;
}) {
  const colors = useColors();
  const [selectedGrade, setSelectedGrade] = useState('V0');
  const [result, setResult] = useState<ClimbResult>('conquer');
  const [attempts, setAttempts] = useState(1);
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const pickImage = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('需要相機權限', '請在設定中開啟相機權限以拍攝照片');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const removePhoto = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPhotoUri(null);
  };

  const handleSave = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onSave({
      grade: selectedGrade,
      result,
      attempts,
      note: note.trim() || null,
      mediaUri: photoUri,
    });
    // Reset form
    setSelectedGrade('V0');
    setResult('conquer');
    setAttempts(1);
    setNote('');
    setPhotoUri(null);
    onClose();
  };

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>新增紀錄</Text>
                <Pressable onPress={handleClose}>
                  <IconSymbol name="xmark" size={24} color={colors.muted} />
                </Pressable>
              </View>

              {/* Scrollable Content */}
              <ScrollView 
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Grade Picker */}
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: colors.muted }]}>難度等級</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.gradeRow}>
                      {V_GRADES.map((grade) => (
                        <Pressable
                          key={grade}
                          onPress={() => {
                            if (Platform.OS !== 'web') {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            setSelectedGrade(grade);
                          }}
                          style={({ pressed }) => [
                            styles.gradeButton,
                            {
                              backgroundColor: selectedGrade === grade ? colors.primary : colors.surface,
                              borderColor: selectedGrade === grade ? colors.primary : colors.border,
                            },
                            pressed && { opacity: 0.8 },
                          ]}
                        >
                          <Text
                            style={[
                              styles.gradeText,
                              { color: selectedGrade === grade ? '#FFFFFF' : colors.foreground },
                            ]}
                          >
                            {grade}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Result Toggle */}
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: colors.muted }]}>結果</Text>
                  <View style={styles.resultRow}>
                    <Pressable
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        }
                        setResult('conquer');
                      }}
                      style={({ pressed }) => [
                        styles.resultButton,
                        {
                          backgroundColor: result === 'conquer' ? colors.success : colors.surface,
                          borderColor: result === 'conquer' ? colors.success : colors.border,
                        },
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <IconSymbol
                        name="checkmark"
                        size={20}
                        color={result === 'conquer' ? '#FFFFFF' : colors.muted}
                      />
                      <Text
                        style={[
                          styles.resultText,
                          { color: result === 'conquer' ? '#FFFFFF' : colors.foreground },
                        ]}
                      >
                        Conquer
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        }
                        setResult('fail');
                      }}
                      style={({ pressed }) => [
                        styles.resultButton,
                        {
                          backgroundColor: result === 'fail' ? colors.warning : colors.surface,
                          borderColor: result === 'fail' ? colors.warning : colors.border,
                        },
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <IconSymbol
                        name="xmark"
                        size={20}
                        color={result === 'fail' ? '#FFFFFF' : colors.muted}
                      />
                      <Text
                        style={[
                          styles.resultText,
                          { color: result === 'fail' ? '#FFFFFF' : colors.foreground },
                        ]}
                      >
                        Not Yet
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Attempts Stepper */}
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: colors.muted }]}>嘗試次數</Text>
                  <View style={styles.stepperRow}>
                    <Pressable
                      onPress={() => {
                        if (attempts > 1) {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          setAttempts(attempts - 1);
                        }
                      }}
                      style={({ pressed }) => [
                        styles.stepperButton,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <IconSymbol name="minus" size={20} color={colors.foreground} />
                    </Pressable>
                    <Text style={[styles.stepperValue, { color: colors.foreground }]}>{attempts}</Text>
                    <Pressable
                      onPress={() => {
                        if (attempts < 10) {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          setAttempts(attempts + 1);
                        }
                      }}
                      style={({ pressed }) => [
                        styles.stepperButton,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <IconSymbol name="plus" size={20} color={colors.foreground} />
                    </Pressable>
                  </View>
                </View>

                {/* Note Input */}
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: colors.muted }]}>備註（選填）</Text>
                  <TextInput
                    style={[
                      styles.noteInput,
                      { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground },
                    ]}
                    placeholder="例如：紅色路線、腳點很小..."
                    placeholderTextColor={colors.muted}
                    value={note}
                    onChangeText={(text) => setNote(text.slice(0, 80))}
                    maxLength={80}
                    multiline
                    blurOnSubmit={true}
                  />
                  <Text style={[styles.charCount, { color: colors.muted }]}>{note.length}/80</Text>
                </View>

                {/* Photo Section */}
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: colors.muted }]}>照片（選填）</Text>
                  {photoUri ? (
                    <View style={styles.photoPreviewContainer}>
                      <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                      <Pressable
                        onPress={removePhoto}
                        style={({ pressed }) => [
                          styles.removePhotoButton,
                          { backgroundColor: colors.error },
                          pressed && { opacity: 0.8 },
                        ]}
                      >
                        <IconSymbol name="xmark" size={16} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.photoButtonsRow}>
                      <Pressable
                        onPress={takePhoto}
                        style={({ pressed }) => [
                          styles.photoButton,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <IconSymbol name="camera.fill" size={24} color={colors.primary} />
                        <Text style={[styles.photoButtonText, { color: colors.foreground }]}>拍照</Text>
                      </Pressable>
                      <Pressable
                        onPress={pickImage}
                        style={({ pressed }) => [
                          styles.photoButton,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <IconSymbol name="photo.fill" size={24} color={colors.primary} />
                        <Text style={[styles.photoButtonText, { color: colors.foreground }]}>相簿</Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                {/* Save Button */}
                <Pressable
                  onPress={handleSave}
                  style={({ pressed }) => [
                    styles.saveButton,
                    { backgroundColor: colors.primary },
                    pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
                  ]}
                >
                  <Text style={styles.saveButtonText}>儲存</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Session Running Screen
function SessionRunningScreen() {
  useKeepAwake(); // Keep screen awake during session
  
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Get safe area insets for proper spacing
  const activeSession = useActiveSession();
  const { endSession, addEntry, deleteEntry } = useStoreActions();
  const [elapsed, setElapsed] = useState(0);
  const [showAddEntry, setShowAddEntry] = useState(false);

  const gym = activeSession ? getGymById(activeSession.gymId) : null;

  // Timer effect
  useEffect(() => {
    if (!activeSession) return;

    const updateElapsed = () => {
      setElapsed(Math.floor((Date.now() - activeSession.startTime) / 1000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const conquerCount = activeSession?.entries.filter((e) => e.result === 'conquer').length ?? 0;
  const failCount = activeSession?.entries.filter((e) => e.result === 'fail').length ?? 0;
  const highestGrade = activeSession ? getHighestGrade(activeSession.entries, true) || getHighestGrade(activeSession.entries, false) : null;

  const handleEndSession = () => {
    Alert.alert(
      '結束本次攀爬？',
      '結束後將顯示本次攀爬摘要',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '結束',
          style: 'destructive',
          onPress: async () => {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            const completedSession = await endSession();
            if (completedSession) {
              router.push(`/session/${completedSession.id}` as any);
            }
          },
        },
      ]
    );
  };

  const handleAddEntry = async (entry: { grade: string; result: ClimbResult; attempts: number; note: string | null; mediaUri: string | null }) => {
    await addEntry(entry);
  };

  const handleDeleteEntry = (entryId: string) => {
    Alert.alert(
      '刪除紀錄？',
      '確定要刪除這條路線紀錄嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: async () => {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            await deleteEntry(entryId);
          },
        },
      ]
    );
  };

  if (!activeSession || !gym) {
    return <QuickStartScreen />;
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.sessionHeader}>
        <View style={[styles.gymBadge, { backgroundColor: colors.primary + '20' }]}>
          <IconSymbol name="figure.climbing" size={20} color={colors.primary} />
          <Text style={[styles.gymBadgeText, { color: colors.primary }]}>{gym.name}</Text>
        </View>
        <View style={styles.timerContainer}>
          <Text style={[styles.timerLabel, { color: colors.muted }]}>攀爬時間</Text>
          <Text style={[styles.timerValue, { color: colors.foreground }]}>
            {formatDuration(elapsed)}
          </Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.success + '15', borderColor: colors.success + '40' }]}>
          <Text style={[styles.statValue, { color: colors.success }]}>{conquerCount}</Text>
          <Text style={[styles.statLabel, { color: colors.success }]}>Conquer</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '40' }]}>
          <Text style={[styles.statValue, { color: colors.warning }]}>{failCount}</Text>
          <Text style={[styles.statLabel, { color: colors.warning }]}>Not Yet</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{highestGrade || '-'}</Text>
          <Text style={[styles.statLabel, { color: colors.primary }]}>最高</Text>
        </View>
      </View>

      {/* Recent Entries */}
      <View style={styles.entriesSection}>
        <Text style={[styles.entriesTitle, { color: colors.foreground }]}>本次紀錄</Text>
        {activeSession.entries.length === 0 ? (
          <View style={styles.emptyEntries}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              點擊下方按鈕開始記錄
            </Text>
          </View>
        ) : (
          <FlatList
            data={[...activeSession.entries].reverse()}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.entryCard, { backgroundColor: colors.surface }]}>
                {item.mediaUri && (
                  <Image source={{ uri: item.mediaUri }} style={styles.entryPhoto} />
                )}
                <View
                  style={[
                    styles.entryGrade,
                    { backgroundColor: item.result === 'conquer' ? colors.success : colors.warning },
                  ]}
                >
                  <Text style={styles.entryGradeText}>{item.grade}</Text>
                </View>
                <View style={styles.entryInfo}>
                  <Text style={[styles.entryResult, { color: colors.foreground }]}>
                    {item.result === 'conquer' ? 'Conquer' : 'Not Yet'}
                  </Text>
                  <Text style={[styles.entryAttempts, { color: colors.muted }]}>
                    {item.attempts} 次嘗試
                  </Text>
                </View>
                {item.note && (
                  <Text style={[styles.entryNote, { color: colors.muted }]} numberOfLines={1}>
                    {item.note}
                  </Text>
                )}
                {/* Delete Button */}
                <Pressable
                  onPress={() => handleDeleteEntry(item.id)}
                  style={({ pressed }) => [
                    styles.deleteButton,
                    { backgroundColor: colors.error + '20' },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <IconSymbol name="trash" size={18} color={colors.error} />
                </Pressable>
              </View>
            )}
            contentContainerStyle={styles.entriesList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Bottom Actions - with safe area padding to avoid tab bar overlap */}
      <View style={[styles.bottomActions, { 
        backgroundColor: colors.background,
        paddingBottom: Math.max(insets.bottom + 60, 70), // Safe area + tab bar height + extra breathing room
      }]}>
        <Pressable
          onPress={handleEndSession}
          style={({ pressed }) => [
            styles.endButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={[styles.endButtonText, { color: colors.foreground }]}>結束 Session</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            setShowAddEntry(true);
          }}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: colors.primary },
            pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
          ]}
        >
          <IconSymbol name="plus" size={28} color="#FFFFFF" />
          <Text style={styles.addButtonText}>記一條</Text>
        </Pressable>
      </View>

      <AddEntryModal
        visible={showAddEntry}
        onClose={() => setShowAddEntry(false)}
        onSave={handleAddEntry}
      />
    </ScreenContainer>
  );
}

export default function RecordScreen() {
  const isLoaded = useStoreLoaded();
  const activeSession = useActiveSession();

  if (!isLoaded) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text>載入中...</Text>
      </ScreenContainer>
    );
  }

  if (activeSession) {
    return <SessionRunningScreen />;
  }

  return <QuickStartScreen />;
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  quickStartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  quickStartIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStartInfo: {
    flex: 1,
  },
  quickStartName: {
    fontSize: 15,
    fontWeight: '600',
  },
  quickStartLocation: {
    fontSize: 13,
    marginTop: 2,
  },
  // Session Running styles - Sports Tech Style
  sessionHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
    gap: 12,
  },
  gymBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  gymBadgeText: {
    fontSize: 15,
    fontWeight: '700',
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timerValue: {
    fontSize: 56,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 36,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  entriesSection: {
    flex: 1,
    paddingTop: 20,
  },
  entriesTitle: {
    fontSize: 17,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  emptyEntries: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
  entriesList: {
    paddingHorizontal: 16,
    paddingBottom: 120,
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
    maxWidth: 100,
  },
  entryPhoto: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    // paddingBottom handled dynamically with safe area insets
    gap: 12,
  },
  endButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  endButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  addButtonText: {
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
    height: '90%',
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
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 10,
  },
  gradeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  gradeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  gradeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  resultRow: {
    flexDirection: 'row',
    gap: 12,
  },
  resultButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  resultText: {
    fontSize: 15,
    fontWeight: '600',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  stepperValue: {
    fontSize: 32,
    fontWeight: '700',
    minWidth: 48,
    textAlign: 'center',
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  // Photo styles
  photoButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  photoButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  photoPreviewContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  photoPreview: {
    width: 120,
    height: 90,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
