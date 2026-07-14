import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View as RNView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Button, Container, Header } from '../../components';
import { hp, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors } from '../../res';
import { useGlobalContext } from '../../services';
import { usePremiumStore } from '../../stores';
import RefineSearch from './RefineSearch';
import SavedSearches from './SavedSearches';

const SearchProfiles = ({
  navigation,
}: {
  navigation: { goBack: () => void };
}) => {
  const { bottom } = useSafeAreaInsets();
  const refineSearchRef = useRef<{
    onSaveAndSearchPress: () => void;
    onSearchPress: () => void;
    hasFiltersSelected: () => boolean;
  }>(null);
  const { isPremium } = usePremiumStore();
  const { currentUser } = useGlobalContext();
  const premium = isPremium();
  const isTester =
    currentUser?.tester_mode_enabled === true &&
    currentUser?.is_tester === true;

  const [hasFilters, setHasFilters] = useState(false);
  const [nameQuery, setNameQuery] = useState('');

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
      <Header
        navigation={navigation}
        title={LanguageKeys.searchProfiles}
        titleVariant="display"
      />
      <RNView style={Styles.contentWrapper}>
        <ScrollView
          contentContainerStyle={Styles.innerContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
          style={Styles.scrollView}
        >
          {isTester && (
            <RNView style={Styles.nameSearchCard}>
              <Text style={Styles.nameSearchLabel}>Find a member by name</Text>
              <Text style={Styles.nameSearchHelp}>
                Tester-only search across first name, last name, or full name.
              </Text>
              <RNView style={Styles.nameInputWrap}>
                <Ionicons
                  name="search-outline"
                  color={Colors.primary}
                  size={wp(5)}
                />
                <TextInput
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={80}
                  onChangeText={setNameQuery}
                  onSubmitEditing={handleSearch}
                  placeholder="Enter at least 2 characters"
                  placeholderTextColor={Colors.muted}
                  returnKeyType="search"
                  style={Styles.nameInput}
                  value={nameQuery}
                />
                {nameQuery.length > 0 && (
                  <Ionicons
                    name="close-circle"
                    color={Colors.muted}
                    onPress={() => setNameQuery('')}
                    size={wp(5)}
                  />
                )}
              </RNView>
            </RNView>
          )}
          <SavedSearches />
          <RefineSearch
            ref={refineSearchRef}
            nameQuery={isTester ? nameQuery : ''}
            premium={premium}
          />
        </ScrollView>
      </RNView>
      <RNView style={[Styles.buttonsContainer, { marginBottom: -bottom }]}>
        {hasFilters && (
          <Button
            variant="outline"
            text={LanguageKeys.saveAndSearch}
            icon={
              <Ionicons
                name="bookmark-outline"
                color={Colors.primary}
                size={wp(5)}
              />
            }
            buttonStyle={Styles.saveSearchBtn}
            onPress={handleSaveAndSearch}
          />
        )}
        <Button
          text={LanguageKeys.search}
          icon={<Ionicons name="search" color={Colors.color2} size={wp(5)} />}
          buttonStyle={Styles.searchBtn}
          onPress={handleSearch}
        />
      </RNView>
    </Container>
  );
};

export default SearchProfiles;

const Styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.appBg,
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
    paddingBottom: hp(22),
  },
  nameSearchCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.primaryLite,
    borderWidth: 1,
    borderRadius: 14,
    marginTop: hp(1.5),
    marginBottom: hp(1.5),
    padding: wp(4),
  },
  nameSearchLabel: {
    color: Colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  nameSearchHelp: {
    color: Colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: hp(0.5),
  },
  nameInputWrap: {
    alignItems: 'center',
    backgroundColor: Colors.appBg,
    borderColor: Colors.hairline,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    marginTop: hp(1.2),
    paddingHorizontal: wp(3),
  },
  nameInput: {
    color: Colors.ink,
    flex: 1,
    minHeight: 48,
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(1),
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: Colors.surface,
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    zIndex: 10,
    shadowColor: Colors.ink,
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  saveSearchBtn: {
    marginBottom: hp(1.2),
  },
  searchBtn: {
    backgroundColor: Colors.primary,
  },
});
