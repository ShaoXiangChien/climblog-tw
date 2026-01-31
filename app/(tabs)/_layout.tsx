import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { BlurTabBar } from "@/components/blur-tab-bar";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  // 減少底部 padding，更緊湊
  const bottomPadding = Platform.OS === "ios" ? Math.max(insets.bottom - 8, 4) : 4;
  const tabBarHeight = 56 + bottomPadding; // 減少高度

  return (
    <Tabs
      tabBar={(props) => <BlurTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: 'absolute',
          paddingTop: 6,  // 減少上方 padding
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,  // 圖標和文字更接近
        },
        tabBarIconStyle: {
          marginBottom: 0,  // 移除負 margin
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "探索",
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="magnifyingglass" color={color} />,
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: "記錄",
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="plus.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "歷史",
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="clock.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "我",
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
