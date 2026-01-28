// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "magnifyingglass": "search",
  "map.fill": "map",
  "list.bullet": "format-list-bulleted",
  "plus": "add",
  "plus.circle.fill": "add-circle",
  "clock.fill": "schedule",
  "person.fill": "person",
  "gearshape.fill": "settings",
  "xmark": "close",
  "checkmark": "check",
  "camera.fill": "photo-camera",
  "photo.fill": "photo",
  "square.and.arrow.up": "share",
  "arrow.down.to.line": "download",
  "location.fill": "location-on",
  "clock": "access-time",
  "flame.fill": "local-fire-department",
  "figure.climbing": "fitness-center",
  "trophy.fill": "emoji-events",
  "chart.bar.fill": "bar-chart",
  "arrow.left": "arrow-back",
  "minus": "remove",
  "heart.fill": "favorite",
  "heart": "favorite-border",
  "xmark.circle.fill": "cancel",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
