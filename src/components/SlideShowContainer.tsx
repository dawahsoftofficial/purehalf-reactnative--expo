import React, { useState } from 'react';
import { Dimensions, Image, StatusBar, StyleSheet, View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

import { LinearGradient } from '../components';
import { hp, wp } from '../global';
import { Colors, Images } from '../res';

const SlideShowContainer = (props: any) => {
  const [activeImage, setActiveImage] = useState(Images.slide1);
  const { disabled = false } = props;
  const { width, height } = Dimensions.get('window');
  const images = [Images.slide1, Images.slide2, Images.slide3];

  const RenderSliderImages = ({ item }: any) => {
    return (
      <View>
        <Image source={item} resizeMode="cover" style={Styles.image} />
        <LinearGradient
          style={Styles.imageOuterView}
          colors={[Colors.blackRGBA25, Colors.blackRGBA38]}
        />
      </View>
    );
  };

  return disabled ? (
    <View style={{ flex: 1 }}>{props?.children}</View>
  ) : (
    <View style={{ flex: 1, borderBottomWidth: 1, borderRightWidth: 1 }}>
      <StatusBar
        translucent
        backgroundColor={'transparent'}
        barStyle="light-content"
      />
      <Carousel
        loop
        width={width}
        height={height}
        autoPlay={false}
        data={images}
        scrollAnimationDuration={10000}
        renderItem={RenderSliderImages}
      />
      <View style={Styles.container}>{props.children}</View>
    </View>
  );
};

export default SlideShowContainer;

const Styles = StyleSheet.create({
  imageOuterView: {
    height: hp(100),
    width: wp(100),
    position: 'absolute',
    zIndex: 1,
  },
  image: {
    width: wp(100),
    height: hp(100),
  },
  container: {
    position: 'absolute',
    height: hp(100),
    width: wp(100),
    zIndex: 1,
  },
});
