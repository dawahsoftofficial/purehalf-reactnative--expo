import { View, StyleSheet, FlatList, ScrollView } from 'react-native'
import React from 'react'
import { hp, Typography, wp } from '../../global'
import { Text } from '../../components'
import { Colors, Fonts } from '../../res'
import Feather from 'react-native-vector-icons/Feather'
import Constants from '../../global/Constants'
import { Animation } from '../../animations'
import { CheckRtl, LanguageKeys } from '../../languages'
import Ripple from 'react-native-material-ripple'
import { useGlobalContext } from '../../services'

const InfoCard = (props: any) => {
    const { currentUser } = useGlobalContext()
    const Rtl = CheckRtl()
    const {
        data = [],
        headerHeading = '',
        onEditPress = () => null,
        fromUserProfile = false,
        from = '',
        userData
    } = props

    const RenderHeaderHeading = () => (
        <Text style={Styles.headerTxt}>
            {headerHeading}
        </Text>
    )
    const RenderEditBtn = () => (
        <Ripple style={Styles.editButton}
            onPress={onEditPress.bind(null, {
                data: data,
                from: headerHeading
            })}
        >
            <Feather
                name='edit-2'
                color={Colors.color1}
                size={wp(4)}
            />
        </Ripple>

    )

    const RenderList = ({ item, index }: any) => {
        const { selected } = item
        const { value } = selected
        const id = item?.id
        const isMale = userData?.gender === 'female' ? false : true
        let hideItem;
        if (fromUserProfile) {
            hideItem = (id === 'doYouHaveABeard' && isMale || id === 'hijab-0' && !isMale)
        } else {
            hideItem = (id === 'doYouHaveABeard' && !isMale || id === 'hijab-0' && isMale)
        }
        return (
            hideItem ? null :
                <View style={{
                    ...Styles.listItemContainer, flexDirection: Rtl ? 'row-reverse' : 'row',
                    backgroundColor: index % 2 === 0 ? Colors.color31 : Colors.color2
                }}>
                    <Text style={{ ...Styles.itemHeading, textAlign: Rtl ? 'right' : 'left' }}>
                        {item.title}
                    </Text>
                    <Text style={{ ...Styles.itemValue, textAlign: Rtl ? 'right' : 'left' }}>
                        {
                            typeof (value) === 'number' ?
                                (
                                    value === 1 ? 'Yes' :
                                        value === 0 ? 'No' :
                                            id === 'height' || id === 'weight' ?
                                                `${value.toFixed()} ${selected?.scale || ''}` :
                                                value.toFixed()
                                )
                                :
                                value && value.length !== 0 ? value
                                    :
                                    item?.title == "disabilities" ? LanguageKeys.none : LanguageKeys.notYetProvided
                        }
                    </Text>
                </View>
        )
    }
    return (
        data.length !== 0 ?
            <View style={Styles.container}>
                <View style={{ ...Styles.headerContainer, flexDirection: Rtl ? 'row-reverse' : 'row' }}>
                    <RenderHeaderHeading />
                    {
                        !fromUserProfile &&
                        <RenderEditBtn />
                    }
                </View>

                <Animation
                    style={Styles.listContainer}
                    animation={"fadeInDown"}
                    duration={500}
                >
                    {
                        from === 'waliInformation' && fromUserProfile && data.length !== 0 ?
                            <Text style={Styles.waliInfoDes}>
                                {LanguageKeys.moderatedByWali}
                            </Text>
                            :
                            <ScrollView
                                horizontal
                                scrollEnabled={false}
                            >
                                <FlatList
                                    data={data}
                                    renderItem={RenderList}
                                    scrollEnabled={false}
                                />
                            </ScrollView>
                    }
                </Animation>
            </View>
            :
            <View />
    )
}

export default InfoCard

const Styles = StyleSheet.create({
    container: {
        marginHorizontal: wp(4),
        backgroundColor: Colors.color2,
        paddingTop: hp(1.5),
        borderRadius: 10,
        marginBottom: hp(4.5),
        borderWidth: 0.5,
        borderColor: Colors.color27,
        overflow: 'hidden'
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(4),
        paddingBottom: hp(1)
    },
    headerTxt: {
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_B,
        fontSize: Typography.medium,
        marginBottom: Constants.fontFamilyMarginBottom
    },
    listContainer: {
        marginTop: hp(1),
    },
    listItemContainer: {
        paddingHorizontal: wp(4),
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: wp(92),
        paddingVertical: hp(1),
    },
    itemHeading: {
        width: wp(45),
        color: Colors.color12,
        fontFamily: Fonts.APPFONT_SB,
        fontSize: Typography.small1,
        marginBottom: Constants.fontFamilyMarginBottom,
        paddingRight: 5
    },
    itemValue: {
        width: wp(39),
        color: Colors.color11,
        fontFamily: Fonts.APPFONT_R,
        fontSize: Typography.small1,
        marginBottom: Constants.fontFamilyMarginBottom,
        alignSelf: 'flex-start',
    },
    waliInfoDes: {
        color: Colors.color11,
        fontFamily: Fonts.APPFONT_R,
        fontSize: Typography.small3,
        includeFontPadding: false,
        marginTop: hp(-2),
        marginBottom: hp(2),
        marginHorizontal: wp(4)
    },
    editButton: {
        paddingVertical: hp(1),
        paddingHorizontal: wp(2),
        marginRight: wp(-2)
    }
})