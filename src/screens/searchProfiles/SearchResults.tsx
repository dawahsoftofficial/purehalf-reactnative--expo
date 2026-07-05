import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  StyleSheet,
  Text as ReactText,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Container, Header } from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
import { ApiServices } from '../../services';
import UsersList from '../welcome/UsersList';

const SearchResults = (props: any) => {
  const { t }: any = useTranslation();
  const [searchResults, setSearchResults] = useState(
    props?.route?.params?.searchResults?.results
  );
  const [totalSearchResults] = useState(
    props?.route?.params?.searchResults?.total
  );
  const urlParams = props?.route?.params?.urlParams;
  const [loadMoreLoader, setLoadMoreLoader] = useState(false);
  const [searchResultsPageNo, setsearchResultsPageNo] = useState(2);

  const hideLoadMoreLoader = () => setLoadMoreLoader(false);

  const onLoadMoreData = useCallback(() => {
    // M8 + M9 fix: prevent overlapping requests AND pass the next page number
    // explicitly. The previous code called setState(prev+1) then read the OLD
    // `searchResultsPageNo` in the API call, sending the same page twice.
    if (loadMoreLoader) return;
    const nextPage = searchResultsPageNo;
    setLoadMoreLoader(true);
    ApiServices.searchFilterApply(urlParams, nextPage)
      .then((data: any) => {
        setSearchResults((prevResults: any[]) => {
          if (!prevResults || prevResults.length === 0) {
            return data?.results;
          } else {
            return [...prevResults, ...(data?.results ?? [])];
          }
        });
        setsearchResultsPageNo((prev) => prev + 1);
        setLoadMoreLoader(false);
      })
      .catch(hideLoadMoreLoader);
  }, [urlParams, searchResultsPageNo, loadMoreLoader]);

  useEffect(() => {
    // Defer state updates to avoid cascading renders
    setTimeout(() => {
      onLoadMoreData();
    }, 0);
  }, []);

  return (
    <Container style={Styles.screen}>
      <Header
        title={LanguageKeys.searchResults}
        navigation={props.navigation}
        titleVariant="display"
      />
      <View style={Styles.summaryBanner}>
        <View style={Styles.summaryIcon}>
          <Ionicons name="people" color={Colors.primary} size={wp(5)} />
        </View>
        <ReactText style={Styles.summaryTxt}>
          <ReactText style={Styles.summaryCount}>
            {totalSearchResults ?? 0}{' '}
          </ReactText>
          {t(LanguageKeys.foundMatchingResultDes2)}
        </ReactText>
      </View>
      <UsersList
        data={searchResults}
        navigation={props.navigation}
        onLoadMorePress={onLoadMoreData}
      />
      {loadMoreLoader && (
        <ActivityIndicator
          color={Colors.primary}
          size={'small'}
          style={Styles.loadMore}
        />
      )}
    </Container>
  );
};

export default SearchResults;

const Styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.appBg,
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lavender,
    borderRadius: 14,
    paddingVertical: hp(1.4),
    paddingHorizontal: wp(4),
    marginHorizontal: wp(4),
    marginTop: hp(1.5),
  },
  summaryIcon: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  summaryTxt: {
    flex: 1,
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    includeFontPadding: false,
  },
  summaryCount: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium,
  },
  loadMore: {
    marginBottom: hp(5),
  },
});
