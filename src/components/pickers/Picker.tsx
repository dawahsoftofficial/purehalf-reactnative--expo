import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import Ripple from 'react-native-material-ripple';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { hp, Typography, wp } from '../../global';
import { Colors, Fonts } from '../../res';
import Text from '../Text';
import SearchBar from './SearchBar';

type PickerItem = {
  id?: string | number;
  value?: string | number;
};

type PickerProps = {
  visible?: boolean;
  onClose?: () => void;
  onPress?: (item: PickerItem) => void;
  headerTitle?: string;
  loader?: boolean;
  data?: PickerItem[];
};

// A finger is the same size on every phone, so this must not use hp(): hp() is a
// percentage of screen height (src/global/Scalling.tsx), which rendered ~63px on
// a tall device and ~45px on a small one — under the 48px minimum tap target.
// Deliberate deviation from the wp()/hp() convention in CLAUDE.md.
const ROW_MIN_HEIGHT = 48;

// The Modal itself now only fades (see animationType below), so the sheet's
// rise from the bottom edge is animated separately here. 240ms sits in the
// middle of the 220-260ms range used for sheet-style transitions elsewhere.
const SHEET_SLIDE_DURATION_MS = 240;

const displayValue = (value: PickerItem['value']) => {
  if (typeof value !== 'number') return value ?? '';
  if (value === 1) return 'Yes';
  if (value === 0) return 'No';
  return String(value);
};

const Picker = ({
  visible = false,
  onClose = () => undefined,
  onPress = () => undefined,
  headerTitle = '',
  loader = false,
  data = [],
}: PickerProps) => {
  const [query, setQuery] = useState('');

  const filteredData = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return data;

    return data.filter((item) =>
      String(displayValue(item?.value))
        .toLocaleLowerCase()
        .includes(normalizedQuery)
    );
  }, [data, query]);

  return (
    <Modal
      visible={visible}
      // Fades the modal container (and therefore the backdrop) in place.
      // The sheet's own rise from the bottom is handled separately below by
      // the Animatable.View, so it doesn't sweep up together with the dim.
      animationType="fade"
      transparent
      onShow={() => setQuery('')}
      onRequestClose={() => {
        setQuery('');
        onClose();
      }}
    >
      <Pressable
        style={Styles.backdrop}
        // Hidden from screen readers: it's a tap-anywhere-to-dismiss affordance,
        // and as a full-screen element it would otherwise swallow focus ahead of
        // the sheet. The header close button carries the accessible action.
        importantForAccessibility="no"
        accessibilityElementsHidden
        onPress={() => {
          setQuery('');
          onClose();
        }}
      />
      <KeyboardAvoidingView
        style={Styles.sheetAnchor}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        {/* Sized to its content (the sheet), not flex:1, so it sits at the
            bottom of sheetAnchor without covering the empty area above it —
            taps there still fall through sheetAnchor's box-none to the
            backdrop. */}
        <Animatable.View
          animation="slideInUp"
          duration={SHEET_SLIDE_DURATION_MS}
          useNativeDriver
        >
          <SafeAreaView style={Styles.sheet} edges={['bottom']}>
            <View style={Styles.headerCon}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={() => {
                  setQuery('');
                  onClose();
                }}
                style={Styles.closeBtn}
              >
                <Ionicons name="close" color={Colors.ink} size={wp(6)} />
              </TouchableOpacity>
              <Text style={Styles.headerTxt} numberOfLines={2}>
                {headerTitle}
              </Text>
              <View style={Styles.headerSpacer} />
            </View>

            {data.length > 10 ? (
              <SearchBar
                key={visible ? 'picker-search-open' : 'picker-search-closed'}
                onChangeText={setQuery}
                autoFocus={false}
              />
            ) : null}

            <FlatList
              data={filteredData}
              style={Styles.list}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={
                Platform.OS === 'ios' ? 'interactive' : 'on-drag'
              }
              keyExtractor={(item, index) => String(item?.id ?? index)}
              renderItem={({ item }) => (
                <Ripple
                  style={Styles.itemCon}
                  onPress={() => {
                    setQuery('');
                    onPress(item);
                  }}
                >
                  <Text style={Styles.itemLabel}>
                    {displayValue(item?.value)}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    color={Colors.primaryLite}
                    size={wp(4.5)}
                  />
                </Ripple>
              )}
              contentContainerStyle={Styles.listContainer}
              ListEmptyComponent={
                loader ? (
                  <ActivityIndicator
                    color={Colors.primary}
                    size="small"
                    style={Styles.loader}
                  />
                ) : (
                  <Text style={Styles.emptyText}>No matching options</Text>
                )
              }
              ListFooterComponent={
                loader && filteredData.length > 0 ? (
                  <ActivityIndicator
                    color={Colors.primary}
                    size="small"
                    style={Styles.loader}
                  />
                ) : null
              }
            />
          </SafeAreaView>
        </Animatable.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default Picker;

const Styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheetAnchor: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    // Capped, not fixed: the sheet grows with its content and stops at 80%.
    // Measured from the bottom, so its top edge can't be cropped on a small
    // device, and short lists (Age Range, Contact Support) stay short.
    maxHeight: '80%',
    backgroundColor: Colors.appBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    // Clips the white header to the rounded top corners.
    overflow: 'hidden',
  },
  list: {
    // Lets the list shrink inside the capped, content-sized sheet instead of
    // forcing it to full height.
    flexShrink: 1,
  },
  headerCon: {
    minHeight: hp(7),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(3),
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  closeBtn: {
    width: wp(11),
    minHeight: hp(6),
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTxt: {
    flex: 1,
    // Beats the alignSelf that Text injects for RTL, which lands on this row's
    // cross axis (vertical) and would pin the title to the top. See Text.tsx.
    alignSelf: 'center',
    color: Colors.ink,
    textAlign: 'center',
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small3,
    lineHeight: wp(5.5),
  },
  headerSpacer: {
    width: wp(11),
  },
  listContainer: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
    paddingBottom: hp(4),
  },
  itemCon: {
    minHeight: ROW_MIN_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: wp(3),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    marginBottom: hp(0.7),
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.surface,
  },
  itemLabel: {
    flex: 1,
    // Same as headerTxt: overrides Text's injected RTL alignSelf so the label
    // sits beside its chevron instead of above it. Horizontal alignment is
    // still governed by textAlign (default 'auto'), so RTL is unaffected.
    alignSelf: 'center',
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small2,
    lineHeight: wp(5.2),
  },
  loader: {
    marginVertical: hp(4),
  },
  emptyText: {
    // Beats the alignSelf that Text injects for RTL, which lands on this
    // list's cross axis (horizontal, since listContainer is a column) and
    // would shrink-wrap the box to the left edge, making textAlign a no-op.
    alignSelf: 'center',
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    textAlign: 'center',
    marginTop: hp(8),
  },
});
