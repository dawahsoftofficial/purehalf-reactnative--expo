import { ScrollView, View } from 'react-native'
import React from 'react'
import { Container, Text } from '../../components'
import { Animation } from '../../animations'
import AntDesign from 'react-native-vector-icons/AntDesign'
import { LanguageKeys } from '../../languages'

import { StyleSheet } from "react-native";
import { hp, wp, Typography } from "../../global";
import Constants from "../../global/Constants";
import { Colors, Fonts } from '../../res'


const BankTransfer = (props: any) => {

    const onArrowLeftPress = () => props.navigation.goBack()

    const RenderBankDetail = (props: any) => (
        <View style={Styles.bankDetailContainer}>
            <Text style={Styles.bankDetailHeading}>{props.heading}</Text>
            <Text style={Styles.bankDetailDescription}>{props.description}</Text>
        </View>
    )
    return (
        <Container style={Styles.container}>
            <View style={{ flex: 1 }} >
                <View style={Styles.headerContainer}>
                    <AntDesign name='arrowleft' color={Colors.color1} size={wp(6)}
                        onPress={onArrowLeftPress}
                    />
                    <Text style={Styles.headerTxt}>
                        {LanguageKeys.onlineBankTransfer}
                    </Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Animation
                        style={Styles.innerContainer}
                        animation={"fadeInDown"}
                        duration={500}
                    >
                        <Text style={Styles.description}>
                            {LanguageKeys.bankTransferDes1}
                        </Text>
                        <View style={Styles.bankDetailContainerTop} />
                        <RenderBankDetail
                            heading={LanguageKeys.bankNameHeading}
                            description={LanguageKeys.bankName}
                        />
                        <RenderBankDetail
                            heading={LanguageKeys.accountTitleHeading}
                            description={LanguageKeys.accountTitle}
                        />
                        <RenderBankDetail
                            heading={LanguageKeys.accountIban}
                            description={"xxxx-xxxx-xxxx-xxxx-xxxxx"}
                        />
                        <RenderBankDetail
                            heading={LanguageKeys.sortCode}
                            description={"xx - xx - xx"}
                        />
                        <Text style={{ ...Styles.bankDetailHeading, marginTop: hp(4), marginBottom: hp(1) }}>
                            {LanguageKeys.proofOfPayment}
                        </Text>
                        <Text style={Styles.bankDetailDescription}>
                            {LanguageKeys.bankTransferDes2}
                        </Text>
                        <Text style={{ ...Styles.bankDetailDescription, marginTop: hp(2) }}>
                            {LanguageKeys.bankTransferDes3}
                        </Text>
                    </Animation>
                </ScrollView>
            </View>
        </Container>
    )
}

export default BankTransfer

const Styles = StyleSheet.create({
    container: {
        paddingHorizontal: wp(4),
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: hp(1),
    },
    headerTxt: {
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_B,
        alignSelf: 'center',
        marginBottom: Constants.fontFamilyMarginBottom,
        marginHorizontal: wp(3),
        fontSize: Typography.medium2
    },
    innerContainer: {
        marginTop: hp(8)
    },
    description: {
        fontSize: Typography.small2,
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_R,
        marginBottom: Constants.fontFamilyMarginBottom
    },
    bankDetailContainerTop: {
        marginTop: hp(5)
    },
    bankDetailContainer: {
        marginBottom: hp(3)
    },
    bankDetailHeading: {
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_B,
        fontSize: Typography.small3,
        marginBottom: Constants.fontFamilyMarginBottom
    },
    bankDetailDescription: {
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_R,
        fontSize: Typography.small3,
        marginBottom: Constants.fontFamilyMarginBottom
    }
})