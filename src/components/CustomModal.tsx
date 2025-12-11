import { View, Text, StyleSheet, StatusBar } from 'react-native'
import React from 'react'
import { Colors } from '../res'
import { Animation } from '../animations'
import { hp, wp } from '../global'
import { useGlobalContext } from '../services'

const CustomModal = () => {
    const { customModal } = useGlobalContext()
    return (
        customModal?.visible &&
        <Animation style={Styles.container}>
            <StatusBar backgroundColor={Colors.blackRGBA50} barStyle='light-content' />
            {customModal.data()}
        </Animation>
    )
}

export default CustomModal

const Styles = StyleSheet.create({
    container: {
        flex: 1,
        height: hp(100),
        width: wp(100),
        backgroundColor: Colors.blackRGBA50,
        position: "absolute",
        zIndex: 1
    }
})