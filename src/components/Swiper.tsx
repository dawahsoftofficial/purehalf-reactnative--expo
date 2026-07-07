import { useFocusEffect } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import { Dimensions, Modal, StyleSheet } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Carousel from 'react-native-reanimated-carousel';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { hp, wp } from '../global';
import { LanguageKeys } from '../languages';
import { Colors } from '../res';
import { ApiServices, flashSuccessMessage } from '../services';
import SliderEntry from './SliderEntry';

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
      onPress={onPress}
      swipeNext={swipeNext}
      onLikePress={onLikePress}
      onPassPress={onPassPress}
      even={(index + 1) % 2 === 0}
    />
  );
};

const { width: screenWidth } = Dimensions.get('window');

const SwiperComponent = ({
  onPress,
}: {
  onPress: (value?: boolean) => void;
}) => {
  const { top, bottom } = useSafeAreaInsets();
  const swiper: any = useRef(null);
  const [users, setUsers] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      ApiServices.getRecommendedUser().then((res: any) => {
        setUsers([...res, { id: null }]);
        setLoading(false);
        setCurrentIndex(0);
      });
    }, [])
  );

  const swipeNext = () => {
    if (currentIndex < users.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      swiper?.current?.scrollTo({ index: nextIndex, animated: true });
    }
  };

  const onLikePress = (id: number) => {
    const params = {
      type: 2,
      action_user_id: id,
      allow_photo_request: 0,
    };
    ApiServices.interactionAction(params).then(() => {
      flashSuccessMessage(LanguageKeys.liked);
      swipeNext();
    });
  };

  const onPassPress = (id: number) => {
    const params = {
      top_pics: JSON.stringify([id]),
    };
    ApiServices.topPicks(params)
      .then(() => {
        swipeNext();
      })
      .catch();
  };

  if (loading) return null;

  return (
    <Modal visible={true} transparent={true}>
      <SafeAreaView style={Styles.container}>
        <Ripple
          style={[Styles.closeWrapper, { top: top + hp(2) }]}
          rippleColor={Colors.surface}
          rippleContainerBorderRadius={wp(5.5)}
          onPress={() => onPress()}
        >
          <AntDesign name="close" size={wp(5)} color={Colors.surface} />
        </Ripple>
        {users?.length ? (
          <Carousel
            ref={swiper}
            data={users}
            loop={false}
            enabled={false}
            width={screenWidth}
            style={Styles.slider}
            scrollAnimationDuration={480}
            withAnimation={{
              type: 'spring',
              config: { damping: 20, stiffness: 120, mass: 0.6 },
            }}
            height={Dimensions.get('window').height - bottom - top}
            onSnapToItem={(index) => setCurrentIndex(index)}
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
          />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
};

export default SwiperComponent;

const Styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.ink,
  },
  closeWrapper: {
    position: 'absolute',
    right: wp(4),
    zIndex: 10,
    width: wp(11),
    height: wp(11),
    borderRadius: wp(5.5),
    backgroundColor: Colors.blackRGBA38,
    borderWidth: 1,
    borderColor: Colors.whiteRGBA30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.blackRGBA50,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
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
