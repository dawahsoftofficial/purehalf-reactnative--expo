import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View as RNView } from 'react-native';
import { View } from 'react-native-animatable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { isIOS } from '@/services';

import { Button, Container, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
import { usePremiumStore } from '../../stores';
import RefineSearch from './RefineSearch';
import SavedSearches from './SavedSearches';

const SearchProfiles = () => {
  const { bottom } = useSafeAreaInsets();
  const refineSearchRef = useRef<{
    onSaveAndSearchPress: () => void;
    onSearchPress: () => void;
    hasFiltersSelected: () => boolean;
  }>(null);
  const { isPremium } = usePremiumStore();
  const premium = isPremium();

  const [hasFilters, setHasFilters] = useState(false);

  useEffect(() => {
    const checkFilters = () => {
      if (refineSearchRef.current) {
        const hasSelected = refineSearchRef.current.hasFiltersSelected();
        setHasFilters(hasSelected);
      }
    };

    const interval = setInterval(checkFilters, 200);
    checkFilters();

    return () => clearInterval(interval);
  }, []);

  const handleSaveAndSearch = () => {
    refineSearchRef.current?.onSaveAndSearchPress();
  };

  const handleSearch = () => {
    refineSearchRef.current?.onSearchPress();
  };

  return (
    <Container style={Styles.container}>
      <RNView style={Styles.contentWrapper}>
        <ScrollView
          contentContainerStyle={Styles.innerContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
          style={Styles.scrollView}
        >
          <View style={Styles.headerCon}>
            <Text style={Styles.headerTitle}>
              {LanguageKeys.searchProfiles}
            </Text>
          </View>
          <Text style={Styles.heading}>{LanguageKeys.savedSearches}</Text>
          <SavedSearches />
          <RefineSearch ref={refineSearchRef} premium={premium} />
        </ScrollView>
      </RNView>
      <RNView
        style={[Styles.buttonsContainer, isIOS && { marginBottom: -bottom }]}
      >
        <Button
          text={LanguageKeys.saveAndSearch}
          icon={<Feather name="search" color={Colors.color2} size={wp(5)} />}
          buttonStyle={Styles.saveSearchBtn}
          onPress={handleSaveAndSearch}
          disabled={!hasFilters}
        />
        <Button
          text={LanguageKeys.search}
          icon={<Feather name="search" color={Colors.color2} size={wp(5)} />}
          buttonStyle={[Styles.searchBtn]}
          onPress={handleSearch}
        />
      </RNView>
    </Container>
  );
};

export default SearchProfiles;

const Styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.color7,
    paddingTop: 0,
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  innerContainer: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(20),
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: Colors.color7,
    paddingTop: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: Colors.color27,
    zIndex: 10,
    shadowColor: Colors.color1,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  saveSearchBtn: {
    marginHorizontal: wp(4),
    marginBottom: hp(1.5),
    backgroundColor: Colors.color37,
  },
  searchBtn: {
    backgroundColor: Colors.color1,
    marginHorizontal: wp(4),
    marginBottom: hp(1.5),
  },
  heading: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small2,
    includeFontPadding: false,
    marginTop: hp(4),
  },
  headerCon: {
    paddingBottom: hp(0.5),
    paddingHorizontal: wp(4),
    width: wp(100),
    marginLeft: wp(-4),
    backgroundColor: Colors.color2,
  },
  headerTitle: {
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_B,
    color: Colors.color1,
    includeFontPadding: false,
    marginTop: hp(1),
  },
});
