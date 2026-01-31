import { StyleSheet, Dimensions, View } from 'react-native';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;
// Tab bar width: 85% of screen width (more compact like PickleTown)
const TAB_BAR_WIDTH_PERCENTAGE = 0.85;

export function BlurTabBar(props: any) {
  // 覆蓋背景色
  const modifiedProps = {
    ...props,
    style: [
      props.style,
      { backgroundColor: 'transparent' }
    ]
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1b', '#12121400']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <BottomTabBar {...modifiedProps} />
      </LinearGradient>
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
    backgroundColor: '#1a1a1b',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  gradient: {
    borderRadius: 24,
  },
});
