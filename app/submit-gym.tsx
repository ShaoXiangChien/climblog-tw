/**
 * Submit Gym Screen
 * Allows users to submit new climbing gyms to the database
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
import { fastApiClient, GymSubmission } from '@/lib/fastapi-client';
import { useAuth } from '@/hooks/use-auth';
import Constants from 'expo-constants';

type GymType = 'bouldering' | 'lead' | 'mixed';

export default function SubmitGymScreen() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    district: '',
    address: '',
    lat: '',
    lng: '',
    type: 'bouldering' as GymType,
    priceFrom: '',
    hoursText: '',
    phone: '',
    website: '',
    description: '',
    tags: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('錯誤', '請輸入場館名稱');
      return;
    }
    if (!formData.city.trim()) {
      Alert.alert('錯誤', '請輸入城市');
      return;
    }
    if (!formData.address.trim()) {
      Alert.alert('錯誤', '請輸入地址');
      return;
    }

    if (!user?.id) {
      Alert.alert('錯誤', '請先登入');
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse tags
      const tags = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Prepare submission
      const submission: GymSubmission = {
        user_id: user.id,
        name: formData.name.trim(),
        city: formData.city.trim(),
        district: formData.district.trim() || undefined,
        address: formData.address.trim(),
        lat: formData.lat.trim() || undefined,
        lng: formData.lng.trim() || undefined,
        type: formData.type,
        price_from: formData.priceFrom ? parseInt(formData.priceFrom) : undefined,
        hours_text: formData.hoursText.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        website: formData.website.trim() || undefined,
        description: formData.description.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      };

      // Submit to backend
      await fastApiClient.submitGym(submission);

      Alert.alert(
        '提交成功！',
        '感謝你的貢獻！我們會盡快審核你提交的場館資訊。',
        [
          {
            text: '確定',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to submit gym:', error);
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
        <Text className="text-lg font-semibold">新增場館</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* Info Banner */}
        <View className="bg-blue-50 p-4 rounded-lg mb-6">
          <Text className="text-sm text-blue-800">
            感謝你願意分享新的攀岩場館！你提交的資訊將會經過審核後加入資料庫。
          </Text>
        </View>

        {/* Basic Information */}
        <Text className="text-base font-semibold mb-3">基本資訊</Text>

        <View className="mb-4">
          <Text className="text-sm text-gray-700 mb-2">場館名稱 *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="例：原岩攀岩館"
            value={formData.name}
            onChangeText={(text) => updateField('name', text)}
          />
        </View>

        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Text className="text-sm text-gray-700 mb-2">城市 *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              placeholder="台北"
              value={formData.city}
              onChangeText={(text) => updateField('city', text)}
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm text-gray-700 mb-2">區域</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              placeholder="內湖區"
              value={formData.district}
              onChangeText={(text) => updateField('district', text)}
            />
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-sm text-gray-700 mb-2">地址 *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="完整地址"
            value={formData.address}
            onChangeText={(text) => updateField('address', text)}
            multiline
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm text-gray-700 mb-2">場館類型</Text>
          <View className="flex-row gap-2">
            {(['bouldering', 'lead', 'mixed'] as GymType[]).map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => updateField('type', type)}
                className={`flex-1 py-3 rounded-lg border ${
                  formData.type === type
                    ? 'bg-blue-500 border-blue-500'
                    : 'bg-white border-gray-300'
                }`}
              >
                <Text
                  className={`text-center text-sm ${
                    formData.type === type ? 'text-white font-semibold' : 'text-gray-700'
                  }`}
                >
                  {type === 'bouldering' ? '抱石' : type === 'lead' ? '上攀' : '混合'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Additional Information */}
        <Text className="text-base font-semibold mb-3 mt-6">其他資訊</Text>

        <View className="mb-4">
          <Text className="text-sm text-gray-700 mb-2">起始價格（元）</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="350"
            value={formData.priceFrom}
            onChangeText={(text) => updateField('priceFrom', text)}
            keyboardType="numeric"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm text-gray-700 mb-2">營業時間</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="週一至週五 12:00-22:00"
            value={formData.hoursText}
            onChangeText={(text) => updateField('hoursText', text)}
            multiline
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm text-gray-700 mb-2">電話</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="02-1234-5678"
            value={formData.phone}
            onChangeText={(text) => updateField('phone', text)}
            keyboardType="phone-pad"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm text-gray-700 mb-2">網站</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="https://example.com"
            value={formData.website}
            onChangeText={(text) => updateField('website', text)}
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm text-gray-700 mb-2">標籤（用逗號分隔）</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="新手友善, 寬敞, 課程豐富"
            value={formData.tags}
            onChangeText={(text) => updateField('tags', text)}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm text-gray-700 mb-2">場館描述</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            placeholder="介紹這個場館的特色..."
            value={formData.description}
            onChangeText={(text) => updateField('description', text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* GPS Coordinates (Optional) */}
        <Text className="text-base font-semibold mb-3 mt-6">GPS 座標（選填）</Text>

        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Text className="text-sm text-gray-700 mb-2">緯度</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              placeholder="25.0654"
              value={formData.lat}
              onChangeText={(text) => updateField('lat', text)}
              keyboardType="decimal-pad"
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm text-gray-700 mb-2">經度</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              placeholder="121.5789"
              value={formData.lng}
              onChangeText={(text) => updateField('lng', text)}
              keyboardType="decimal-pad"
            />
          </View>
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
            <Text className="text-white text-center text-base font-semibold">提交場館資訊</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
