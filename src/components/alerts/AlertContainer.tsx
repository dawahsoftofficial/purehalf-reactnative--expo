import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { Colors } from '../../res'
import { hp, wp } from '../../global'
import AntDesign from 'react-native-vector-icons/AntDesign'
import { Animation } from '../../animations'

const AlertContainer = (props: any) => {
    const {
        visible = false,
        onClose = () => null
    } = props
    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType='none'
        >
            <TouchableOpacity
                activeOpacity={1}
                // onPress={onClose}
                style={Styles.container}
            >
                <Animation style={Styles.contentCon}
                    animation={"zoomIn"}
                    duration={500}
                >
                    <AntDesign
                        name='close'
                        size={wp(7)}
                        color={Colors.color1}
                        style={Styles.closeIcon}
                        onPress={onClose}
                    />
                    {props.children}
                </Animation>
            </TouchableOpacity>
        </Modal>
    )
}

export default AlertContainer

const Styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.blackRGBA50,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    contentCon: {
        alignSelf: 'center',
        width: wp(90),
        backgroundColor: Colors.color2,
        paddingVertical: hp(1),
        borderRadius: 8,
    },
    closeIcon: {
        alignSelf: 'flex-end',
        marginHorizontal: wp(1),
        paddingHorizontal: wp(2),
    }
})