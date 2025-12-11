import { View, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';

import { Text } from '../../components';
import { Animation } from '../../animations';
import { hp, Typography, wp } from '../../global';
import { Colors, Fonts } from '../../res';
import Constants from '../../global/Constants';
import { CheckRtl, LanguageKeys } from '../../languages';
import { useGlobalContext } from '../../services';

const InterestAndHobbyCardStatic = (props: any) => {
    const Rtl = CheckRtl();
    const { currentUser } = useGlobalContext()
    const {
        data = [],
        headerHeading = '',
        fromUserProfile = false,
        from = '',
        matchPercentage = 0,
    } = props;
    const [matchingData, setMatchingData] = useState<any>([])

    useEffect(() => {
        if (data?.length) {
            setMatchingData(data?.filter((data: any) => currentUser?.detail?.personality_id?.includes(data?.id)))
        }
    }, [data?.length])


    if (!fromUserProfile || !matchPercentage) return null;

    const RenderHeaderHeading = () => (
        <Text style={Styles.headerTxt}>{headerHeading} ({matchPercentage?.toFixed(0)}% match)</Text>
    );

    return data.length !== 0 ? (
        <View style={Styles.container}>
            <View
                style={{
                    ...Styles.headerContainer,
                    flexDirection: Rtl ? 'row-reverse' : 'row',
                }}>
                <RenderHeaderHeading />
            </View>
            <Animation animation={'fadeInDown'} duration={500}>
                {from === 'waliInformation' && fromUserProfile && data.length !== 0 ? (
                    <Text style={Styles.waliInfoDes}>{LanguageKeys.moderatedByWali}</Text>
                ) : (
                    <View
                        style={{
                            ...Styles.listItemContainer,
                            flexDirection: Rtl ? 'row-reverse' : 'row',
                        }}>
                        {matchingData?.map((item: any, index: number) =>
                            <View key={index} style={Styles.item}>
                                <Text style={Styles.itemValue}>{item?.value}</Text>
                            </View>
                        )}
                    </View>
                )}
            </Animation>
        </View>
    ) : (
        <View />
    );
};

export default InterestAndHobbyCardStatic;

const Styles = StyleSheet.create({
    container: {
        marginHorizontal: wp(4),
        backgroundColor: Colors.color2,
        paddingTop: hp(1.5),
        borderRadius: 10,
        marginBottom: hp(4.5),
        borderWidth: 0.5,
        borderColor: Colors.color27,
        overflow: 'hidden',
        paddingBottom: hp(2),
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(4),
        paddingBottom: hp(1),
    },
    headerTxt: {
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_B,
        fontSize: Typography.medium,
        marginBottom: Constants.fontFamilyMarginBottom,
    },
    editButton: {
        paddingVertical: hp(1),
        paddingHorizontal: wp(2),
        marginRight: wp(-2),
    },
    waliInfoDes: {
        color: Colors.color11,
        fontFamily: Fonts.APPFONT_R,
        fontSize: Typography.small3,
        includeFontPadding: false,
        marginTop: hp(-2),
        marginBottom: hp(2),
        marginHorizontal: wp(4),
    },
    passInfoDes: {
        color: Colors.color11,
        fontFamily: Fonts.APPFONT_R,
        fontSize: Typography.small3,
        includeFontPadding: false,
    },
    listItemContainer: {
        paddingHorizontal: wp(3.5),
        flexWrap: 'wrap',
    },
    item: {
        backgroundColor: Colors.color3,
        paddingHorizontal: wp(2),
        paddingVertical: hp(1),
        margin: hp(0.5),
        borderRadius: 50,
        borderColor: Colors.color4,
        borderWidth: 1,
    },
    itemValue: {
        color: Colors.color11,
        fontFamily: Fonts.APPFONT_R,
        fontSize: Typography.small1,
        marginBottom: Constants.fontFamilyMarginBottom,
        alignSelf: 'flex-start',
    },
});