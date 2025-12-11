import { View, StyleSheet, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import AntDesign from 'react-native-vector-icons/AntDesign'
import Ripple from 'react-native-material-ripple'
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { Text } from '../../components'
import { Animation } from '../../animations'
import { Colors, Fonts } from '../../res'
import { Typography, hp, wp } from '../../global'
import { CheckRtl } from '../../languages'

const Bank = (props: any) => {
    const Rtl = CheckRtl()
    const {
        onClose = () => { },
        selectedPackage = {},
        onCloseAll = () => { },
        bankDetails
    } = props

    const price = selectedPackage?.product?.priceString?.includes('.') ?
        selectedPackage.product.priceString.split('.')[0]
        : selectedPackage?.product?.priceString

    return (
        <Animation
            animation="fadeInRight"
            duration={500}
        >
            <View style={{
                ...Styles.headerCon,
                flexDirection: Rtl ? 'row-reverse' : 'row'
            }}>
                <TouchableOpacity activeOpacity={0.7}
                    onPress={onClose}
                >
                    <AntDesign name={Rtl ? 'arrowright' : 'arrowleft'} color={Colors.color1} size={wp(6)} />
                </TouchableOpacity>
                <FontAwesome name="bank" size={30} style={Styles.headerIcon} />
                <Text style={Styles.headerText}>
                    Pay Via Bank
                </Text>
            </View>
            <View style={{ flexDirection: Rtl ? 'row-reverse' : 'row', flexWrap: 'wrap' }}>
                <Text style={Styles.description}>
                    makePaymentOf
                </Text>
                <Text style={[Styles.description, { marginHorizontal: wp(1), fontFamily: Fonts.APPFONT_B }]}>
                    {price?.toUpperCase()}
                </Text>
                <Text style={Styles.description}>
                    at the following Bank
                </Text>
            </View>
            <View style={Styles.numberSection}>
                <View style={Styles.tableCellsWrapper}>
                    <View style={Styles.tableCells}>
                        <Text>Name</Text>
                    </View>
                    <View style={Styles.tableCells}>
                        <Text>{bankDetails?.detail?.BANK}</Text>
                    </View>
                </View>
                <View style={Styles.tableCellsWrapper}>
                    <View style={Styles.tableCells}>
                        <Text>IBAN</Text>
                    </View>
                    <View style={Styles.tableCells}>
                        <Text>{bankDetails?.detail?.IBAN}</Text>
                    </View>
                </View>
                <View style={Styles.tableCellsWrapper}>
                    <View style={Styles.tableCells}>
                        <Text>Account Number</Text>
                    </View>
                    <View style={Styles.tableCells}>
                        <Text>{bankDetails?.detail?.ACCOUNT_NUMBER}</Text>
                    </View>
                </View>
                <View style={Styles.tableCellsWrapper}>
                    <View style={Styles.tableCells}>
                        <Text>Account Name</Text>
                    </View>
                    <View style={Styles.tableCells}>
                        <Text>{bankDetails?.detail?.ACCOUNT_NAME}</Text>
                    </View>
                </View>
            </View>
            <Text style={Styles.description}>
                paymentConfirmationGuidance
            </Text>
            <Ripple
                style={Styles.button}
                onPress={onCloseAll}
            >
                <Text style={Styles.buttonText}>
                    close
                </Text>
            </Ripple>
        </Animation >
    )
}

export default Bank

const Styles = StyleSheet.create({
    headerCon: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(3)
    },
    headerIcon: {
        marginHorizontal: 10
    },
    headerText: {
        color: Colors.color1,
        alignSelf: 'center',
        fontSize: Typography.medium1,
        fontFamily: Fonts.APPFONT_R
    },
    description: {
        fontSize: wp(2.8),
        color: Colors.color12,
        fontFamily: Fonts.APPFONT_M,
        includeFontPadding: false,
    },
    numberSection: {
        borderWidth: 1,
        borderColor: Colors.color42,
        backgroundColor: Colors.color43,
        borderRadius: 8,
        marginVertical: hp(2),
    },
    tableCellsWrapper: {
        alignSelf: 'stretch',
        flexDirection: 'row',
        padding: 5
    },
    tableCells: {
        flex: 1,
        alignSelf: 'stretch'
    },
    button: {
        backgroundColor: Colors.color42,
        borderRadius: 8,
        height: wp(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: hp(4),
        marginBottom: hp(1)
    },
    buttonText: {
        color: Colors.color2,
        fontFamily: Fonts.APPFONT_B,
        textAlign: 'center',
        alignSelf: 'center',
        includeFontPadding: false,
        fontSize: Typography.small3
    }
})