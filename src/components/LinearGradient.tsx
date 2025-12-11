import React from 'react'
import { Colors } from '../res';

import LinearGradient from 'react-native-linear-gradient';

const CustomLinearGradient = (props: any) => {
    return (
        <LinearGradient colors={[Colors.theme, Colors.theme]}
            {...props}>
            {props.children}
        </LinearGradient>
    )
}

export default CustomLinearGradient