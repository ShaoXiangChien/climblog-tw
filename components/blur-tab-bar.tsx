import { StyleSheet, Dimensions, View, Platform } from 'react-native';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';

const SCREEN_WIDTH = Dimensions.get('window').width;
// Tab bar width: 90% of screen width for better floating effect
const TAB_BAR_WIDTH_PERCENTAGE = 0.90;

export function BlurTabBar(props: any) {
  // Aggressively override all background styles to transparent
  const modifiedProps = {
    ...props,
    style: [
      props.style,
      { 
        backgroundColor: 'transparent',
        borderTopColor: 'transparent',
      }
    ]
  };

  // Use BlurView on iOS, solid translucent background on Android for consistency
  const TabBarWrapper = Platform.OS === 'ios' ? (
    <BlurView
      intensity={80}
      tint="dark"
      style={styles.blurContainer}
    >
      <View style={styles.overlayIOS} />
      <BottomTabBar {...modifiedProps} />
    </BlurView>
  ) : (
    <View style={styles.androidContainer}>
      <BottomTabBar {...modifiedProps} />
    </View>
  );

  return (
    <View style={styles.container}>
      {TabBarWrapper}
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
    // Enhanced shadow for floating effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
    // Force dark background for Android
    backgroundColor: Platform.OS === 'android' ? 'rgba(26, 26, 27, 0.95)' : 'transparent',
  },
  blurContainer: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  overlayIOS: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 18, 20, 0.75)', // Semi-transparent dark overlay for iOS
    borderRadius: 28,
  },
  androidContainer: {
    borderRadius: 28,
    backgroundColor: 'transparent', // Let container handle the background
    overflow: 'hidden',
  },
});
