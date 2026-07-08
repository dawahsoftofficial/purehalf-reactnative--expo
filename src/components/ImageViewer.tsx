import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ripple from 'react-native-material-ripple';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SwiperFlatList } from 'react-native-swiper-flatlist';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { hp, Typography, wp } from '../global';
import { CheckRtl, LanguageKeys } from '../languages';
import { Colors, Fonts } from '../res';
import { ApiServices, useGlobalContext } from '../services';
import { PrivacyProtectedAlert, RequestSentAlert } from './alerts';
import {
  buildGalleryItems,
  type GalleryItem,
  type GalleryMedia,
  type PhotoAccessAction,
} from './image-viewer/gallery-items';
import ModalLoader from './loaders/ModalLoader';
import Text from './Text';

type ImageViewerUser = {
  first_name?: string | null;
  full_name?: string | null;
  id?: number | string;
  media?: GalleryMedia | null;
  photo_access_action?: PhotoAccessAction;
};

type ImageViewerProps = {
  navigation: {
    goBack: () => void;
  };
  route?: {
    params?: {
      userData?: ImageViewerUser;
    };
  };
};

type PrivateMediaResponse = {
  private_gallery?: string[] | null;
};

type SliderRef = {
  getCurrentIndex: () => number;
  getPrevIndex: () => number;
  goToFirstIndex: () => void;
  goToLastIndex: () => void;
  scrollToIndex: (params: { animated?: boolean; index: number }) => void;
};

