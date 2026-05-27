import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Container, Header, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl } from '../../languages';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
import { ApiServices, flashErrorMessage } from '../../services';
import { presentBoostProfilePaywall } from '../../services/paywall-service';
import UsersList from '../welcome/UsersList';

const SearchResults = (props: any) => {
  const Rtl = CheckRtl();
  const [searchResults, setSearchResults] = useState(
    props?.route?.params?.searchResults?.results
  );
  const [totalSearchResults] = useState(
    props?.route?.params?.searchResults?.total
  );
  const urlParams = props?.route?.params?.urlParams;
  const [loadMoreLoader, setLoadMoreLoader] = useState(false);
  const [searchResultsPageNo, setsearchResultsPageNo] = useState(2);
  const [isBoostLoading, setIsBoostLoading] = useState(false);

  const hideLoadMoreLoader = () => setLoadMoreLoader(false);

  const onBoostPress = useCallback(async () => {
    setIsBoostLoading(true);
    try {
      const result = await presentBoostProfilePaywall();
      if (result.error && result.error !== 'Purchase cancelled by user') {
        flashErrorMessage(result.error || 'Failed to open boost paywall');
      }
    } catch (error: any) {
      flashErrorMessage(error.message || 'Failed to open boost paywall');
    } finally {
      setIsBoostLoading(false);
    }
  }, []);

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
    // Promise.resolve().then(() => {
    setTimeout(() => {
      onLoadMoreData();
    }, 0);
    // });
  }, []);

  return (
    <Container>
      <Header
        title={LanguageKeys.searchResults}
        navigation={props.navigation}
        // customConponent={() => (
        //   <View
        //     style={[
        //       Styles.headerRightContainer,
        //       { flexDirection: Rtl ? 'row-reverse' : 'row' },
        //     ]}
        //   >
        //     <BoostBadge onPress={onBoostPress} disabled={isBoostLoading} />
        //   </View>
        // )}
      />
      <View style={Styles.headerDesCon}>
        <Text style={Styles.headerDes}>
          {LanguageKeys.foundMatchingResultDes1}
        </Text>
        <Text style={Styles.headerDes}>
          {JSON.stringify(totalSearchResults)}
        </Text>
        <Text style={Styles.headerDes}>
          {LanguageKeys.foundMatchingResultDes2}
        </Text>
      </View>
      <UsersList
        data={searchResults}
        navigation={props.navigation}
        onLoadMorePress={onLoadMoreData}
      />
      {loadMoreLoader && (
        <ActivityIndicator
          color={Colors.theme}
          size={'small'}
          style={{ marginBottom: hp(5) }}
        />
      )}
    </Container>
  );
};

export default SearchResults;

const Styles = StyleSheet.create({
  headerDesCon: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginHorizontal: wp(4),
    flexWrap: 'wrap',
    width: wp(100),
    marginVertical: hp(2),
  },
  headerDes: {
    color: Colors.color1,
    fontSize: Typography.small,
    fontFamily: Fonts.APPFONT_R,
    lineHeight: wp(5),
    textAlign: 'left',
    alignSelf: 'flex-start',
    marginRight: wp(1),
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
});
