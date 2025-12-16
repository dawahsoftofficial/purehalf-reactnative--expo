import {
  View,
  StyleSheet,
  StatusBar,
  Dimensions,
  Image,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useRef, useState, useEffect } from 'react';
import { Colors, Fonts } from '../res';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { hp, Typography, wp } from '../global';
import { SwiperFlatList } from 'react-native-swiper-flatlist';
import Ripple from 'react-native-material-ripple';
import { Animation } from '../animations';
import { PrivacyProtectedAlert, RequestSentAlert } from './alerts';
import Text from './Text';
import ModalLoader from './loaders/ModalLoader';
import { ApiServices, useGlobalContext } from '../services';
import { LanguageKeys } from '../languages';

const ImageViewer = (props: any) => {
  const { currentUser } = useGlobalContext();
  const [userData, setUserData] = useState(props?.route?.params?.userData);

  const [images, setImages] = useState([]);

  const [loader, setLoader] = useState({
    visible: true,
    message: LanguageKeys.loading,
  });

  const sliderRef: any = useRef();
  const dotsRef: any = useRef();

  const [privacyProtectedAlertVisible, setPrivacyProtectedAlertVisible] =
    useState(false);
  const [requestSentAlertVisible, setRequestSentAlertVisible] = useState(false);
  const [imageLoader, setImageLoader] = useState(false);
  const [activeIndex, setActiveIndex] = useState({ index: 0, prevIndex: 0 });

  const onBackPress = () => props.navigation.goBack();
  const closePrivacyProtectedAlert = () =>
    setPrivacyProtectedAlertVisible(false);
  const openPrivacyProtectedAlert = () => setPrivacyProtectedAlertVisible(true);
  const closeRequestSentAlert = () => setRequestSentAlertVisible(false);

  const onPPAlertRequestAccessPress = () => {
    setPrivacyProtectedAlertVisible(false);
    setLoader({
      visible: true,
      message: LanguageKeys.sendingRequest,
    });
    ApiServices.privatePhotoAccessRequest(userData?.id)
      .then(() => {
        setRequestSentAlertVisible(true);
        userData.photo_access_action = 0;
        setUserData(userData);
        hideLoader();
      })
      .catch(hideLoader);
  };

  const dotScrollToIndex = (index: any) => {
    dotsRef.current.scrollToIndex({ animated: true, index: index });
  };

  const onImageLoadStart = () => setImageLoader(true);
  const onImageLoadEnd = () => setImageLoader(false);

  const onSliderIndexChange = (data: any) => {
    setActiveIndex(data);
    if (data.index >= 11 || data.index < activeIndex.index) {
      dotScrollToIndex(data.index);
    }
  };

  const onLeftPress = () => {
    sliderRef.current.scrollToIndex({
      animated: true,
      index: activeIndex.index === 0 ? 0 : activeIndex.index - 1,
    });
  };

  const onRightPress = () => {
    sliderRef.current.scrollToIndex({
      animated: true,
      index:
        activeIndex.index === images.length - 1
          ? activeIndex.index
          : activeIndex.index + 1,
    });
  };

  const hideLoader = () => {
    setLoader({
      visible: false,
      message: LanguageKeys.loading,
    });
  };

  const getPhotos = async () => {
    let { media, photo_access_action } = userData;

    const isCurrentUser = userData?.id === currentUser?.id ? true : false;
    if (media) {
      let { public_gallery, private_photo_count, private_gallery } = media;
      let allPhotos: any = [];
      if (public_gallery && public_gallery?.length !== 0) {
        allPhotos = public_gallery;
        setImages(public_gallery);
      }
      if (
        private_photo_count > 0 &&
        (photo_access_action === 0 || photo_access_action === 1) &&
        !isCurrentUser
      ) {
        if (!allPhotos?.includes('privateImage')) {
          allPhotos.push('privateImage');
        }
        setImages(allPhotos);
      }
      if (private_gallery && private_gallery.length !== 0 && isCurrentUser) {
        allPhotos.push(...private_gallery);
        setImages(allPhotos);
      }
      if (photo_access_action === 2 && !isCurrentUser) {
        await ApiServices.viewPrivateMedia(userData?.id)
          .then((res: any) => {
            const { private_gallery } = res;
            if (private_gallery && private_gallery?.length !== 0) {
              allPhotos.push(...private_gallery);
              setImages(allPhotos);
            }
          })
          .catch(hideLoader);
      }
      hideLoader();
    } else {
      hideLoader();
    }
  };

  useEffect(() => {
    getPhotos();
  }, []);

  const renderList = ({ item, index }: any) => {
    return (
      <View style={Styles.itemContainer}>
        {item === 'privateImage' ? (
          <View style={Styles.lockCon}>
            <Ionicons
              name="lock-closed-outline"
              color={Colors.color2}
              size={wp(15)}
            />
            <Text style={Styles.privatePhotoDes}>
              {LanguageKeys.privatePhotoDesTwo}
            </Text>
            <Ripple
              onPress={openPrivacyProtectedAlert}
              disabled={userData?.photo_access_action === 1}
            >
              {userData?.photo_access_action === 1 ? (
                <Text style={Styles.openButton}>
                  {LanguageKeys.privatePhotoAlreadyRequested}
                </Text>
              ) : (
                <Text style={Styles.openButton}>
                  {LanguageKeys.requestAccess}
                </Text>
              )}
            </Ripple>
          </View>
        ) : (
          <Image
            resizeMode="contain"
            source={{ uri: item }}
            style={Styles.itemImage}
            onLoadStart={onImageLoadStart}
            onLoadEnd={onImageLoadEnd}
          />
        )}
        {imageLoader && (
          <View style={Styles.imageLoaderCon}>
            <ActivityIndicator color={Colors.theme} size={wp(10)} />
          </View>
        )}
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={Styles.emptyListCon}>
      <Text style={Styles.emptyListText}>{LanguageKeys.noImagesFound}</Text>
    </View>
  );

  const renderDots = ({ item, index }: any) => {
    return index === activeIndex.index ? (
      <Animation style={Styles.activeDot} animation={'zoomIn'} duration={500} />
    ) : (
      <View style={Styles.inActiveDot} />
    );
  };
  return (
    <SafeAreaView style={Styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.color1} />
      <ModalLoader visible={loader.visible} message={loader.message} />
      <AntDesign
        name="left"
        color={Colors.color2}
        size={wp(5)}
        style={Styles.headerBack}
        onPress={onBackPress}
      />
      <SwiperFlatList
        index={0}
        data={images}
        renderItem={renderList}
        ref={sliderRef}
        contentContainerStyle={Styles.sliderContainer}
        showPagination={false}
        onChangeIndex={onSliderIndexChange}
        ListEmptyComponent={renderEmptyList}
      />
      {images?.length !== 0 && images[0] !== 'privateImage' && (
        <View style={Styles.dotsBtnOuterCon}>
          <Ripple style={Styles.leftRightBtnCon} onPress={onLeftPress}>
            <AntDesign name="left" color={Colors.color2} size={wp(8)} />
          </Ripple>
          <View>
            <FlatList
              ref={dotsRef}
              data={images}
              renderItem={renderDots}
              horizontal
              style={Styles.dotsContainer}
              contentContainerStyle={{ alignItems: 'center' }}
            />
          </View>
          <Ripple style={Styles.leftRightBtnCon} onPress={onRightPress}>
            <AntDesign name="right" color={Colors.color2} size={wp(8)} />
          </Ripple>
        </View>
      )}
      <PrivacyProtectedAlert
        visible={privacyProtectedAlertVisible}
        onClose={closePrivacyProtectedAlert}
        onPress={onPPAlertRequestAccessPress}
      />
      <RequestSentAlert
        visible={requestSentAlertVisible}
        onClose={closeRequestSentAlert}
        onPress={closeRequestSentAlert}
      />
    </SafeAreaView>
  );
};

export default ImageViewer;

const { width } = Dimensions.get('window');
const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.color1,
  },
  headerBack: {
    marginTop: hp(6),
    marginHorizontal: wp(2),
    paddingHorizontal: wp(2),
    alignSelf: 'flex-start',
  },
  sliderContainer: {
    height: hp(70),
    marginTop: hp(2),
  },
  itemContainer: {
    width: wp(100),
    height: hp(70),
  },
  itemImage: {
    width: wp(100),
    height: hp(70),
  },
  lockCon: {
    width: wp(100),
    height: hp(70),
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLoaderCon: {
    width: wp(100),
    height: hp(70),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  dotsBtnOuterCon: {
    width: wp(100),
    height: hp(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftRightBtnCon: {
    width: wp(15),
    height: hp(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    alignSelf: 'center',
    maxWidth: wp(61),
    paddingLeft: wp(1),
    height: hp(10),
    overflow: 'hidden',
    borderWidth: 0,
    borderColor: 'red',
  },
  activeDot: {
    width: width * 0.04,
    height: width * 1 * 0.04,
    borderRadius: (width * 1 * 0.04) / 2,
    backgroundColor: Colors.color2,
    marginRight: wp(3),
  },
  inActiveDot: {
    width: width * 0.025,
    height: width * 1 * 0.025,
    borderRadius: (width * 1 * 0.025) / 2,
    backgroundColor: Colors.color2,
    marginRight: wp(3),
  },
  openButton: {
    color: Colors.color2,
    marginVertical: hp(2),
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium,
    lineHeight: wp(5),
  },
  emptyListCon: {
    flex: 1,
    width: wp(100),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyListText: {
    color: Colors.color2,
    alignSelf: 'center',
    textAlign: 'center',
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.medium,
  },
  privatePhotoDes: {
    color: Colors.color2,
    alignSelf: 'center',
    textAlign: 'center',
    marginHorizontal: wp(20),
    marginTop: hp(2),
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
  },
});
