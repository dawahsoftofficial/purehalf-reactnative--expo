import { View, StyleSheet, Image } from 'react-native'
import React, { useState } from 'react'
import { hp, Typography, wp } from '../../global'
import { Colors, Fonts, Images } from '../../res'
import { CountryPicker, Text } from '../../components'
import { LanguageKeys, CheckRtl } from '../../languages'
import Ripple from 'react-native-material-ripple';
import Constants from '../../global/Constants'
import AntDesign from 'react-native-vector-icons/AntDesign'
import { isIOS } from '../../services'


const CountryPickerBtn = (props: any) => {
    const Rtl = CheckRtl()
    const {
        value = { "code": "PK", "dial_code": "+92", "flag": "🇵🇰", "name": "Pakistan" }
    } = props
    const [selectedCountry, setSelectedCountry] = useState(value)
    const [countryPickerVisible, setCountryPickerVisible] = useState(false)

    const RenderDownIcon = () => (
        <AntDesign name='down' size={wp(3.5)} color={Colors.color4} />
    )
    const RenderGlobeImage = () => (
        <Image
            source={Images.globe}
            resizeMode='contain'
            style={Styles.globeIcon}
        />
    )

    const RenderCountryText = () => (
        <Text style={Styles.outerBtnLabel}>{selectedCountry.name}</Text>
    )

    const onPressBtn = () => setCountryPickerVisible(true)
    const closeCountryPicker = () => setCountryPickerVisible(false)

    const onSelectCountry = (item: any) => {
        setSelectedCountry(item)
        setCountryPickerVisible(false)
        props.onSelect(item)
    }


    return (
        <View>
            <Text style={Styles.label}>
                {LanguageKeys.country}
            </Text>
            {
                Rtl ?
                    <Ripple
                        style={Styles.container}
                        onPress={onPressBtn}
                    >
                        <RenderDownIcon />
                        <View style={Styles.innerContainer}>
                            <RenderCountryText />
                            <RenderGlobeImage />
                        </View>
                    </Ripple>
                    :
                    <Ripple
                        style={Styles.container}
                        onPress={onPressBtn}
                    >
                        <View style={Styles.innerContainer}>
                            <RenderGlobeImage />
                            <RenderCountryText />
                        </View>
                        <RenderDownIcon />
                    </Ripple>
            }
            <CountryPicker
                visible={countryPickerVisible}
                onClose={closeCountryPicker}
                onPress={onSelectCountry}
            />
        </View>
    )
}

export default CountryPickerBtn

const Styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.color3,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: wp(12),
        paddingHorizontal: wp(2),
        borderBottomWidth: 0.7,
        borderColor: Colors.color1,
        marginTop: hp(0.8),
    },
    innerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: hp(6),
    },
    label: {
        fontSize: Typography.medium,
        fontFamily: Fonts.APPFONT_R,
        marginBottom: Constants.fontFamilyMarginBottom,
        color: Colors.color1
    },
    globeIcon: {
        width: wp(4.5),
        height: hp(4)
    },
    outerBtnLabel: {
        fontFamily: Fonts.APPFONT_R,
        color: Colors.color1,
        fontSize: Typography.small3,
        marginTop: !isIOS ? hp(0.35) : 0,
        alignSelf: 'center',
        marginHorizontal: wp(3)
    },
})