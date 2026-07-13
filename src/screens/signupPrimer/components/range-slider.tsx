import React, { useEffect, useRef, useState } from 'react';
import {
  PanResponder,
  type PanResponderInstance,
  StyleSheet,
  Text as RNText,
  View,
} from 'react-native';

import { hp, Typography, wp } from '../../../global';
import { Colors, Fonts } from '../../../res';

type Props = {
  min: number; // lower bound of the whole range
  max: number; // upper bound of the whole range
  from: number; // current low thumb value
  to: number; // current high thumb value
  onChange: (range: { min: number; max: number }) => void;
};

const THUMB = wp(6.5);
const RAIL_H = wp(1.6);
const RAIL_TOP = (THUMB - RAIL_H) / 2;

// Dependency-free dual-thumb range slider (PanResponder, so no native module and
// no rebuild needed). Controlled: it renders `from`/`to` and reports new values
// through onChange as it's dragged.
const RangeSlider = ({ min, max, from, to, onChange }: Props) => {
  const [width, setWidth] = useState(0);
  const usable = Math.max(1, width - THUMB); // travel available to a thumb centre
  const span = Math.max(1, max - min);

  // Keep the latest values in a ref so the responders never read stale state,
  // and capture the drag origin on grant.
  const s = useRef({ from, to, usable, span, min, max, onChange });
  useEffect(() => {
    s.current = { from, to, usable, span, min, max, onChange };
  });
  const start = useRef({ from, to });

  // Build the two responders once, after mount (so no ref is touched during
  // render), and hold them in state so the JSX can read them legally.
  const [pans, setPans] = useState<{
    from: PanResponderInstance;
    to: PanResponderInstance;
  } | null>(null);

  useEffect(() => {
    const make = (which: 'from' | 'to') =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          start.current = { from: s.current.from, to: s.current.to };
        },
        onPanResponderMove: (_e, g) => {
          const c = s.current;
          const dv = (g.dx / c.usable) * c.span;
          if (which === 'from') {
            const nv = Math.max(
              c.min,
              Math.min(Math.round(start.current.from + dv), c.to)
            );
            if (nv !== c.from) c.onChange({ min: nv, max: c.to });
          } else {
            const nv = Math.min(
              c.max,
              Math.max(Math.round(start.current.to + dv), c.from)
            );
            if (nv !== c.to) c.onChange({ min: c.from, max: nv });
          }
        },
      });
    setPans({ from: make('from'), to: make('to') });
  }, []);

  const xFrom = ((from - min) / span) * usable;
  const xTo = ((to - min) / span) * usable;
  const hitSlop = { top: hp(2), bottom: hp(2), left: wp(3), right: wp(3) };

  return (
    <View>
      <RNText style={Styles.value}>{`${from} – ${to}`}</RNText>
      <View
        style={Styles.track}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        <View style={Styles.rail} />
        <View
          style={[
            Styles.fill,
            { left: xFrom + THUMB / 2, width: Math.max(0, xTo - xFrom) },
          ]}
        />
        <View
          {...(pans ? pans.from.panHandlers : {})}
          hitSlop={hitSlop}
          style={[Styles.thumb, { left: xFrom }]}
        />
        <View
          {...(pans ? pans.to.panHandlers : {})}
          hitSlop={hitSlop}
          style={[Styles.thumb, { left: xTo }]}
        />
      </View>
      <View style={Styles.endsRow}>
        <RNText style={Styles.endTxt}>{min}</RNText>
        <RNText style={Styles.endTxt}>{max}</RNText>
      </View>
    </View>
  );
};

export default RangeSlider;

const Styles = StyleSheet.create({
  value: {
    textAlign: 'center',
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.large1,
    marginBottom: hp(3),
  },
  track: { height: THUMB, marginHorizontal: wp(1) },
  rail: {
    position: 'absolute',
    left: THUMB / 2,
    right: THUMB / 2,
    top: RAIL_TOP,
    height: RAIL_H,
    borderRadius: 999,
    backgroundColor: Colors.lavender,
  },
  fill: {
    position: 'absolute',
    top: RAIL_TOP,
    height: RAIL_H,
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  thumb: {
    position: 'absolute',
    top: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: Colors.color2,
    borderWidth: 2,
    borderColor: Colors.primary,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  endsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(1.2),
  },
  endTxt: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small,
  },
});
