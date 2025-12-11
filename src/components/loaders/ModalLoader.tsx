import { View, StyleSheet, Modal, ActivityIndicator } from 'react-native'
import React from 'react'
import { Colors, Fonts } from '../../res'
import { hp, Typography, wp } from '../../global'
import Text from '../Text'
import { LanguageKeys } from '../../languages'


const ModalLoader = (props: any) => {
    const {
        visible = false,
        message = LanguageKeys.loading,
        useModalLayout = false
    } = props
    return (
        (visible && !useModalLayout) ?
            <View style={Styles.container}>
                <View style={Styles.innerContainer}>
                    <ActivityIndicator color={Colors.theme} size={wp(5)} />
                    <Text style={Styles.textStyle}>
                        {message}
                    </Text>
                </View>
            </View>
            :
            (visible && useModalLayout) ?
                <Modal
                    visible={true}
                    transparent={true}
                >
                    <View style={{ ...Styles.container, position: 'relative' }}>
                        <View style={Styles.innerContainer}>
                            <ActivityIndicator color={Colors.theme} size={wp(5)} />
                            <Text style={Styles.textStyle}>
                                {message}
                            </Text>
                        </View>
                    </View>
                </Modal>
                : null
    )
}

export default ModalLoader

const Styles = StyleSheet.create({
    container: {
        position: 'absolute',
        height: hp(100),
        width: wp(100),
        zIndex: 1,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.blackRGBA50
    },
    innerContainer: {
        backgroundColor: Colors.color2,
        width: wp(70),
        minHeight: hp(16),
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8
    },
    textStyle: {
        fontSize: Typography.medium,
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_SB,
        includeFontPadding: false,
        alignSelf: 'center',
        marginVertical: hp(2)
    }
})