import React from 'react'
import * as Animatable from 'react-native-animatable';
import { StyleSheet } from 'react-native'

const Animation = (props: any) => {
    const {
        animation = 'fadeInUp',
        duration = 400,
        style = null
    } = props

    const fromValues = {
        opacity: 0,
        backgroundColor: 'transparent'
    };

    const toValues = {
        opacity: 1,
        backgroundColor: 'rgba(0, 0, 0, 0)'
    };

    return (
        <Animatable.View
            animation={animation}
            useNativeDriver={true}
            duration={duration}
            style={{ ...Style.container, ...style }}
            easing={'ease-out'}
        >
            {props.children}
        </Animatable.View>
    )
}

export default Animation

const Style = StyleSheet.create({
    container: {}
})


