import { View, StyleSheet, ActivityIndicator } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Container, Header, Text } from '../../components'
import { Colors } from '../../res'
import UsersList from '../welcome/UsersList'
import { hp, Typography, wp } from '../../global'
import { LanguageKeys } from '../../languages'
import { ApiServices } from '../../services'

const SearchResults = (props: any) => {
    const [searchResults, setSearchResults] = useState(props?.route?.params?.searchResults?.results)
    const [totalSearchResults,] = useState(props?.route?.params?.searchResults?.total)
    const urlParams = props?.route?.params?.urlParams
    const [loadMoreLoader, setLoadMoreLoader] = useState(false)
    const [searchResultsPageNo, setsearchResultsPageNo] = useState(2)

    const hideLoadMoreLoader = () => setLoadMoreLoader(false)

    const onLoadMoreData = () => {
        setLoadMoreLoader(true)
        setsearchResultsPageNo(searchResultsPageNo + 1)
        ApiServices.searchFilterApply(urlParams, searchResultsPageNo).then((data: any) => {
            if(searchResults.length === 0) {
                setSearchResults(data?.results)
            }
            else {
                searchResults.push(...data?.results)
                setSearchResults(searchResults)
            }
            setLoadMoreLoader(false)
        })
            .catch(hideLoadMoreLoader)
    }

    useEffect(() => {
        onLoadMoreData()
    }, [])

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
            {
                loadMoreLoader &&
                <ActivityIndicator color={Colors.theme} size={'small'} style={{ marginBottom: hp(5) }} />
            }
        </Container>
    )
}

export default SearchResults

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
        marginRight: wp(1)
    }
})