import { View, StyleSheet } from 'react-native'
import React from 'react'
import { Colors, Fonts } from '../../res'
import { hp, Typography, wp } from '../../global'
import Ripple from 'react-native-material-ripple'
import { Text } from '../../components'
import AntDesign from 'react-native-vector-icons/AntDesign'
import { CheckRtl } from '../../languages'

const PickerButton = (props: any) => {
    const Rtl = CheckRtl()
    const {
        outerContainerStyle = {},
        buttonContainer = {},
        outerLabelStyle = {},
        buttonTextStyle = {},
        outerLabel = '',
        buttonText = '',
        onPress = () => null
    } = props

    const RenderBtnTxt = () => (
        <Text style={[Styles.buttonText, buttonTextStyle]}>
            {buttonText}
        </Text>
    )

    const RenderDownBtn = () => (
        <AntDesign
            name='down'
            color={Colors.color1}
            size={wp(3.5)}
        />
    )
    return (
        <View style={[Styles.container, outerContainerStyle]}>
            <Text style={[Styles.outerLabel, outerLabelStyle]}>
                {outerLabel}
            </Text>
            {
                Rtl ?
                    <Ripple style={[Styles.buttonContainer, buttonContainer]}
                        onPress={onPress}
                    >
                        <RenderDownBtn />
                        <RenderBtnTxt />
                    </Ripple>
                    :
                    <Ripple style={[Styles.buttonContainer, buttonContainer]}
                        onPress={onPress}
                    >
                        <RenderBtnTxt />
                        <RenderDownBtn />
                    </Ripple>
            }
        </View>
    )
}

export default PickerButton

const Styles = StyleSheet.create({
    container: {

    },
    outerLabel: {
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_B,
        fontSize: Typography.small2,
        lineHeight: wp(4.5)
    },
    buttonContainer: {
        paddingVertical: hp(1.5),
        backgroundColor: Colors.color3,
        paddingHorizontal: wp(3),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        marginTop: hp(1)
    },
    buttonText: {
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_R,
        fontSize: Typography.small2,
        lineHeight: wp(4.5)
    }
})