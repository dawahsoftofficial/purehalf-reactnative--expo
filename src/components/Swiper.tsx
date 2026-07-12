import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, Dimensions, Modal, StyleSheet, Text } from 'react-native';
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
import {
  ApiServices,
  flashErrorMessage,
  flashSuccessMessage,
  TesterApi,
  useGlobalContext,
} from '../services';
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
  const { currentUser } = useGlobalContext();

  const loadRecommendations = useCallback(() => {
    setLoading(true);
    return ApiServices.getRecommendedUser()
      .then((res: any) => {
        setUsers([...(Array.isArray(res) ? res : []), { id: null }]);
        setCurrentIndex(0);
        swiper.current?.scrollTo({ index: 0, animated: false });
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadRecommendations();
    }, [loadRecommendations])
  );

  const resetDeck = () =>
    Alert.alert(
      'Reset recommendation deck?',
      'This clears your stored daily pass history and reloads candidates.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await TesterApi.resetSelfData('daily_recommendations');
              await loadRecommendations();
              flashSuccessMessage('Recommendation deck reset.');
            } catch (error: any) {
              flashErrorMessage(
                error?.response?.data?.message ||
                  'Could not reset recommendations.'
              );
            }
          },
        },
      ]
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
        {currentUser?.tester_mode_enabled === true &&
          currentUser?.is_tester && (
            <Ripple
              style={[Styles.resetWrapper, { top: hp(1) + 12 }]}
              rippleColor={Colors.surface}
              rippleContainerBorderRadius={wp(5.5)}
              onPress={resetDeck}
            >
              <AntDesign name="reload1" size={wp(4.4)} color={Colors.surface} />
              <Text style={Styles.resetText}>Reset deck</Text>
            </Ripple>
          )}
        <Ripple
          style={[Styles.closeWrapper, { top: hp(1) + 12 }]}
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
  resetWrapper: {
    position: 'absolute',
    left: wp(4),
    zIndex: 10,
    height: wp(11),
    borderRadius: wp(5.5),
    paddingHorizontal: wp(3),
    backgroundColor: Colors.blackRGBA38,
    borderWidth: 1,
    borderColor: Colors.whiteRGBA30,
    flexDirection: 'row',
    gap: wp(1.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: { color: Colors.surface, fontWeight: '700', fontSize: wp(3) },
  slider: {
    // marginTop: 50,
    overflow: 'visible',
    padding: 0,
  },
  sliderContentContainer: {
    paddingVertical: 0,
  },
});
