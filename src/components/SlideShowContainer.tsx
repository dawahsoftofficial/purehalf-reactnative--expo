import React, { useMemo } from 'react';
import { Dimensions, Image, StatusBar, StyleSheet, View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from '../components';
import { hp, wp } from '../global';
import { Colors, Images } from '../res';

type SlideShowContainerProps = {
  disabled?: boolean;
  children?: React.ReactNode;
};

type SlideImageItem = typeof Images.slide1;

function SlideShowContainer({
  disabled = false,
  children,
}: SlideShowContainerProps) {
  const { width, height } = useMemo(() => Dimensions.get('window'), []);

  const images = useMemo<SlideImageItem[]>(
    () => [Images.slide1, Images.slide2, Images.slide3],
    []
  );

  function renderSliderImage({ item }: { item: SlideImageItem }) {
    return (
      <View>
        <Image source={item} resizeMode="cover" style={Styles.image} />
        <LinearGradient
          style={Styles.imageOuterView}
          colors={[Colors.blackRGBA70, Colors.blackRGBA38]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
        />
      </View>
    );
  }

  if (disabled) {
    return <View style={Styles.disabledContainer}>{children}</View>;
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={Styles.container}>
      <StatusBar backgroundColor={Colors.color2} barStyle="light-content" />
      <Carousel
        loop
        width={width}
        height={height}
        autoPlay={false}
        data={images}
        scrollAnimationDuration={10000}
        renderItem={renderSliderImage}
      />
      <View style={Styles.contentContainer}>{children}</View>
    </SafeAreaView>
  );
}

export default SlideShowContainer;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
  disabledContainer: {
    flex: 1,
  },
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
  contentContainer: {
    position: 'absolute',
    height: hp(100),
    width: wp(100),
    zIndex: 1,
  },
});
