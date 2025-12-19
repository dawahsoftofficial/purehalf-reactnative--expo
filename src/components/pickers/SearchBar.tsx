import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View } from 'react-native';

import { hp, Typography, wp } from '../../global';
import { CheckRtl } from '../../languages';
import { Colors, Fonts } from '../../res';
import { Button } from '../buttons';

const SearchBar = (props: any) => {
  const RTL = CheckRtl();
  const [searchValue, setSearchValue] = useState('');
  const { t }: any = useTranslation();

  const onChangeText = (text: any) => {
    setSearchValue(text);
    if (props?.onChangeText) {
      props.onChangeText(text);
    }
  };

  const onSearchPress = () => {
    if (props?.onChangeText) {
      props.onChangeText(searchValue);
    }
  };

  return (
    <View style={Styles.searchContainer}>
      <TextInput
        style={{ ...Styles.searchInput, textAlign: RTL ? 'right' : 'left' }}
        placeholder={t('search')}
        placeholderTextColor={Colors.color28}
        value={searchValue}
        onChangeText={onChangeText}
      />
      <Button
        text="search"
        buttonStyle={Styles.searchButton}
        textStyle={Styles.searchButtonText}
        onPress={onSearchPress}
      />
    </View>
  );
};

export default SearchBar;

const Styles = StyleSheet.create({
  searchContainer: {
    paddingTop: hp(2),
    paddingBottom: hp(1),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(3),
  },
  searchInput: {
    width: wp(70),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.5),
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: Colors.color27,
    backgroundColor: Colors.color7,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    color: Colors.color1,
    includeFontPadding: false,
  },
  searchButton: {
    height: hp(5.5),
    width: wp(20),
  },
  searchButtonText: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
  },
});
