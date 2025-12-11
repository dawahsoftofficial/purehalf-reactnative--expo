import { View, StyleSheet, TextInput, Image } from 'react-native'
import React from 'react'
import { hp, Typography, wp } from '../../global'
import { Text } from '..'
import { Colors, Fonts } from '../../res'
import { useTranslation } from 'react-i18next'
import { CheckRtl } from '../../languages'


const IconInput = (props: any) => {
    const Rtl = CheckRtl()
    const { t }: any = useTranslation()
    const {
        icon = null,
        iconStyle = null,
        inputStyle = null,
        outerLabelStyle = {},
        containerStyle = {},
        label = '',
        value = '',
        onChangeText = () => null,
        onFocus = () => null,
        onBlur = () => null,
        placeholder = '',
        placeholderColor = Colors.color28,
        secureTextEntry = false,
        disabled = false
    } = props

    const RenderIcon = () => (
        <Image
            source={icon}
            resizeMode='contain'
            style={[Styles.inputIcon, iconStyle]}
        />
    )


    return (
        <View style={[Styles.container, containerStyle]}>
            <Text style={[Styles.inputLabel, outerLabelStyle]}>
                {label}
            </Text>
            {
                Rtl ?
                    <View style={[Styles.inputOuterContainer, { backgroundColor: disabled ? Colors.color61 : Colors.color3 }]}>
                        <TextInput
                            style={[Styles.input, {
                                textAlign: Rtl ? 'right' : 'left',
                                paddingRight: icon ? 0 : wp(2),
                                paddingLeft: wp(2)
                            }, inputStyle]}
                            placeholder={t(placeholder)}
                            placeholderTextColor={placeholderColor}
                            value={value}
                            onChangeText={onChangeText}
                            onFocus={onFocus}
                            onBlur={onBlur}
                            multiline={false}
                            secureTextEntry={secureTextEntry}
                            editable={!disabled}
                        />
                        {icon && <RenderIcon />}
                    </View>
                    :
                    <View style={[Styles.inputOuterContainer, { backgroundColor: disabled ? Colors.color61 : Colors.color3 }]}>
                        {icon && <RenderIcon />}
                        <TextInput
                            style={[Styles.input, {
                                textAlign: Rtl ? 'right' : 'left',
                                paddingLeft: icon ? 0 : wp(2),
                                paddingRight: wp(2)
                            }, inputStyle]}
                            placeholder={t(placeholder)}
                            placeholderTextColor={placeholderColor}
                            value={value}
                            onChangeText={onChangeText}
                            onFocus={onFocus}
                            onBlur={onBlur}
                            multiline={false}
                            secureTextEntry={secureTextEntry}
                            editable={!disabled}
                        />
                    </View>
            }
        </View>
    )
}

export default IconInput

const Styles = StyleSheet.create({
    container: {},
    inputLabel: {
        fontSize: Typography.medium,
        fontFamily: Fonts.APPFONT_M,
        color: Colors.color1,
        lineHeight: wp(5),
    },
    inputOuterContainer: {
        borderBottomWidth: 1,
        marginTop: hp(0.8),
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.color3,
    },
    input: {
        height: hp(6.3),
        fontSize: Typography.small3,
        width: wp(80),
        color: Colors.color1
    },
    inputIcon: {
        width: wp(4),
        height: hp(3),
        marginHorizontal: wp(3),
    }
})