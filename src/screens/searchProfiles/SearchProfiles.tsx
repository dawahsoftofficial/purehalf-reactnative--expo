import { StyleSheet, ScrollView, StatusBar } from 'react-native'
import React, { } from 'react'
import { Button, Container, Text } from '../../components'
import { hp, Typography, wp } from '../../global'
import { Colors, Fonts } from '../../res'
import SavedSearches from './SavedSearches'
import RefineSearch from './RefineSearch'
import { LanguageKeys } from '../../languages'
import { View } from 'react-native-animatable'
import DeviceInfo from 'react-native-device-info';
import { isIOS } from '../../services'

const hasNotch = DeviceInfo.hasNotch();
const SearchProfiles = (props: any) => {

    return (
        <Container
            style={Styles.container}
        >
            <StatusBar backgroundColor={Colors.color2} barStyle={'dark-content'} />
            <ScrollView
                contentContainerStyle={Styles.innerContainer}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                <View style={Styles.headerCon}>
                    <Text style={Styles.headerTitle}>
                        {LanguageKeys.searchProfiles}
                    </Text>
                </View>
                <Text style={Styles.heading}>
                    {LanguageKeys.savedSearches}
                </Text>
                <SavedSearches />
                <RefineSearch />
            </ScrollView>
        </Container>
    )
}

export default SearchProfiles

const Styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.color7,
        paddingTop: 0
    },
    innerContainer: {
        paddingHorizontal: wp(4),
        paddingBottom: hp(4),
    },
    heading: {
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_B,
        fontSize: Typography.small2,
        includeFontPadding: false,
        marginTop: hp(4)
    },
    headerCon: {
        paddingTop: isIOS && hasNotch ? hp(3) : isIOS && !hasNotch ? hp(2.5) : hp(1.5),
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
        marginTop: hp(1)
    },
})