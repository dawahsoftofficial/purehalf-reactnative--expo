import { useFocusEffect } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Carousel from 'react-native-snap-carousel';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { wp } from '../global';
import { LanguageKeys } from '../languages';
import { Colors } from '../res';
import { ApiServices, flashSuccessMessage, isIOS } from '../services';
import SliderEntry, { itemWidth, sliderWidth } from './SliderEntry';

const _renderItem = ({
  item,
  index,
  swipeNext,
  onLikePress,
  onPassPress,
  onPress,
}: any) => {
  return (
    <SliderEntry
      data={item}
      even={(index + 1) % 2 === 0}
      swipeNext={swipeNext}
      onLikePress={onLikePress}
      onPassPress={onPassPress}
      onPress={onPress}
    />
  );
};

const SwiperComponent = ({
  onPress,
}: {
  onPress: (value?: boolean) => void;
}) => {
  const swiper: any = useRef(null);
  const [users, setUsers] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      ApiServices.getRecommendedUser().then((res: any) => {
        setUsers([...res, { id: null }]);
        setLoading(false);
      });
    }, [])
  );

  const swipeNext = () => {
    swiper?.current?.snapToNext();
  };

  const onLikePress = (id: number) => {
    const params = {
      type: 2,
      action_user_id: id,
      allow_photo_request: 0,
    };
    ApiServices.interactionAction(params).then(() => {
      flashSuccessMessage(LanguageKeys.liked);
      swiper?.current?.snapToNext();
    });
  };

  const onPassPress = (id: number) => {
    const params = {
      top_pics: JSON.stringify([id]),
    };
    ApiServices.topPicks(params)
      .then((res) => {
        swiper?.current?.snapToNext();
      })
      .catch();
  };

  if (loading) return null;

  return (
    <Modal visible={true} transparent={true}>
      <View style={Styles.container}>
        <Ripple style={Styles.closeWrapper} onPress={() => onPress()}>
          <AntDesign name="close" size={wp(8)} color={Colors.color2} />
        </Ripple>
        {users?.length ? (
          <Carousel
            ref={swiper}
            data={users}
            renderItem={({ item, index }) =>
              _renderItem({
                item,
                index,
                swipeNext,
                onLikePress,
                onPassPress,
                onPress,
              })
            }
            sliderWidth={sliderWidth}
            itemWidth={itemWidth}
            hasParallaxImages={true}
            firstItem={0}
            inactiveSlideScale={0.94}
            inactiveSlideOpacity={0.7}
            containerCustomStyle={Styles.slider}
            contentContainerCustomStyle={Styles.sliderContentContainer}
            autoplay={false}
            scrollEnabled={false}
          />
        ) : null}
      </View>
    </Modal>
  );
};

export default SwiperComponent;

const Styles = StyleSheet.create({
  container: {
    position: 'relative',
    // height: hp(200),
    // width: wp(100),
    zIndex: 1,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: Colors.blackRGBA90,
    // backgroundColor: "red",
  },
  closeWrapper: {
    position: 'absolute',
    // alignSelf: 'center',
    top: isIOS ? 40 : 18,
    right: 15,
    zIndex: 9,

    // borderRadius: 30,
  },
  slider: {
    // marginTop: 50,
    overflow: 'visible',
    padding: 0,
  },
  sliderContentContainer: {
    paddingVertical: 0,
  },
});
