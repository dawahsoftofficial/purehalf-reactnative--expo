import { View, StyleSheet, StatusBar } from 'react-native'
import React, { } from 'react'
import { Colors } from '../res'
import { hp } from '../global'
import DeviceInfo from 'react-native-device-info';
import { isIOS } from '../services';

const hasNotch = DeviceInfo.hasNotch();
const Container = (props: any) => {
    const {
        style = null,
        barStyle = 'dark-content',
        barBg = Colors.color2
    } = props

    return (
        <View style={Styles.container}>
            <View style={[Styles.container, style]}>
                <StatusBar backgroundColor={barBg} barStyle={barStyle} translucent={false} />
                {props.children}
            </View>
        </View>
    )
}

export default Container

const Styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.color2,
        paddingTop: hasNotch ? hp(2.5) : !isIOS ? hp(0.5) : hp(1.7)
    }
})