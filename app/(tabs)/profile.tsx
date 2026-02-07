import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform, Alert, Modal, TextInput, Image, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useSessions, useSettings, useStoreLoaded, useStoreActions } from '@/hooks/use-store';
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

// Edit Profile Modal
function EditProfileModal({
  visible,
  onClose,
  currentName,
  currentAvatarUri,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  currentName: string | null;
  currentAvatarUri: string | null;
  onSave: (name: string, avatarUri: string | null) => void;
}) {
  const colors = useColors();
  const [name, setName] = useState(currentName || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(currentAvatarUri);

  const pickImage = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
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
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const removeAvatar = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setAvatarUri(null);
  };

  const handleSave = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onSave(name.trim() || '攀岩者', avatarUri);
    onClose();
  };

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Reset to current values
    setName(currentName || '');
    setAvatarUri(currentAvatarUri);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>編輯個人資料</Text>
                <Pressable onPress={handleClose}>
                  <IconSymbol name="xmark" size={24} color={colors.muted} />
                </Pressable>
              </View>

              {/* Avatar Section */}
              <View style={styles.editSection}>
                <Text style={[styles.editLabel, { color: colors.muted }]}>頭像</Text>
                <View style={styles.avatarEditContainer}>
                  {avatarUri ? (
                    <View style={styles.avatarPreviewContainer}>
                      <Image source={{ uri: avatarUri }} style={styles.avatarPreview} />
                      <Pressable
                        onPress={removeAvatar}
                        style={({ pressed }) => [
                          styles.removeAvatarButton,
                          { backgroundColor: colors.error },
                          pressed && { opacity: 0.8 },
                        ]}
                      >
                        <IconSymbol name="xmark" size={16} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                      <IconSymbol name="person.fill" size={40} color="#FFFFFF" />
                    </View>
                  )}
                  <View style={styles.avatarButtons}>
                    <Pressable
                      onPress={takePhoto}
                      style={({ pressed }) => [
                        styles.avatarButton,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <IconSymbol name="camera.fill" size={20} color={colors.primary} />
                      <Text style={[styles.avatarButtonText, { color: colors.foreground }]}>拍照</Text>
                    </Pressable>
                    <Pressable
                      onPress={pickImage}
                      style={({ pressed }) => [
                        styles.avatarButton,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <IconSymbol name="photo.fill" size={20} color={colors.primary} />
                      <Text style={[styles.avatarButtonText, { color: colors.foreground }]}>相簿</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Name Input */}
              <View style={styles.editSection}>
                <Text style={[styles.editLabel, { color: colors.muted }]}>名稱</Text>
                <TextInput
                  style={[
                    styles.nameInput,
                    { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground },
                  ]}
                  placeholder="輸入你的名字"
                  placeholderTextColor={colors.muted}
                  value={name}
                  onChangeText={setName}
                  maxLength={30}
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
                <Text style={[styles.charCount, { color: colors.muted }]}>{name.length}/30</Text>
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
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const isLoaded = useStoreLoaded();
  const sessions = useSessions();
  const settings = useSettings();
  const { updateSettings } = useStoreActions();
  const [showEditProfile, setShowEditProfile] = useState(false);

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
      'Rockr (岩究生)',
      '版本 1.0.0\n\n台灣攀岩 Logbook\n快速找館、記錄攀爬、分享成果',
      [{ text: '確定' }]
    );
  };

  const handleSaveProfile = async (name: string, avatarUri: string | null) => {
    await updateSettings({
      userName: name,
      avatarUri: avatarUri,
    });
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
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setShowEditProfile(true);
            }}
            style={styles.avatarContainer}
          >
            {settings.avatarUri ? (
              <Image source={{ uri: settings.avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <IconSymbol name="person.fill" size={40} color="#FFFFFF" />
              </View>
            )}
            <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
              <IconSymbol name="pencil" size={12} color="#FFFFFF" />
            </View>
          </Pressable>
          <Text style={[styles.greeting, { color: colors.foreground }]}>
            {settings.userName || '攀岩者'}
          </Text>
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
              title="關於 Rockr"
              onPress={handleAbout}
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.muted }]}>
            Rockr v1.0.0
          </Text>
          <Text style={[styles.footerText, { color: colors.muted }]}>
            Made with ❤️ for climbers in Taiwan
          </Text>
        </View>
      </ScrollView>

      <EditProfileModal
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        currentName={settings.userName}
        currentAvatarUri={settings.avatarUri}
        onSave={handleSaveProfile}
      />
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
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
  },
  editBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  editSection: {
    marginBottom: 24,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  avatarEditContainer: {
    alignItems: 'center',
    gap: 16,
  },
  avatarPreviewContainer: {
    position: 'relative',
  },
  avatarPreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeAvatarButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatarButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
