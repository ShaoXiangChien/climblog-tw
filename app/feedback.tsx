/**
 * Feedback Screen
 * Allows users to submit feedback, bug reports, and feature requests
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fastApiClient, FeedbackSubmission } from '@/lib/fastapi-client';
import { useAuth } from '@/hooks/use-auth';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

type FeedbackCategory = 'bug' | 'feature_request' | 'improvement' | 'other';

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: '🐛 回報錯誤',
  feature_request: '✨ 功能建議',
  improvement: '📈 改進建議',
  other: '💬 其他',
};

export default function FeedbackScreen() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [category, setCategory] = useState<FeedbackCategory>('feature_request');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async () => {
    // Validation
    if (!subject.trim()) {
      Alert.alert('錯誤', '請輸入主旨');
      return;
    }
    if (!message.trim()) {
      Alert.alert('錯誤', '請輸入詳細內容');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get device info
      const deviceInfo = JSON.stringify({
        platform: Platform.OS,
        version: Platform.Version,
        deviceName: Device.deviceName,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
      });

      // Prepare submission
      const submission: FeedbackSubmission = {
        user_id: user?.id,
        email: email.trim() || undefined,
        category,
        subject: subject.trim(),
        message: message.trim(),
        app_version: Constants.expoConfig?.version || '1.0.0',
        device_info: deviceInfo,
      };

      // Submit to backend
      await fastApiClient.submitFeedback(submission);

      Alert.alert(
        '提交成功！',
        '感謝你的回饋！我們會仔細閱讀並盡快處理。',
        [
          {
            text: '確定',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      Alert.alert('提交失敗', error instanceof Error ? error.message : '請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold">意見回饋</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* Info Banner */}
        <View className="bg-green-50 p-4 rounded-lg mb-6">
          <Text className="text-sm text-green-800">
            你的意見對我們非常重要！無論是錯誤回報、功能建議或任何想法，都歡迎告訴我們。
          </Text>
        </View>

        {/* Category Selection */}
        <Text className="text-base font-semibold mb-3">回饋類型</Text>
        <View className="gap-2 mb-6">
          {(Object.keys(CATEGORY_LABELS) as FeedbackCategory[]).map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              className={`py-4 px-4 rounded-lg border ${
                category === cat
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-white border-gray-300'
              }`}
            >
              <Text
                className={`text-base ${
                  category === cat ? 'text-white font-semibold' : 'text-gray-700'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Subject */}
        <View className="mb-4">
          <Text className="text-sm text-gray-700 mb-2">主旨 *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="簡短描述你的回饋"
            value={subject}
            onChangeText={setSubject}
          />
        </View>

        {/* Message */}
        <View className="mb-4">
          <Text className="text-sm text-gray-700 mb-2">詳細內容 *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder={
              category === 'bug'
                ? '請描述遇到的問題、重現步驟等...'
                : category === 'feature_request'
                ? '請描述你希望新增的功能...'
                : '請詳細說明你的想法...'
            }
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
        </View>

        {/* Email (Optional) */}
        <View className="mb-4">
          <Text className="text-sm text-gray-700 mb-2">聯絡信箱（選填）</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="如果需要回覆，請留下信箱"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Info Text */}
        <View className="bg-gray-50 p-4 rounded-lg mb-6">
          <Text className="text-xs text-gray-600">
            我們會自動收集你的裝置資訊（系統版本、裝置型號等）以協助問題診斷。
            {user?.id ? ' 你的帳號資訊也會一併記錄。' : ' 你可以選擇匿名提交。'}
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          className={`py-4 rounded-lg mb-8 ${
            isSubmitting ? 'bg-gray-400' : 'bg-blue-500'
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-center text-base font-semibold">提交回饋</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
