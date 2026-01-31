import { BlurView } from 'expo-blur';
import { StyleSheet, Dimensions, View } from 'react-native';
import { BottomTabBar } from '@react-navigation/bottom-tabs';

const SCREEN_WIDTH = Dimensions.get('window').width;
// Tab bar width: 85% of screen width (more compact like PickleTown)
const TAB_BAR_WIDTH_PERCENTAGE = 0.85;

export function BlurTabBar(props: any) {
  return (
    <View style={styles.container}>
      <BlurView
        intensity={100}
        tint="dark"
        style={styles.blurContainer}
      >
        <View style={styles.darkOverlay} />
        <BottomTabBar {...props} />
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 8,
    left: (SCREEN_WIDTH * (1 - TAB_BAR_WIDTH_PERCENTAGE)) / 2,
    right: (SCREEN_WIDTH * (1 - TAB_BAR_WIDTH_PERCENTAGE)) / 2,
    borderRadius: 24,
    overflow: 'hidden',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    // Elevation for Android
    elevation: 8,
  },
  blurContainer: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});
