import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { hp, Typography, wp } from '../../global';
import { CheckRtl } from '../../languages';
import { Colors, Fonts } from '../../res';

type SearchBarProps = {
  onChangeText?: (text: string) => void;
  autoFocus?: boolean;
};

const SearchBar = ({ onChangeText, autoFocus = false }: SearchBarProps) => {
  const RTL = CheckRtl();
  const [searchValue, setSearchValue] = useState('');
  const { t } = useTranslation();

  const updateSearch = (text: string) => {
    setSearchValue(text);
    onChangeText?.(text);
  };

  return (
    <View style={Styles.outerContainer}>
      <View style={Styles.searchContainer}>
        <Ionicons name="search" size={wp(5)} color={Colors.muted} />
        <TextInput
          autoFocus={autoFocus}
          style={[Styles.searchInput, { textAlign: RTL ? 'right' : 'left' }]}
          placeholder={t('search')}
          placeholderTextColor={Colors.muted}
          value={searchValue}
          onChangeText={updateSearch}
          returnKeyType="search"
        />
        {searchValue.length > 0 ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => updateSearch('')}
            style={Styles.clearButton}
          >
            <Ionicons name="close-circle" size={wp(5)} color={Colors.muted} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

export default SearchBar;

const Styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(1),
    backgroundColor: Colors.appBg,
  },
  searchContainer: {
    minHeight: hp(6.5),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2.5),
    paddingHorizontal: wp(4),
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.surface,
  },
  searchInput: {
    flex: 1,
    paddingVertical: hp(1.2),
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    color: Colors.ink,
    includeFontPadding: false,
  },
  clearButton: {
    minWidth: wp(8),
    minHeight: hp(5),
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
