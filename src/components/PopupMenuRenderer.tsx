import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import {
  Animated,
  Easing,
  I18nManager,
  PixelRatio,
  StyleSheet,
} from 'react-native';
import { renderers } from 'react-native-popup-menu';

const OPEN_DURATION = 160;
const CLOSE_DURATION = 100;

type Layout = { x: number; y: number; width: number; height: number };

type MenuLayouts = {
  windowLayout: Layout;
  triggerLayout: Layout;
  optionsLayout: { width: number; height: number };
  safeAreaLayout?: Layout;
};

type PopupMenuRendererProps = {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  layouts: MenuLayouts;
};

// Reuse the default renderer's trigger-anchored positioning (RTL-aware);
// only the open/close animation is replaced. The library ships untyped JS,
// so the static isn't visible to TypeScript.
const { computePosition } = renderers.ContextMenu as unknown as {
  computePosition: (layouts: MenuLayouts, isRTL: boolean) => ViewStyle;
};

/**
 * Modern replacement for react-native-popup-menu's default ContextMenu
 * renderer, whose scale-from-zero zoom animation looks dated. Opens with a
 * quick fade plus a subtle scale/drop-in, closes with a fast fade out.
 * Usage: <Menu renderer={PopupMenuRenderer}>
 */
class PopupMenuRenderer extends React.Component<PopupMenuRendererProps> {
  static computePosition = computePosition;

  private anim = new Animated.Value(0);

  componentDidMount() {
    Animated.timing(this.anim, {
      toValue: 1,
      duration: OPEN_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }

  close = () =>
    new Promise<void>((resolve) => {
      Animated.timing(this.anim, {
        toValue: 0,
        duration: CLOSE_DURATION,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(() => resolve());
    });

  render() {
    const { style, children, layouts, ...other } = this.props;
    const position = computePosition(layouts, I18nManager.isRTL);
    const animation = {
      opacity: this.anim,
      transform: [
        {
          scale: this.anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.95, 1],
          }),
        },
        {
          translateY: this.anim.interpolate({
            inputRange: [0, 1],
            outputRange: [-6, 0],
          }),
        },
      ],
    };
    return (
      <Animated.View
        {...other}
        style={[Styles.options, style, animation, position]}
      >
        {children}
      </Animated.View>
    );
  }
}

export default PopupMenuRenderer;

// Same base container styles as the library's default renderer, so screens
// that override them via optionsContainerStyle render identically.
const Styles = StyleSheet.create({
  options: {
    position: 'absolute',
    borderRadius: 2,
    backgroundColor: 'white',
    width: PixelRatio.roundToNearestPixel(200),
    shadowColor: 'black',
    shadowOpacity: 0.3,
    shadowOffset: { width: 3, height: 3 },
    shadowRadius: 4,
    elevation: 5,
  },
});
