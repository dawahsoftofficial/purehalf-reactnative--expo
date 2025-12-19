import _ from 'lodash';
import React, { useEffect, useReducer, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';

import {
  AnimatedLoader,
  Button,
  ButtonPicker,
  Container,
  Header,
  ImagePicker,
  ModalLoader,
  Text,
} from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
import { ApiServices } from '../../services';
import { StorageManager, useGlobalContext } from '../../services';

const MyVideo = (props: any) => {
  const deletePickerData = [
    {
      label: 'Delete',
      value: 'delete',
      buttonStyle: { backgroundColor: Colors.color24 },
      buttonTextStyle: { color: Colors.color2 },
    },
    {
      label: 'Cancel',
      value: 'cancel',
    },
  ];

  const [buttonPickerVisible, setButtonPickerVisible] = useState<any>({
    pickerData: [],
    pickerHeaderTitle: '',
    visible: false,
    item: '',
    from: '',
  });
  const [loader, setLoader] = useState({
    visible: false,
    message: '',
  });

  const [ignore, forceUpdate] = useReducer((x) => x + 1, 0);
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const { setData, storageKeys } = StorageManager;
  const [introVideo, setIntroVideo] = useState(null);
  const [coverImage, setCoverImage] = useState('');
  const [uploadingCoverLoader, setUploadingCoverLoader] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [showPlayIcon, setShowPlayIcon] = useState<boolean>(true);
  const [isPlay, setIsPlay] = useState<boolean>(true);

  const Rtl = CheckRtl();
  const [imagePicker, setImagePicker] = useState({
    visible: false,
    from: '',
  });
  const [publicPhotos, setPublicPhotos] = useState<any>([]);
  const [privatePhotos, setPrivatePhotos] = useState<any>([]);

  const setUserData = async () => {
    const { media } = currentUser;
    if (media) {
      const { intro_video, intro_voice } = media;
      setIntroVideo(intro_video);
      // intro_voice && setProfileImage(intro_voice)
    }
  };

  useEffect(() => {
    setUserData();
  }, []);

  const hideLoader = () => {
    setLoader({
      visible: false,
      message: '',
    });
  };

  const RenderHeadingDes = ({ heading, description }: any) => (
    <View style={Styles.headingDesCon}>
      <Text style={Styles.heading}>{heading}</Text>
      <Text style={Styles.description}>{description}</Text>
    </View>
  );

  const hideButtonPicker = () => {
    setButtonPickerVisible({
      visible: false,
      item: '',
      from: '',
      pickerData: [],
      pickerHeaderTitle: '',
    });
  };

  const deleteCoverImage = () => {
    setLoader({
      visible: true,
      message: 'Deleting video...',
    });
    const params = {
      key: 'intro_video',
      file_path: introVideo,
    };
    ApiServices.deleteImage(params)
      .then(() => {
        setIntroVideo(null);
        hideLoader();
        const updatedUser = {
          ...currentUser,
          media: {
            ...currentUser.media,
            intro_video: null,
          },
        };
        setData(storageKeys.USER, updatedUser);
        updateCurrentUser(updatedUser);
      })
      .catch(hideLoader);
  };

  const deleteProfileImage = () => {
    setLoader({
      visible: true,
      message: 'Deleting profile image...',
    });
    const params = {
      key: 'primary_image',
      file_path: profileImage,
    };
    ApiServices.deleteImage(params)
      .then(() => {
        const updatedUser = {
          ...currentUser,
          media: {
            ...currentUser.media,
            primary_image: null,
          },
        };
        setProfileImage('');
        hideLoader();
        setData(storageKeys.USER, updatedUser);
        updateCurrentUser(updatedUser);
      })
      .catch(hideLoader);
  };

  const hideVideoPicker = () =>
    setImagePicker({
      visible: false,
      from: '',
    });

  const onAddVideoPress = () => {
    setImagePicker({
      visible: true,
      from: 'video',
    });
  };

  const showUploadingLoader = () => {
    setUploadingCoverLoader(true);
  };

  const hideUploadingLoader = () => {
    setUploadingCoverLoader(false);
  };

  const onVideoSelection = (images: any) => {
    hideVideoPicker();
    if (images) {
      if (images && images?.length > 0) {
        const fileSizeInBytes = images[0].fileSize;
        if (fileSizeInBytes) {
          const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
        }
      }
    }
    if (images.length !== 0) {
      showUploadingLoader();
      ApiServices.imageUpload(
        {
          uri: images[0].uri as string,
          name: images[0].fileName as string,
          type: images[0].type as string,
          duration: images[0].duration as number,
        },
        'intro_video',
        []
      )
        .then(async (res: any) => {
          if (res) {
            const { intro_video, intro_voice } = res;
            if (intro_video) setIntroVideo(intro_video);
            // intro_voice && setProfileImage(intro_voice)
            const updatedUser = {
              ...currentUser,
              media: res,
            };
            updateCurrentUser(updatedUser);
            await setData(storageKeys.USER, updatedUser);
            hideUploadingLoader();
          }
        })
        .catch(hideUploadingLoader);
    }
  };

  const onImagePrivatePublicDelete = (item: any, from: any) => {
    const { uri } = item;
    setLoader({
      visible: true,
      message: 'Deleting image...',
    });
    const params = {
      key: from,
      file_path: uri,
    };
    ApiServices.deleteImage(params)
      .then((res) => {
        if (from === 'public_gallery') {
          _.remove(publicPhotos, function (n: any) {
            return n.uri == uri;
          });
          setPublicPhotos(publicPhotos);
          forceUpdate();
          hideLoader();
        } else if (from === 'private_gallery') {
          _.remove(privatePhotos, function (n: any) {
            return n.uri == uri;
          });
          setPrivatePhotos(privatePhotos);
          forceUpdate();
          hideLoader();
        }
        const updatedUser = {
          ...currentUser,
          media: res,
        };
        setData(storageKeys.USER, updatedUser);
        updateCurrentUser(updatedUser);
      })
      .catch(hideLoader);
  };

  const onButtonPickerButtonPress = (item: any) => {
    const { value } = item;
    hideButtonPicker();
    if (
      value === 'delete' &&
      (buttonPickerVisible.from === 'private_gallery' ||
        buttonPickerVisible.from === 'public_gallery')
    ) {
      onImagePrivatePublicDelete(
        buttonPickerVisible.item,
        buttonPickerVisible.from
      );
    } else if (
      value === 'delete' &&
      buttonPickerVisible.from === 'cover_image'
    ) {
      deleteCoverImage();
    } else if (
      value === 'delete' &&
      buttonPickerVisible.from === 'primary_image'
    ) {
      deleteProfileImage();
    }
  };

  const onPlayPause = () => {
    setIsPlay(!isPlay);
    setShowPlayIcon(false);
  };

  const onVideoEnd = () => {
    setIsPlay(!isPlay);
    setShowPlayIcon(true);
  };

  const RenderVideo = () => {
    return uploadingCoverLoader ? (
      <View style={Styles.coverPhoto}>
        <AnimatedLoader text="Uploading cover image..." visible={true} />
      </View>
    ) : !introVideo ? (
      <Ripple style={Styles.coverPhoto} onPress={onAddVideoPress}>
        <Ionicons name="play-outline" size={wp(15)} color={Colors.color1} />
        <Text style={Styles.uploadPhoto}>{LanguageKeys.uploadVideo}</Text>
      </Ripple>
    ) : (
      <View>
        <View style={Styles.coverPhoto}>
          <Video
            source={{ uri: introVideo }}
            style={Styles.backgroundVideo}
            resizeMode="cover"
            paused={isPlay}
            onTouchStart={() => setShowPlayIcon(true)}
            onEnd={onVideoEnd}
          />
          {showPlayIcon && (
            <Ripple style={Styles.playIconBackground} onPress={onPlayPause}>
              <Ionicons
                name="play-outline"
                size={wp(15)}
                color={Colors.color2}
              />
            </Ripple>
          )}

          {/* <Image
                            source={{ uri: coverImage }}
                            resizeMode='cover'
                            style={Styles.coverPhoto}
                            onLoadStart={onCoverImageLoadStart}
                            onLoadEnd={onCoverImageLoadEnd}
                        />
                        <View style={{ ...Styles.deleteCoverBtnCon, alignItems: Rtl ? 'flex-start' : 'flex-end', }}>
                            <Ripple style={{ ...Styles.deleteCoverBtn, ...Styles.shadow }}
                                onPress={onCoverDeletePress}
                            >
                                <AntDesign
                                    name='delete'
                                    color={Colors.color1}
                                    size={wp(4.5)}
                                />
                            </Ripple>
                        </View>
                        {
                            coverImageLoader &&
                            <ActivityIndicator color={Colors.theme} size={wp(5)} style={{ position: 'absolute' }} />
                        } */}
        </View>
        <Button
          text={LanguageKeys.update}
          buttonStyle={Styles.updateBtn}
          textStyle={Styles.videoVoiceIconText}
          icon={<Feather name="edit-2" size={wp(5)} color={Colors.color1} />}
          onPress={onAddVideoPress}
          // disabled={updateLoader}
          loading={uploadingCoverLoader}
          loadingMessage={LanguageKeys.updating}
        />
        <Button
          text={LanguageKeys.delete}
          buttonStyle={Styles.updateBtn}
          textStyle={Styles.videoVoiceIconText}
          icon={<AntDesign name="delete" size={wp(5)} color={Colors.color1} />}
          onPress={deleteCoverImage}
          // disabled={updateLoader}
          loading={uploadingCoverLoader}
          loadingMessage={LanguageKeys.updating}
        />
      </View>
    );
  };

  return (
    <Container>
      <ModalLoader visible={loader.visible} message={loader.message} />
      <Header title={LanguageKeys.myVideo} navigation={props.navigation} />
      <ScrollView
        contentContainerStyle={Styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <RenderHeadingDes
          heading={LanguageKeys.video}
          description={LanguageKeys.videoDes}
        />
        {RenderVideo()}
        {/* <View style={{ ...Styles.videoVoiceContainer, flexDirection: Rtl ? 'row-reverse' : 'row' }}>
                    <Ripple style={Styles.videoVoiceIconWrapper}
                    // onPress={onEditPress}
                    >
                        <View style={Styles.videoVoiceIconContainer}>
                            <Ionicons name='play-outline' size={wp(7)} color={Colors.color2} />
                        </View>
                        <Text style={Styles.videoVoiceIconText}>My Video</Text>
                    </Ripple>
                    <Ripple style={{ ...Styles.videoVoiceIconWrapper, marginLeft: wp(4) }}
                    // onPress={onEditPress}
                    >
                        <View style={Styles.videoVoiceIconContainer}>
                            <AntDesign name='sound' size={wp(7)} color={Colors.color2} />
                        </View>
                        <Text style={Styles.videoVoiceIconText}>My audio</Text>
                    </Ripple>
                </View>
                <RenderHeadingDes
                    heading={LanguageKeys.profilePhotoHeading}
                    description={LanguageKeys.profilePhotoDes}
                />
                {AddProfilePictureBtn()} */}
        {/* <View style={{ flexDirection: Rtl ? 'row-reverse' : 'row' }}>
                    <IconInput
                        label={LanguageKeys.youTubeVideoHeading}
                        outerLabelStyle={Styles.heading}
                        containerStyle={Styles.inputOuterCon}
                        inputStyle={{
                            width: wp(75),
                            color: Colors.color1
                        }}
                        value={youtubeURL}
                        onChangeText={onChangeYoutubeURL}
                        numberOfLines={1}
                    />
                    <Ripple
                        onPress={onSavePress}
                        style={Styles.youtubeSaveBtn}
                    >
                        <Text style={Styles.youtubeSaveBtnTxt}>
                            Save
                        </Text>
                    </Ripple>
                </View> */}

        {/* <RenderList
                    heading={LanguageKeys.publicPhotosHeading}
                    description={LanguageKeys.publicPhotosDes}
                    data={publicPhotos}
                    from={"public_gallery"}
                />
                <RenderList
                    heading={LanguageKeys.privatePhotosHeading}
                    description={LanguageKeys.privatePhotosDes}
                    data={privatePhotos}
                    from={"private_gallery"}
                /> */}
      </ScrollView>
      <ImagePicker
        visible={imagePicker.visible}
        from={imagePicker.from}
        onImageSelection={onVideoSelection}
        onClose={hideVideoPicker}
      />
      <ButtonPicker
        visible={buttonPickerVisible.visible}
        data={buttonPickerVisible.pickerData}
        onClose={hideButtonPicker}
        headerTitle={buttonPickerVisible.pickerHeaderTitle}
        onButtonPress={onButtonPickerButtonPress}
      />
    </Container>
  );
};

export default MyVideo;

const { width } = Dimensions.get('window');

const Styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    paddingBottom: hp(10),
  },
  headingDesCon: {
    paddingVertical: hp(4),
    paddingHorizontal: wp(4),
  },
  heading: {
    color: Colors.color1,
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_B,
    lineHeight: wp(5),
  },
  description: {
    color: Colors.color1,
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_R,
    lineHeight: wp(5),
    marginTop: hp(0.5),
  },
  coverPhoto: {
    width: wp(100),
    height: hp(30),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.color21,
    position: 'relative',
  },
  backgroundVideo: {
    // position: 'absolute',
    // top: 0,
    // left: 0,
    // bottom: 0,
    // right: 0,
    flex: 1,
    width: '100%',
    height: '100%',
    // width: '100%'
    // backgroundColor: 'red'
  },
  playIconBackground: {
    backgroundColor: Colors.color1,
    width: wp(20),
    height: wp(20),
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    paddingLeft: wp(2),
    // top: 0,
    // left: 0,
    // bottom: 0,
    // right: 0,
  },
  updateBtn: {
    marginTop: hp(3),
    backgroundColor: 'transparent',
    borderWidth: 1,
    marginHorizontal: wp(6),
  },
  videoVoiceContainer: {
    width: '100%',
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
  },
  videoVoiceIconWrapper: {
    borderTopLeftRadius: 50,
    borderBottomLeftRadius: 50,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    borderColor: Colors.color1,
    borderWidth: 1,
  },
  videoVoiceIconContainer: {
    backgroundColor: Colors.color1,
    padding: wp(1),
    borderRadius: 50,
  },
  videoVoiceIconText: {
    color: Colors.color1,
    alignSelf: 'center',
    paddingRight: wp(3),
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small2,
  },
  cameraIcon: {
    width: wp(15),
    height: hp(6),
  },
  uploadPhoto: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.medium,
    alignSelf: 'center',
    textAlign: 'center',
    marginVertical: hp(1.5),
  },
  inputOuterCon: {
    marginTop: hp(4),
    marginHorizontal: wp(4),
    width: wp(75),
  },
  youtubeSaveBtn: {
    marginTop: hp(8.3),
    height: hp(5),
    width: wp(15),
    backgroundColor: Colors.theme,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    marginLeft: wp(-1.5),
  },
  youtubeSaveBtnTxt: {
    alignSelf: 'center',
    textAlign: 'center',
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    includeFontPadding: false,
  },
  listOuterCon: {},
  listContainer: {
    paddingHorizontal: wp(4),
  },
  addPhotoBtn: {
    borderRadius: 8,
    backgroundColor: Colors.color21,
    width: wp(32),
    height: hp(17),
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: hp(2),
  },
  itemOuterCon: {
    paddingVertical: hp(2),
  },
  itemCon: {
    borderRadius: 8,
    backgroundColor: Colors.color21,
    width: wp(32),
    height: hp(17),
    justifyContent: 'center',
    alignItems: 'center',
  },
  upBtnCon: {
    position: 'absolute',
    top: 0,
    width: wp(36.5),
  },
  upBtn: {
    width: width * 0.09,
    height: width * 0.09 * 1,
    borderRadius: (width * 0.09 * 1) / 2,
    backgroundColor: Colors.theme,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downBtnCon: {
    position: 'absolute',
    bottom: 0,
    width: wp(36.5),
  },
  downBtn: {
    width: width * 0.09,
    height: width * 0.09 * 1,
    borderRadius: (width * 0.09 * 1) / 2,
    backgroundColor: Colors.theme,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addProfilePicBtnCon: {
    paddingBottom: hp(2),
  },
  profileImageCon: {
    paddingHorizontal: wp(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  downBtnConProfile: {
    position: 'absolute',
    bottom: hp(-2),
    width: wp(40.5),
  },
  deleteCoverBtnCon: {
    position: 'absolute',
    width: wp(100),
    paddingHorizontal: wp(5),
    top: hp(3),
  },
  deleteCoverBtn: {
    width: width * 0.09,
    height: width * 1 * 0.09,
    borderRadius: width * 1 * 0.09,
    backgroundColor: Colors.color21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shadow: {
    shadowColor: Colors.color1,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  failedText: {
    color: Colors.color23,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    textAlign: 'center',
    includeFontPadding: false,
  },
  tryAgainButton: {
    marginTop: hp(1),
    height: hp(4),
  },
  tryAgainTxt: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small1,
    alignSelf: 'center',
    textAlign: 'center',
  },
  menuButtonCon: {
    position: 'absolute',
    top: hp(2),
    paddingVertical: hp(1),
    backgroundColor: Colors.blackRGBA15,
    borderBottomRightRadius: 10,
    borderTopLeftRadius: 10,
  },
  shadowTwo: {
    shadowColor: Colors.color1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
