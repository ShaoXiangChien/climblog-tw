import { StyleSheet, Dimensions, View, Platform, Pressable, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TAB_BAR_WIDTH_PERCENTAGE = 0.90;

export function BlurTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  // Check if tab bar should be hidden
  const shouldHide = descriptors[state.routes[state.index].key]?.options?.tabBarStyle?.display === 'none';
  
  if (shouldHide) {
    return null;
  }

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
          <View style={styles.overlay} />
          <TabBarContent state={state} descriptors={descriptors} navigation={navigation} />
        </BlurView>
      ) : (
        <View style={styles.androidContainer}>
          <TabBarContent state={state} descriptors={descriptors} navigation={navigation} />
        </View>
      )}
    </View>
  );
}

function TabBarContent({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.tabBarContent}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined
          ? options.tabBarLabel
          : options.title !== undefined
          ? options.title
          : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }

          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const color = isFocused
          ? (options.tabBarActiveTintColor || '#FF6B35')
          : (options.tabBarInactiveTintColor || '#8E8E93');

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={({ pressed }) => [
              styles.tabButton,
              pressed && styles.tabButtonPressed,
            ]}
          >
            {options.tabBarIcon && options.tabBarIcon({ 
              focused: isFocused, 
              color, 
              size: 24 
            })}
            <Text style={[styles.tabLabel, { color }]}>
              {typeof label === 'string' ? label : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 12,
    left: (SCREEN_WIDTH * (1 - TAB_BAR_WIDTH_PERCENTAGE)) / 2,
    right: (SCREEN_WIDTH * (1 - TAB_BAR_WIDTH_PERCENTAGE)) / 2,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  blurContainer: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 18, 20, 0.75)',
    borderRadius: 28,
  },
  androidContainer: {
    borderRadius: 28,
    backgroundColor: 'rgba(26, 26, 27, 0.95)',
    overflow: 'hidden',
  },
  tabBarContent: {
    flexDirection: 'row',
    paddingTop: 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 6,
    paddingHorizontal: 2,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  tabButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
