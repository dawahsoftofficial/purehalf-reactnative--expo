import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { hp, Typography } from '../../global';
import { Colors, Fonts } from '../../res';
import { Text } from '../../components'
import { LanguageKeys } from '../../languages';

const AnimatedLoaderFun = (props: any) => {
    const {
        visible = false,
        text = LanguageKeys.uploading,
        style = {}
    } = props
    return (
        visible ?
            <View style={[Styles.container, style]}>
                <ActivityIndicator color={Colors.theme} />
                <Text style={Styles.textStyle}>
                    {text}
                </Text>
            </View>
            : null
    )
}

export default AnimatedLoaderFun

const Styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    textStyle: {
        color: Colors.color1,
        fontSize: Typography.medium,
        fontFamily: Fonts.APPFONT_R,
        includeFontPadding: false,
        alignSelf: 'center',
        textAlign: 'center',
        marginVertical: hp(2)
    }
});