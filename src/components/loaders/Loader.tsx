import { View, StyleSheet, ActivityIndicator } from 'react-native'
import React from 'react'
import { Colors } from '../../res'

const Loader = (props: any) => {
    const {
        containerStyle
    } = props
    return (
        <View style={[Styles.container, containerStyle]}>
            <ActivityIndicator size={'small'} color={Colors.theme} />
        </View>
    )
}

export default Loader

const Styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
})