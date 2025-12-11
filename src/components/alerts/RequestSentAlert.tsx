import { Image, View, StyleSheet, Dimensions } from 'react-native'
import React from 'react'
import AlertContainer from './AlertContainer'
import Text from '../Text'
import { Colors, Fonts, Images } from '../../res'
import { hp, Typography, wp } from '../../global'
import { Button } from '../buttons'
import { LanguageKeys } from '../../languages'
import Feather from 'react-native-vector-icons/Feather'

const RequestSentAlert = (props: any) => {
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
                <View style={Styles.checkIconCon}>
                    <Feather
                        name='check'
                        color={Colors.color2}
                        size={wp(11)}
                    />
                </View>

                <Text style={Styles.heading}>
                    {LanguageKeys.requestSent}
                </Text>
                <Text style={Styles.description}>
                    {LanguageKeys.requestSentDes}
                </Text>
            </View>
        </AlertContainer>
    )
}

export default RequestSentAlert

const { width } = Dimensions.get('window')
const Styles = StyleSheet.create({
    contentContainer: {
        alignItems: 'center'
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
        marginHorizontal: wp(4),
        marginBottom: hp(3)
    },
    checkIconCon: {
        width: width * 0.2,
        height: width * 1 * 0.2,
        borderRadius: width * 1 * 0.2 / 2,
        backgroundColor: Colors.theme,
        justifyContent: 'center',
        alignItems: 'center'
    }
})