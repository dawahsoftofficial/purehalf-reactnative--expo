import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
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
      animationType="slide"
      presentationStyle="fullScreen"
      onShow={() => setQuery('')}
      onRequestClose={() => {
        setQuery('');
        onClose();
      }}
    >
      <SafeAreaView style={Styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar backgroundColor={Colors.surface} barStyle="dark-content" />
        <KeyboardAvoidingView
          style={Styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
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
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

export default Picker;

const Styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  keyboardAvoidingView: {
    flex: 1,
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
    minHeight: hp(7),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: wp(3),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.3),
    marginBottom: hp(1),
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.surface,
  },
  itemLabel: {
    flex: 1,
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small2,
    lineHeight: wp(5.2),
  },
  loader: {
    marginVertical: hp(4),
  },
  emptyText: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    textAlign: 'center',
    marginTop: hp(8),
  },
});
