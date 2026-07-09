import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Colors } from '../../../res';

const WAVE_HALF_PERIOD = 18;
const ROW_SPACING = 36;
const AMPLITUDE = 12;

/**
 * One horizontal wave line at baseline `y`, spanning `startX`..`endX`.
 * A leading quadratic curve establishes the crest; smooth continuations (T)
 * alternate crest/trough every half period.
 */
const waveRow = (startX: number, y: number, endX: number): string => {
  let d =
    `M${startX} ${y} ` +
    `Q${startX + WAVE_HALF_PERIOD / 2} ${y - AMPLITUDE} ` +
    `${startX + WAVE_HALF_PERIOD} ${y}`;
  for (
    let x = startX + WAVE_HALF_PERIOD * 2;
    x <= endX;
    x += WAVE_HALF_PERIOD
  ) {
    d += ` T${x} ${y}`;
  }
  return d;
};

/**
 * Subtle flowing-waves motif rendered behind chat content so a new or
 * sparse screen never reads as an empty void. Alternate rows are offset by
 * half a period so the crests interleave. All rows are concatenated into a
 * single path (instead of an SVG <Pattern>, which renders inconsistently in
 * react-native-svg on Android). Purely decorative: absolutely positioned
 * and transparent to touches.
 */
const ChatBackgroundPattern = () => {
  const { width, height } = useWindowDimensions();

  const tiledPath = useMemo(() => {
    const rows: string[] = [];
    let rowIndex = 0;
    for (let y = ROW_SPACING / 2; y < height + ROW_SPACING; y += ROW_SPACING) {
      const startX =
        rowIndex % 2 === 0 ? -WAVE_HALF_PERIOD : -WAVE_HALF_PERIOD * 2;
      rows.push(waveRow(startX, y, width + WAVE_HALF_PERIOD * 2));
      rowIndex += 1;
    }
    return rows.join(' ');
  }, [width, height]);

  return (
    <View
      style={Styles.fill}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width="100%" height="100%">
        <Path
          d={tiledPath}
          fill="none"
          stroke={Colors.primary}
          strokeWidth={1.4}
        />
      </Svg>
    </View>
  );
};

const Styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.07,
  },
});

export default ChatBackgroundPattern;
