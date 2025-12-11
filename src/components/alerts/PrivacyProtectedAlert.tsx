import { Image, View, StyleSheet } from 'react-native'
import React from 'react'
import AlertContainer from './AlertContainer'
import Text from '../Text'
import { Colors, Fonts, Images } from '../../res'
import { hp, Typography, wp } from '../../global'
import { Button } from '../buttons'
import { LanguageKeys } from '../../languages'

const PrivacyProtectedAlert = (props: any) => {
    const {
        visible = false,
        onClose = () => null,
        onPress = () => null
    } = props
    return (
        <AlertContainer
            visible={visible}
            onClose={onClose}
        >
            <View style={Styles.contentContainer}>
                <Image
                    source={Images.lock}
                    resizeMode='contain'
                    style={Styles.lock}
                />
                <Text style={Styles.heading}>
                    {LanguageKeys.privacyProtected}
                </Text>
                <Text style={Styles.description}>
                    {LanguageKeys.privatePhotoDes}
                </Text>
                <Button
                    text={LanguageKeys.requestAccess}
                    buttonStyle={Styles.button}
                    onPress={onPress}
                />
            </View>
        </AlertContainer>
    )
}

export default PrivacyProtectedAlert

const Styles = StyleSheet.create({
    contentContainer: {
        alignItems: 'center'
    },
    lock: {
        width: wp(10),
        height: hp(6),
    },
    heading: {
        alignSelf: 'center',
        textAlign: 'center',
        lineHeight: wp(7),
        fontFamily: Fonts.APPFONT_B,
        fontSize: Typography.large1,
        color: Colors.color1,
        marginTop: hp(2),
        marginBottom: hp(1)
    },
    description: {
        alignSelf: 'center',
        textAlign: 'center',
        lineHeight: wp(5),
        fontFamily: Fonts.APPFONT_R,
        fontSize: Typography.small2,
        color: Colors.color1,
        marginHorizontal: wp(4)
    },
    button: {
        width: wp(80),
        marginTop: hp(5),
        marginBottom: hp(3)
    }
})