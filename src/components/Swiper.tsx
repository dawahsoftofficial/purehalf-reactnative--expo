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
          onPress={() => onPress()}
        >
          <AntDesign name="close" size={wp(6)} color={Colors.color1} />
        </Ripple>
        {users?.length ? (
          <Carousel
            ref={swiper}
            data={users}
            loop={false}
            enabled={false}
            width={screenWidth}
            style={Styles.slider}
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
    backgroundColor: Colors.color1,
  },
  closeWrapper: {
    position: 'absolute',
    right: hp(2),
    zIndex: 10,
    backgroundColor: Colors.color2,
    borderRadius: 100,
    padding: wp(2),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.color27,
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
