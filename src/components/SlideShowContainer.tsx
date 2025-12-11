
import { View, Dimensions, Image, StyleSheet, StatusBar } from 'react-native'
import React, { useState } from 'react'
import Carousel from 'react-native-reanimated-carousel';
import { Colors, Images } from '../res';
import { hp, wp } from '../global';
import { LinearGradient } from '../components';


const SlideShowContainer = (props: any) => {
    const [activeImage, setActiveImage] = useState(Images.slide1)
    const {
        disabled = false
    } = props
    const { width, height } = Dimensions.get('window');
    const images = [
        Images.slide1,
        Images.slide2,
        Images.slide3
    ]

    const RenderSliderImages = ({ item }: any) => {
        return (
            <View>
                <Image
                    source={item}
                    resizeMode='cover'
                    style={Styles.image}
                />
                <LinearGradient
                    style={Styles.imageOuterView}
                    colors={[Colors.blackRGBA25, Colors.blackRGBA38]}
                />
            </View>
        )
    }


    return (
        disabled ?
            <View style={{ flex: 1 }}>
                {props?.children}
            </View>
            :
            <View style={{ flex: 1, borderBottomWidth: 1, borderRightWidth: 1 }}>
                <StatusBar translucent backgroundColor={'transparent'} barStyle='light-content' />
                <Carousel
                    loop
                    width={width}
                    height={height}
                    autoPlay={false}
                    data={images}
                    scrollAnimationDuration={10000}
                    renderItem={RenderSliderImages}
                    panGestureHandlerProps={{ enableTrackpadTwoFingerGesture: false }}
                />
                <View style={Styles.container}>
                    {props.children}
                </View>
            </View>
    )
}

export default SlideShowContainer

const Styles = StyleSheet.create({
    imageOuterView: {
        height: hp(100),
        width: wp(100),
        position: 'absolute',
        zIndex: 1
    },
    image: {
        width: wp(100),
        height: hp(100)
    },
    container: {
        position: 'absolute',
        height: hp(100),
        width: wp(100),
        zIndex: 1
    }
})