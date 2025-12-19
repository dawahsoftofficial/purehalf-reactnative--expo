import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Container, Header, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors } from '../../res';
import { ApiServices } from '../../services';
import UsersList from '../welcome/UsersList';

const SearchResults = (props: any) => {
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
    setLoadMoreLoader(true);
    setsearchResultsPageNo((prevPageNo) => prevPageNo + 1);
    ApiServices.searchFilterApply(urlParams, searchResultsPageNo)
      .then((data: any) => {
        setSearchResults((prevResults: any[]) => {
          if (prevResults.length === 0) {
            return data?.results;
          } else {
            return [...prevResults, ...data?.results];
          }
        });
        setLoadMoreLoader(false);
      })
      .catch(hideLoadMoreLoader);
  }, [urlParams, searchResultsPageNo]);

  useEffect(() => {
    // Defer state updates to avoid cascading renders
    // Promise.resolve().then(() => {
    onLoadMoreData();
    // });
  }, []);

  return (
    <Container>
      <Header
        title={LanguageKeys.searchResults}
        navigation={props.navigation}
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
    fontSize: Typography.small3,
    lineHeight: wp(5),
    textAlign: 'left',
    alignSelf: 'flex-start',
    marginRight: wp(1),
  },
});
