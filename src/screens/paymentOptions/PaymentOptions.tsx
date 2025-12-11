import { FlatList, Image, View } from 'react-native'
import React, { useState } from 'react'
import { Container, Text } from '../../components'
import AntDesign from 'react-native-vector-icons/AntDesign'
import { Colors, Images, Fonts } from '../../res'
import { Animation } from '../../animations'
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons'
import { LanguageKeys, CheckRtl } from '../../languages'
import Ripple from 'react-native-material-ripple'

import { StyleSheet } from "react-native";
import { hp, wp, Typography } from "../../global";
import Constants from "../../global/Constants";


const PaymentOptions = (props: any) => {
    const Rtl = CheckRtl()
    const [paymentOptionsList] = useState([
        {
            icon: Images.bank,
            title: LanguageKeys.onlineBankTransfer,
            id: '1'
        },
        {
            icon: Images.debitCard,
            title: LanguageKeys.debitCreditCard,
            id: '2'
        },
        {
            icon: Images.paypal,
            title: LanguageKeys.paypal,
            id: '3'
        },
        {
            icon: Images.paypal,
            title: LanguageKeys.easyPaisa,
            id: '4'
        },
    ])

    const onItemPress = (item: any) => {
        props.navigation.navigate('BankTransfer')
    }

    const onArrowLeftPress = () => props.navigation.goBack()

    const RenderListIcon = ({ item }: any) => (
        <Image
            source={item.icon}
            resizeMode='contain'
            style={Styles.itemIcon}
        />
    )
    const RenderListTitle = ({ item }: any) => (
        <Text style={Styles.listItemTxt}>
            {item.title}
        </Text>
    )

    const RenderItemInnerContainer = ({ item }: any) => (
        Rtl ?
            <View style={Styles.listItemContainerInner}>
                <RenderListTitle item={item} />
                <RenderListIcon item={item} />
            </View>
            :
            <View style={Styles.listItemContainerInner}>
                <RenderListIcon item={item} />
                <RenderListTitle item={item} />
            </View>
    )
    const renderList = ({ item }: any) => {
        return (
            Rtl ?
                <Ripple style={Styles.listItemContainer}
                    onPress={onItemPress.bind(null, item)}
                >
                    <SimpleLineIcons name='share-alt' color={Colors.color1} size={wp(4)} />
                    <RenderItemInnerContainer item={item} />
                </Ripple>
                :
                <Ripple style={Styles.listItemContainer}
                    onPress={onItemPress.bind(null, item)}
                >
                    <RenderItemInnerContainer item={item} />
                    <SimpleLineIcons name='share-alt' color={Colors.color1} size={wp(4)} />
                </Ripple>
        )
    }
    return (
        <Container
            style={Styles.container}
        >
            <View style={{ flex: 1 }} >
                <View style={Styles.headerContainer}>
                    <AntDesign name='arrowleft' color={Colors.color1} size={wp(6)}
                        onPress={onArrowLeftPress}
                    />
                    <Text style={Styles.headerTxt}>
                        {LanguageKeys.otherWaysToPay}
                    </Text>
                </View>
                <Animation
                    style={Styles.listContainer}
                    animation={"fadeInDown"}
                    duration={500}
                >
                    <FlatList
                        data={paymentOptionsList}
                        renderItem={renderList}
                    />
                </Animation>
            </View>
        </Container>
    )
}

export default PaymentOptions

const Styles = StyleSheet.create({
    container: {
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: hp(1),
        paddingHorizontal: wp(4),
    },
    headerTxt: {
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_B,
        alignSelf: 'center',
        marginBottom: Constants.fontFamilyMarginBottom,
        marginHorizontal: wp(3),
        fontSize: Typography.medium2
    },
    listContainer: {
        borderBottomWidth: 0.3,
        marginTop: hp(7)
    },
    listItemContainer: {
        paddingVertical: wp(3),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(3),
        borderTopWidth: 0.3,
    },
    itemIcon: {
        width: wp(5),
        height: hp(4),
    },
    listItemContainerInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    listItemTxt: {
        alignSelf: 'center',
        marginHorizontal: wp(3),
        color: Colors.color1,
        fontSize: Typography.medium,
        fontFamily: Fonts.APPFONT_R
    }
})