import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Colors } from '../res';

const WAVE_HALF_PERIOD = 18;
const ROW_SPACING = 36;
const AMPLITUDE = 12;

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

/** A subtle, touch-transparent zig-zag motif shared by standard app screens. */
const AppBackgroundPattern = () => {
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

export default AppBackgroundPattern;

const Styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.07,
  },
});
