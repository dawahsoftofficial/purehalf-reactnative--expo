import React, { useState } from 'react'
import { TextInput, View, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'

import { Text } from '../../components'
import { Button } from '../../components/buttons'
import { LanguageKeys, CheckRtl } from '../../languages'
import { hp, Typography, wp } from '../../global'
import { Colors, Fonts } from '../../res'
import { ApiServices, checkEmpty, useGlobalContext } from '../../services'


const Email = () => {
    const { currentUser } = useGlobalContext()
    const navigation: any = useNavigation()
    const [loading, setLoading] = useState(false)
    const [phoneNumber, setPhoneNumber] = useState(currentUser?.email)
    const [loadingMessage,] = useState('Submitting...')
    const Rtl = CheckRtl()

    const onContinuePress = () => {
        setLoading(true)
        ApiServices.sendOTPForAccountDelete({})
            .then(() => {
                setLoading(false)
                navigation.navigate('PurposeOfLeaving',
                    {
                        phoneNumber: phoneNumber,
                        type: 'email'
                    }
                )
            })
            .catch(() => {
                setLoading(false)
            })
    }

    return (
        <View >
            <View style={Styles.headingCon}>
                <Text style={Styles.heading}>
                    {LanguageKeys.enterEmail}
                </Text>
            </View>

            <View style={{ ...Styles.inputOuterContainer, flexDirection: Rtl ? 'row-reverse' : 'row' }}>
                <TextInput
                    style={Styles.phoneNumberInput}
                    keyboardType='email-address'
                    value={phoneNumber}
                />
            </View>
            <View style={Styles.continueBtnCon}>
                <Button
                    text={LanguageKeys.continue}
                    onPress={onContinuePress}
                    loading={loading}
                    loadingMessage={loadingMessage}
                    disabled={checkEmpty(phoneNumber) || loading}
                />
            </View>
        </View>
    )
}

export default Email

const Styles = StyleSheet.create({
    continueBtnCon: {
        marginBottom: hp(3)
    },
    inputOuterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: hp(3),
        height: wp(11),
    },
    phoneNumberInput: {
        color: Colors.color1,
        borderBottomWidth: 1,
        height: wp(11),
        width: wp(90),
        paddingVertical: hp(1),
        fontSize: Typography.medium
    },
    headingCon: {
        marginBottom: hp(3)
    },
    heading: {
        fontSize: Typography.large,
        fontFamily: Fonts.APPFONT_B,
        color: Colors.color1,
    },
})