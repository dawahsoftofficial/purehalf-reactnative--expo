import { Image, StatusBar, View } from 'react-native'
import React, { useEffect } from 'react'
import { LanguagePicker, Container, Text } from '../../components'
import { LanguageKeys } from '../../languages'
import { Button } from '../../components/buttons'
import { Animation } from '../../animations'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { StyleSheet } from "react-native";
import { hp, wp, Typography } from "../../global";
import Constants from "../../global/Constants";
import { Colors, Fonts, Images } from '../../res'
import { StorageManager } from '../../services';

const ChooseLanguage = (props: any) => {
    const { setData, storageKeys, getData } = StorageManager
    const onContinuePress = () => {
        props.navigation.navigate('PhoneNumber')
    }

    const setPreDefinedLanguage = () => {
        getData(storageKeys.LANGUAGE).then(async (res) => {
            if(!res) {
                await setData(storageKeys.LANGUAGE, 'en')
            }
        })
    }

    useEffect(() => {
        setPreDefinedLanguage()
    }, [])

    return (
        <Container
            style={Styles.container}
        >
            <View style={Styles.logoContainer}>
                <Image
                    source={Images.logoColoured}
                    resizeMode='contain'
                    style={Styles.logo}
                />
            </View>
            <Animation style={Styles.contentContainer}>
                <View style={Styles.headingCon}>
                    <Text style={Styles.chooseLanguageHeading}>
                        {LanguageKeys.chooseLanguage}
                    </Text>
                </View>

                <View style={Styles.chooseLanguageDropCon}>
                    <LanguagePicker />
                </View>
                <View style={Styles.continueBtnCon}>
                    <Button
                        text={LanguageKeys.continue}
                        onPress={onContinuePress}
                        icon={<MaterialCommunityIcons name={'logout-variant'} size={wp(5)} color={Colors.color2} />}
                    />
                </View>
            </Animation>

        </Container>
    )
}

export default ChooseLanguage

const Styles = StyleSheet.create({
    container: {
        justifyContent: 'space-between',
        paddingHorizontal: wp(4),
    },
    logoContainer: {
        height: '66%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    contentContainer: {
        height: '34%',
        justifyContent: "flex-end"
    },
    chooseLanguageHeading: {
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_B,
        fontSize: Typography.large,
        marginBottom: Constants.fontFamilyMarginBottom,
    },
    headingCon: {
        marginBottom: hp(3),
    },
    chooseLanguageDropCon: {
        marginBottom: hp(3),
    },
    logo: {
        width: wp(60),
        height: hp(25)
    },
    continueBtnCon: {
        marginBottom: hp(3)
    },
})