const ImageViewer = (props: ImageViewerProps) => {
  const { currentUser } = useGlobalContext();
  const [userData, setUserData] = useState(props?.route?.params?.userData);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loader, setLoader] = useState({
    visible: true,
    message: LanguageKeys.loading,
  });
  const [privacyProtectedAlertVisible, setPrivacyProtectedAlertVisible] =
    useState(false);
  const [requestSentAlertVisible, setRequestSentAlertVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadingImageIds, setLoadingImageIds] = useState<
    Record<string, boolean>
  >({});
  const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>(
    {}
  );

  const sliderRef = useRef<SliderRef>(null);
  const thumbnailRef = useRef<FlatList<GalleryItem>>(null);
  const rtl = CheckRtl();

  const activeItem = galleryItems[activeIndex];
  const currentPosition = galleryItems.length === 0 ? 0 : activeIndex + 1;
  const userFirstName =
    userData?.first_name || userData?.full_name?.split(' ')?.[0] || '';
  const galleryTitle = userFirstName
    ? `${userFirstName}'s photos`
    : LanguageKeys.photosAndVideos;
  const galleryContext =
    activeItem?.type === 'locked-private'
      ? LanguageKeys.privatePhotoDes
      : LanguageKeys.photosAndVideos;

  const onBackPress = useCallback(
    () => props.navigation.goBack(),
    [props.navigation]
  );
  const closePrivacyProtectedAlert = useCallback(
    () => setPrivacyProtectedAlertVisible(false),
    []
  );
  const openPrivacyProtectedAlert = useCallback(
    () => setPrivacyProtectedAlertVisible(true),
    []
  );
  const closeRequestSentAlert = useCallback(
    () => setRequestSentAlertVisible(false),
    []
  );

  const hideLoader = useCallback(() => {
    setLoader({
      visible: false,
      message: LanguageKeys.loading,
    });
  }, []);

  const scrollThumbnailsToIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= galleryItems.length) {
        return;
      }

      thumbnailRef.current?.scrollToIndex({
        animated: true,
        index,
        viewPosition: 0.5,
      });
    },
    [galleryItems.length]
  );

  const getPhotos = useCallback(async () => {
    const media = userData?.media;
    const photoAccessAction = userData?.photo_access_action;
    const isCurrentUser = userData?.id === currentUser?.id;

    if (!media) {
      setGalleryItems([]);
      setActiveIndex(0);
      hideLoader();
      return;
    }

    if (photoAccessAction === 2 && !isCurrentUser) {
      try {
        const res = (await ApiServices.viewPrivateMedia(
          userData?.id
        )) as PrivateMediaResponse;
        setGalleryItems(
          buildGalleryItems({
            grantedPrivateGallery: res?.private_gallery,
            isCurrentUser,
            media,
            photoAccessAction,
          })
        );
      } catch {
        setGalleryItems(
          buildGalleryItems({
            isCurrentUser,
            media,
            photoAccessAction,
          })
        );
      } finally {
        setActiveIndex(0);
        hideLoader();
      }
      return;
    }

    setGalleryItems(
      buildGalleryItems({
        isCurrentUser,
        media,
        photoAccessAction,
      })
    );
    setActiveIndex(0);
    hideLoader();
  }, [currentUser?.id, hideLoader, userData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      getPhotos();
    }, 0);

    return () => clearTimeout(timer);
  }, [getPhotos]);

  const onPPAlertRequestAccessPress = useCallback(() => {
    setPrivacyProtectedAlertVisible(false);
    setLoader({
      visible: true,
      message: LanguageKeys.sendingRequest,
    });

    ApiServices.privatePhotoAccessRequest(userData?.id)
      .then(() => {
        setRequestSentAlertVisible(true);
        setUserData((previous) =>
          previous
            ? {
                ...previous,
                photo_access_action: 1,
              }
            : previous
        );
        hideLoader();
      })
      .catch(hideLoader);
  }, [hideLoader, userData?.id]);

  const setImageLoading = useCallback((id: string, isLoading: boolean) => {
    setLoadingImageIds((previous) => ({
      ...previous,
      [id]: isLoading,
    }));
  }, []);

  const setImageFailed = useCallback(
    (id: string) => {
      setFailedImageIds((previous) => ({
        ...previous,
        [id]: true,
      }));
      setImageLoading(id, false);
    },
    [setImageLoading]
  );

  const onSliderIndexChange = useCallback(
    ({ index }: { index: number; prevIndex: number }) => {
      if (index < 0 || index >= galleryItems.length) {
        return;
      }

      setActiveIndex(index);
      scrollThumbnailsToIndex(index);
    },
    [galleryItems.length, scrollThumbnailsToIndex]
  );

  const onThumbnailPress = useCallback(
    (index: number) => {
      if (index < 0 || index >= galleryItems.length) {
        return;
      }

      setActiveIndex(index);
      sliderRef.current?.scrollToIndex({ animated: true, index });
      scrollThumbnailsToIndex(index);
    },
    [galleryItems.length, scrollThumbnailsToIndex]
  );

  const renderImageFallback = () => (
    <View style={Styles.imageFallback}>
      <Ionicons name="image-outline" color={Colors.whiteRGBA90} size={wp(13)} />
      <Text style={Styles.imageFallbackText}>{LanguageKeys.tryAgain}</Text>
    </View>
  );

  const renderLockedPrivatePanel = () => {
    const alreadyRequested = userData?.photo_access_action === 1;

    return (
      <View style={Styles.lockedSlide}>
        <View style={Styles.lockedIconWrap}>
          <Ionicons
            name="lock-closed-outline"
            color={Colors.color2}
            size={wp(10)}
          />
        </View>
        <Text style={Styles.lockedTitle}>{LanguageKeys.privacyProtected}</Text>
        <Text style={Styles.lockedDescription}>
          {LanguageKeys.privatePhotoDesTwo}
        </Text>
        <Ripple
          style={[
            Styles.requestAccessButton,
            alreadyRequested && Styles.requestAccessButtonDisabled,
          ]}
          onPress={openPrivacyProtectedAlert}
          disabled={alreadyRequested}
          rippleColor={Colors.primaryLite}
        >
          <Text
            style={[
              Styles.requestAccessText,
              alreadyRequested && Styles.requestAccessTextDisabled,
            ]}
            numberOfLines={1}
          >
            {alreadyRequested
              ? LanguageKeys.privatePhotoAlreadyRequested
              : LanguageKeys.requestAccess}
          </Text>
        </Ripple>
      </View>
    );
  };

  const renderSlide = ({ item }: { item: GalleryItem }) => {
    if (item.type === 'locked-private') {
      return (
        <View style={Styles.slide}>
          <LinearGradient
            colors={[Colors.ink, Colors.theme, Colors.color1]}
            style={StyleSheet.absoluteFill}
          />
          {renderLockedPrivatePanel()}
        </View>
      );
    }

    const isLoading = loadingImageIds[item.id];
    const hasFailed = failedImageIds[item.id];

    return (
      <View style={Styles.slide}>
        {hasFailed ? (
          renderImageFallback()
        ) : (
          <Image
            resizeMode="cover"
            source={{ uri: item.uri }}
            style={Styles.slideImage}
            onLoadEnd={() => setImageLoading(item.id, false)}
            onLoadStart={() => setImageLoading(item.id, true)}
            onError={() => setImageFailed(item.id)}
          />
        )}
        <LinearGradient
          colors={[
            Colors.blackRGBA70,
            Colors.blackRGBA0,
            Colors.blackRGBA25,
            Colors.blackRGBA80,
          ]}
          locations={[0, 0.32, 0.62, 1]}
          style={StyleSheet.absoluteFill}
        />
        {isLoading && !hasFailed && (
          <View style={Styles.imageLoaderCon}>
            <ActivityIndicator color={Colors.color2} size={wp(8)} />
          </View>
        )}
      </View>
    );
  };

  const renderTopBar = () => (
    <View style={Styles.topOverlay}>
      <Ripple
        style={Styles.iconButton}
        onPress={onBackPress}
        hitSlop={12}
        rippleColor={Colors.whiteRGBA30}
      >
        <AntDesign
          name={rtl ? 'arrowright' : 'arrowleft'}
          color={Colors.color2}
          size={wp(6)}
        />
      </Ripple>
      <View style={Styles.titleWrap}>
        <Text style={Styles.viewerTitle} numberOfLines={1}>
          {galleryTitle}
        </Text>
        <Text style={Styles.viewerSubtitle} numberOfLines={1}>
          {galleryContext}
        </Text>
      </View>
      <View style={Styles.countPill}>
        <Text style={Styles.countText}>
          {galleryItems.length
            ? `${currentPosition} / ${galleryItems.length}`
            : '0 / 0'}
        </Text>
      </View>
    </View>
  );

  const renderThumbnail = ({
    index,
    item,
  }: {
    index: number;
    item: GalleryItem;
  }) => {
    const isActive = index === activeIndex;
    const thumbnailStyle = [
      Styles.thumbnailButton,
      isActive && Styles.thumbnailButtonActive,
    ];

    return (
      <Ripple
        style={thumbnailStyle}
        onPress={() => onThumbnailPress(index)}
        rippleColor={Colors.whiteRGBA30}
      >
        {item.type === 'locked-private' ? (
          <View style={Styles.lockedThumbnail}>
            <Ionicons
              name="lock-closed-outline"
              color={Colors.color2}
              size={wp(4.8)}
            />
          </View>
        ) : failedImageIds[item.id] ? (
          <View style={Styles.lockedThumbnail}>
            <Ionicons
              name="image-outline"
              color={Colors.whiteRGBA90}
              size={wp(4.8)}
            />
          </View>
        ) : (
          <Image
            resizeMode="cover"
            source={{ uri: item.uri }}
            style={Styles.thumbnailImage}
          />
        )}
      </Ripple>
    );
  };

  const renderThumbnailRail = () => {
    if (!galleryItems.length) {
      return null;
    }

    return (
      <View style={Styles.bottomOverlay}>
        <FlatList
          ref={thumbnailRef}
          data={galleryItems}
          horizontal
          keyExtractor={(item) => item.id}
          renderItem={renderThumbnail}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={Styles.thumbnailList}
          onScrollToIndexFailed={({ index }) => {
            setTimeout(() => scrollThumbnailsToIndex(index), 100);
          }}
        />
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={Styles.emptyListCon}>
      <Ripple
        style={[Styles.iconButton, Styles.emptyBackButton]}
        onPress={onBackPress}
        rippleColor={Colors.whiteRGBA30}
      >
        <AntDesign
          name={rtl ? 'arrowright' : 'arrowleft'}
          color={Colors.color2}
          size={wp(6)}
        />
      </Ripple>
      <View style={Styles.emptyIconWrap}>
        <Ionicons
          name="images-outline"
          color={Colors.primaryLite}
          size={wp(16)}
        />
      </View>
      <Text style={Styles.emptyListText}>{LanguageKeys.noImagesFound}</Text>
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={Styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.color1} />
      <ModalLoader visible={loader.visible} message={loader.message} />
      {galleryItems.length ? (
        <>
          <SwiperFlatList
            index={0}
            data={galleryItems}
            renderItem={renderSlide}
            ref={sliderRef}
            contentContainerStyle={Styles.sliderContainer}
            showPagination={false}
            onChangeIndex={onSliderIndexChange}
          />
          {renderTopBar()}
          {renderThumbnailRail()}
        </>
      ) : (
        renderEmptyList()
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

const Styles = StyleSheet.create({
  bottomOverlay: {
    backgroundColor: Colors.blackRGBA50,
    borderColor: Colors.whiteRGBA18,
    borderRadius: wp(6),
    borderWidth: 1,
    bottom: hp(2),
    left: wp(3),
    paddingVertical: hp(1.2),
    position: 'absolute',
    right: wp(3),
  },
  container: {
    backgroundColor: Colors.color1,
    flex: 1,
  },
  countPill: {
    alignItems: 'center',
    backgroundColor: Colors.blackRGBA50,
    borderColor: Colors.whiteRGBA18,
    borderRadius: wp(5),
    borderWidth: 1,
    height: wp(10.5),
    justifyContent: 'center',
    minWidth: wp(15),
    paddingHorizontal: wp(3),
  },
  countText: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small,
  },
  emptyBackButton: {
    left: wp(4),
    position: 'absolute',
    top: hp(2),
  },
  emptyIconWrap: {
    alignItems: 'center',
    backgroundColor: Colors.whiteRGBA10,
    borderColor: Colors.whiteRGBA18,
    borderRadius: wp(12),
    borderWidth: 1,
    height: wp(24),
    justifyContent: 'center',
    marginBottom: hp(2),
    width: wp(24),
  },
  emptyListCon: {
    alignItems: 'center',
    backgroundColor: Colors.color1,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: wp(10),
  },
  emptyListText: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium,
    textAlign: 'center',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: Colors.whiteRGBA18,
    borderColor: Colors.whiteRGBA18,
    borderRadius: wp(5.5),
    borderWidth: 1,
    height: wp(11),
    justifyContent: 'center',
    overflow: 'hidden',
    width: wp(11),
  },
  imageFallback: {
    alignItems: 'center',
    backgroundColor: Colors.ink,
    flex: 1,
    justifyContent: 'center',
    width: wp(100),
  },
  imageFallbackText: {
    color: Colors.whiteRGBA90,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small2,
    marginTop: hp(1),
  },
  imageLoaderCon: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedDescription: {
    color: Colors.whiteRGBA90,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    lineHeight: wp(5),
    marginTop: hp(1.2),
    paddingHorizontal: wp(8),
    textAlign: 'center',
  },
  lockedIconWrap: {
    alignItems: 'center',
    backgroundColor: Colors.whiteRGBA18,
    borderColor: Colors.whiteRGBA30,
    borderRadius: wp(13),
    borderWidth: 1,
    height: wp(26),
    justifyContent: 'center',
    width: wp(26),
  },
  lockedSlide: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: wp(8),
    width: wp(100),
  },
  lockedThumbnail: {
    alignItems: 'center',
    backgroundColor: Colors.themeRGBA50,
    flex: 1,
    justifyContent: 'center',
  },
  lockedTitle: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium,
    marginTop: hp(2),
    textAlign: 'center',
  },
  requestAccessButton: {
    alignItems: 'center',
    backgroundColor: Colors.color2,
    borderRadius: wp(6),
    justifyContent: 'center',
    marginTop: hp(2.4),
    minHeight: hp(5.4),
    paddingHorizontal: wp(6),
  },
  requestAccessButtonDisabled: {
    backgroundColor: Colors.whiteRGBA18,
    borderColor: Colors.whiteRGBA30,
    borderWidth: 1,
  },
  requestAccessText: {
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small2,
    maxWidth: wp(68),
  },
  requestAccessTextDisabled: {
    color: Colors.color2,
  },
  slide: {
    backgroundColor: Colors.color1,
    flex: 1,
    height: '100%',
    width: wp(100),
  },
  slideImage: {
    height: '100%',
    width: wp(100),
  },
  sliderContainer: {
    flexGrow: 1,
  },
  thumbnailButton: {
    backgroundColor: Colors.blackRGBA50,
    borderColor: Colors.whiteRGBA18,
    borderRadius: wp(3.5),
    borderWidth: 1,
    height: hp(8),
    marginRight: wp(2),
    overflow: 'hidden',
    width: wp(14),
  },
  thumbnailButtonActive: {
    borderColor: Colors.color2,
    borderWidth: 2,
  },
  thumbnailImage: {
    height: '100%',
    width: '100%',
  },
  thumbnailList: {
    paddingHorizontal: wp(3),
  },
  titleWrap: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: wp(3),
    minWidth: 0,
  },
  topOverlay: {
    alignItems: 'center',
    flexDirection: 'row',
    left: wp(4),
    position: 'absolute',
    right: wp(4),
    top: hp(2),
  },
  viewerSubtitle: {
    color: Colors.whiteRGBA90,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small,
    marginTop: hp(0.4),
    textAlign: 'center',
  },
  viewerTitle: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium,
    textAlign: 'center',
  },
});
