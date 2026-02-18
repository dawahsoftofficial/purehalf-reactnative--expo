import _ from 'lodash';
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text as ReactText,
  View,
} from 'react-native';
import * as ImagePickCrop from 'react-native-image-crop-picker';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';

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
import { Images } from '../../res';
import {
  ApiServices,
  flashErrorMessage,
  flashSuccessMessage,
  isIOS,
} from '../../services';
import { StorageManager, useGlobalContext } from '../../services';
import { imageResizer } from './Functions';

const PhotosAndVideos = (props: any) => {
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
  const [coverImage, setCoverImage] = useState('');
  const [coverImageLoader, setCoverImageLoader] = useState(false);
  const [uploadingCoverLoader, setUploadingCoverLoader] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [profileImageLoader, setProfileImageLoader] = useState(false);
  const [uploadingProfileLoader, setUploadingProfileLoader] = useState(false);
  const [toolTipVisible, setToolTipVisible] = useState<boolean>(false);

  const Rtl = CheckRtl();
  const [youtubeURL, setYoutubeURL] = useState('');
  const [imagePicker, setImagePicker] = useState({
    visible: false,
    from: '',
  });
  const [publicPhotos, setPublicPhotos] = useState<any>([]);
  const [privatePhotos, setPrivatePhotos] = useState<any>([]);

  const setUserData = useCallback(async () => {
    const { media } = currentUser;
    if (!media) {
      return;
    }

    const {
      cover_image,
      youtube_url,
      public_gallery,
      private_gallery,
      un_blur_primary_image,
      primary_image_to_show,
      primary_image,
    } = media as any;

    if (cover_image) {
      setCoverImage(cover_image);
    }

    const nextProfileImage =
      un_blur_primary_image ?? primary_image_to_show ?? primary_image ?? '';
    if (nextProfileImage) {
      setProfileImage(nextProfileImage);
    }

    if (youtube_url) {
      setYoutubeURL(youtube_url);
    }

    if (public_gallery && public_gallery.length !== 0) {
      const publicPhotosData: any = [];
      for await (const element of public_gallery) {
        publicPhotosData.push({ uri: element, uploadSuccessful: true });
      }
      setPublicPhotos(publicPhotosData);
    }

    if (private_gallery && private_gallery.length !== 0) {
      const privatePhotosData: any = [];
      for await (const element of private_gallery) {
        privatePhotosData.push({ uri: element, uploadSuccessful: true });
      }
      setPrivatePhotos(privatePhotosData);
    }
  }, [currentUser]);

  useEffect(() => {
    setUserData();
  }, [setUserData]);

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

  const showDeleteButtonPicker = (item: any, from: any) => {
    setButtonPickerVisible({
      visible: true,
      item: item,
      from: from,
      pickerData: deletePickerData,
      pickerHeaderTitle: 'Options',
    });
  };
  const hideButtonPicker = () => {
    setButtonPickerVisible({
      visible: false,
      item: '',
      from: '',
      pickerData: [],
      pickerHeaderTitle: '',
    });
  };

  const onArrowUpPress = (item: any, from: any) => {
    const { uri } = item;
    setLoader({
      visible: true,
      message: 'Moving image...',
    });
    if (from === 'public_gallery') {
      const params = {
        from: 'public_gallery',
        file_path: uri,
        to: 'primary_image',
      };
      ApiServices.moveMedia(params)
        .then((res: any) => {
          currentUser.media = res;
          setData(storageKeys.USER, currentUser);
          updateCurrentUser(currentUser);
          _.remove(publicPhotos, function (n: any) {
            return n.uri == uri;
          });
          setPublicPhotos(publicPhotos);
          setProfileImage(item.uri);
          hideLoader();
        })
        .catch(hideLoader);
    } else if (from === 'private_gallery') {
      const params = {
        from: 'private_gallery',
        file_path: uri,
        to: 'public_gallery',
      };
      ApiServices.moveMedia(params)
        .then((res: any) => {
          currentUser.media = res;
          setData(storageKeys.USER, currentUser);
          updateCurrentUser(currentUser);
          publicPhotos.unshift({
            uri: uri,
            uploadSuccessful: true,
          });
          _.remove(privatePhotos, function (n: any) {
            return n.uri == uri;
          });
          setPublicPhotos(publicPhotos);
          setPrivatePhotos(privatePhotos);
          hideLoader();
        })
        .catch(hideLoader);
    }
  };

  const onArrowDownPress = (item: any, from: any) => {
    const { uri } = item;
    setLoader({
      visible: true,
      message: 'Moving image...',
    });
    if (from === 'public_gallery') {
      const params = {
        from: 'public_gallery',
        file_path: uri,
        to: 'private_gallery',
      };
      ApiServices.moveMedia(params)
        .then((res: any) => {
          currentUser.media = res;
          setData(storageKeys.USER, currentUser);
          updateCurrentUser(currentUser);
          privatePhotos.unshift({
            uri: uri,
            uploadSuccessful: true,
          });
          _.remove(publicPhotos, function (n: any) {
            return n.uri == uri;
          });
          setPublicPhotos(publicPhotos);
          setPrivatePhotos(privatePhotos);
          hideLoader();
        })
        .catch(hideLoader);
    } else if (from === 'primary_image') {
      const params = {
        from: 'primary_image',
        file_path: uri,
        to: 'public_gallery',
      };
      ApiServices.moveMedia(params)
        .then((res: any) => {
          currentUser.media = res;
          setData(storageKeys.USER, currentUser);
          updateCurrentUser(currentUser);
          publicPhotos.unshift({
            uri: uri,
            uploadSuccessful: true,
          });
          setProfileImage('');
          setPublicPhotos(publicPhotos);
          hideLoader();
        })
        .catch(hideLoader);
    } else {
      hideLoader();
    }
  };

  const onTryAgainPress = (item: any, index: any, from: any) => {
    item.uploadFailed = false;
    forceUpdate();
    imageResizer(item)
      .then((res: any) => {
        res.type = item?.type;
        ApiServices.imageUpload(res, from, youtubeURL)
          .then(async (res: any) => {
            if (res) {
              const { public_gallery, private_gallery } = res;
              currentUser.media = res;
              await setData(storageKeys.USER, currentUser);
              item.uploadSuccessful = true;
              item.uri =
                imagePicker.from === 'public_gallery'
                  ? public_gallery[public_gallery.length - 1]
                  : private_gallery[private_gallery.length - 1];
              forceUpdate();
            }
          })
          .catch(() => {
            item.uploadFailed = true;
            forceUpdate();
          });
      })
      .catch(() => {
        item.uploadFailed = true;
        forceUpdate();
      });
  };

  const RenderPhotosList = ({ item, index, from }: any) => {
    const { uploadSuccessful, uploadFailed } = item;
    return (
      <View
        style={{
          ...Styles.itemOuterCon,
          paddingRight: Rtl ? 0 : wp(6),
          paddingLeft: Rtl ? wp(6) : 0,
        }}
      >
        <View style={Styles.itemCon}>
          {uploadFailed ? (
            <View>
              <Text style={Styles.failedText}>Upload failed</Text>
              <Button
                text="Try again"
                buttonStyle={Styles.tryAgainButton}
                textStyle={Styles.tryAgainTxt}
                onPress={onTryAgainPress.bind(null, item, index, from)}
              />
            </View>
          ) : !uploadSuccessful ? (
            <AnimatedLoader visible={true} />
          ) : (
            <Image
              source={{ uri: item.uri }}
              resizeMode="cover"
              style={Styles.itemCon}
            />
          )}
        </View>
        {uploadSuccessful &&
        from === 'private_gallery' &&
        publicPhotos?.length < 10 ? (
          <View
            style={{
              ...Styles.upBtnCon,
              alignItems: Rtl ? 'flex-start' : 'flex-end',
            }}
          >
            <Ripple
              style={Styles.upBtn}
              onPress={onArrowUpPress.bind(null, item, from)}
            >
              <AntDesign name="arrowup" color={Colors.color2} size={wp(5)} />
            </Ripple>
          </View>
        ) : null}
        {uploadSuccessful && from === 'public_gallery' ? (
          <View
            style={{
              ...Styles.upBtnCon,
              alignItems: Rtl ? 'flex-start' : 'flex-end',
            }}
          >
            <Ripple
              style={Styles.upBtn}
              onPress={onArrowUpPress.bind(null, item, from)}
            >
              <AntDesign name="arrowup" color={Colors.color2} size={wp(5)} />
            </Ripple>
          </View>
        ) : null}
        {uploadSuccessful &&
        from !== 'private_gallery' &&
        privatePhotos?.length < 10 ? (
          <View
            style={{
              ...Styles.downBtnCon,
              alignItems: Rtl ? 'flex-start' : 'flex-end',
            }}
          >
            <Ripple
              style={Styles.downBtn}
              onPress={onArrowDownPress.bind(null, item, from)}
            >
              <AntDesign name="arrowdown" color={Colors.color2} size={wp(5)} />
            </Ripple>
          </View>
        ) : null}
        {uploadSuccessful && (
          <Ripple
            style={{
              ...Styles.menuButtonCon,
              ...Styles.shadowTwo,
              alignSelf: Rtl ? 'flex-end' : 'flex-start',
            }}
            onPress={showDeleteButtonPicker.bind(null, item, from)}
          >
            <Entypo
              name="dots-three-vertical"
              color={Colors.color2}
              size={wp(6)}
            />
          </Ripple>
        )}
      </View>
    );
  };

  const onUpoadPicture = (
    imageObj: {
      height: number | string;
      width: number | string;
      uri: string;
      name: string;
      size: number | string;
    },
    fromKey?: string
  ) => {
    const uploadKey = fromKey ?? imagePicker.from;
    const apiKey =
      uploadKey === 'primary_image_to_show' ? 'primary_image' : uploadKey;
    showUploadingLoader(uploadKey);
    hideImagePicker();
    ApiServices.imageUpload(imageObj, apiKey, youtubeURL)
      .then(async (res: any) => {
        if (res) {
          const nextProfileImage =
            res?.un_blur_primary_image ??
            res?.primary_image_to_show ??
            res?.primary_image ??
            '';
          if (nextProfileImage) {
            setProfileImage(nextProfileImage);
          }

          const updatedUser = { ...(currentUser as any), media: res };
          updateCurrentUser(updatedUser);
          await setData(storageKeys.USER, updatedUser);
          hideUploadingLoader(uploadKey);
        }
      })
      .catch(() => hideUploadingLoader(uploadKey));
  };

  const onAddPofilePress = () => {
    setImagePicker({
      visible: true,
      from: 'primary_image_to_show',
    });
  };

  const AddProfilePictureBtn = () => (
    <View
      style={{
        ...Styles.addProfilePicBtnCon,
        alignItems: Rtl ? 'flex-end' : 'flex-start',
      }}
    >
      {uploadingProfileLoader ? (
        <View
          style={{
            ...Styles.addPhotoBtn,
            marginVertical: 0,
            marginLeft: wp(4),
            marginRight: wp(4),
          }}
        >
          <AnimatedLoader text="Uploading..." visible={true} />
        </View>
      ) : profileImage.length === 0 ? (
        <Ripple
          style={{
            ...Styles.addPhotoBtn,
            marginVertical: 0,
            marginLeft: wp(4),
            marginRight: wp(4),
          }}
          onPress={onAddPofilePress}
        >
          <Image
            source={Images.camera}
            resizeMode="contain"
            style={Styles.cameraIcon}
          />
        </Ripple>
      ) : (
        <Ripple
          style={{
            ...Styles.addPhotoBtn,
            marginVertical: 0,
            marginLeft: wp(4),
            marginRight: wp(4),
          }}
          onPress={onAddPofilePress}
        >
          <View style={Styles.profileImageCon}>
            <Image
              source={{ uri: profileImage }}
              resizeMode="cover"
              style={Styles.itemCon}
              onLoadStart={onProfileImageLoadStart}
              onLoadEnd={onProfileImageLoadEnd}
              onError={onProfileImageError}
            />
            {/* <View
            style={{
              ...Styles.downBtnConProfile,
              top: hp(-2),
              alignItems: Rtl ? 'flex-start' : 'flex-end',
            }}
          >
            <Ripple
              style={{ ...Styles.deleteCoverBtn, ...Styles.shadow }}
              onPress={onProfileDeletePress}
            >
              <AntDesign name="delete" color={Colors.color1} size={wp(4.5)} />
            </Ripple>
          </View> */}
            {/* {publicPhotos?.length < 10 ? (
            <View
              style={{
                ...Styles.downBtnConProfile,
                alignItems: Rtl ? 'flex-start' : 'flex-end',
              }}
            >
              <Ripple
                style={Styles.downBtn}
                onPress={onArrowDownPress.bind(
                  null,
                  { uri: profileImage },
                  'primary_image'
                )}
              >
                <AntDesign
                  name="arrowdown"
                  color={Colors.color2}
                  size={wp(5)}
                />
              </Ripple>
            </View>
          ) : null} */}
            {/* {profileImageLoader && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: Colors.color2 + '80', // Semi-transparent overlay
              }}
            >
              <ActivityIndicator color={Colors.theme} size={wp(5)} />
            </View>
          )} */}
          </View>
        </Ripple>
      )}
    </View>
  );

  const onAddPublicPrivatePress = (from: any) => {
    setImagePicker({
      visible: true,
      from: from,
    });
  };

  const AddPhotoBtn = (from: any) => {
    return (
      <Ripple
        style={{
          ...Styles.addPhotoBtn,
          marginRight: Rtl ? 0 : wp(6),
          marginLeft: Rtl ? wp(6) : 0,
        }}
        onPress={onAddPublicPrivatePress.bind(null, from)}
      >
        <Image
          source={Images.camera}
          resizeMode="contain"
          style={Styles.cameraIcon}
        />
      </Ripple>
    );
  };

  const RenderList = ({ heading, description, data, from }: any) => {
    return (
      <View style={Styles.listOuterCon}>
        <RenderHeadingDes heading={heading} description={description} />
        <FlatList
          horizontal
          data={data}
          renderItem={({ item, index }) => (
            <RenderPhotosList item={item} index={index} from={from} />
          )}
          ListHeaderComponent={AddPhotoBtn.bind(null, from)}
          contentContainerStyle={Styles.listContainer}
          showsHorizontalScrollIndicator={false}
          inverted={Rtl}
        />
      </View>
    );
  };

  const deleteCoverImage = () => {
    setLoader({
      visible: true,
      message: 'Deleting cover...',
    });
    const params = {
      key: 'cover_image',
      file_path: coverImage,
    };
    ApiServices.deleteImage(params)
      .then(() => {
        setCoverImage('');
        hideLoader();
        currentUser.media.cover_image = null;
        setData(storageKeys.USER, currentUser);
        updateCurrentUser(currentUser);
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
        currentUser.primary_image_to_show = null;
        setProfileImage('');
        hideLoader();
        setData(storageKeys.USER, currentUser);
        updateCurrentUser(currentUser);
      })
      .catch(hideLoader);
  };

  const onCoverDeletePress = () => {
    setButtonPickerVisible({
      visible: true,
      from: 'cover_image',
      item: coverImage,
      pickerData: deletePickerData,
      pickerHeaderTitle: LanguageKeys.sureDeleteDes,
    });
  };

  const onProfileDeletePress = () => {
    setButtonPickerVisible({
      visible: true,
      from: 'primary_image_to_show',
      item: profileImage,
      pickerData: deletePickerData,
      pickerHeaderTitle: LanguageKeys.sureDeleteDes,
    });
  };

  // const onChangeYoutubeURL = (text: any) => {
  //   setYoutubeURL(text);
  // };

  const hideImagePicker = () =>
    setImagePicker({
      visible: false,
      from: '',
    });

  const onAddCoverPress = () => {
    setImagePicker({
      visible: true,
      from: 'cover_image',
    });
  };

  const showUploadingLoader = (key?: string) => {
    const fromKey = key ?? imagePicker.from;
    if (fromKey === 'cover_image') {
      setUploadingCoverLoader(true);
    } else if (fromKey === 'primary_image_to_show') {
      setUploadingProfileLoader(true);
    }
  };

  const hideUploadingLoader = (key?: string) => {
    const fromKey = key ?? imagePicker.from;
    if (fromKey === 'cover_image') {
      setUploadingCoverLoader(false);
    } else if (fromKey === 'primary_image_to_show') {
      setUploadingProfileLoader(false);
    }
  };

  const onImageProfileCoverSelection = (images: any, fromKey?: string) => {
    const key = fromKey ?? imagePicker.from;
    const first = Array.isArray(images) ? images[0] : images;
    const imagePath = first?.uri ?? first?.path;
    if (!imagePath) {
      return;
    }
    ImagePickCrop.openCropper({
      writeTempFile: true,
      path: imagePath,
      mediaType: 'photo',
      width: key === 'cover_image' ? 600 : 450,
      height: key === 'cover_image' ? 300 : 450,
    })
      .then((image) => {
        const resizedImageObj = {
          height: image?.height,
          width: image?.width,
          uri: image?.path,
          name: image?.path?.split('/')[image?.path?.split('/')?.length - 1],
          size: image?.size,
        };
        onUpoadPicture(resizedImageObj, key);
      })
      .catch(() => hideUploadingLoader(key));
  };

  const onImagePublicPrivateSelection = (images: any) => {
    hideImagePicker();
    if (
      (publicPhotos.length === 10 && imagePicker.from === 'public_gallery') ||
      (privatePhotos.length === 10 && imagePicker.from === 'private_gallery')
    ) {
      flashErrorMessage('You cannot add more than 10 images');
    } else if (images.length !== 0) {
      let newImages: any = [];
      if (imagePicker.from === 'public_gallery') {
        const length = [...publicPhotos, ...images].length;
        if (length > 10) {
          flashErrorMessage(
            `You cannot add more than 10 images in public gallery you can add ${10 - publicPhotos.length} more images`
          );
        } else {
          publicPhotos.unshift(...images);
          setPublicPhotos(publicPhotos);
          newImages = publicPhotos;
          forceUpdate();
        }
      } else if (imagePicker.from === 'private_gallery') {
        const length = [...privatePhotos, ...images].length;
        if (length > 10) {
          flashErrorMessage(
            `You cannot add more than 10 images in private gallery you can add ${10 - privatePhotos.length} more images`
          );
        } else {
          privatePhotos.unshift(...images);
          setPrivatePhotos(privatePhotos);
          newImages = privatePhotos;
          forceUpdate();
        }
      }

      if (newImages.length <= 10) {
        newImages.forEach((element: any) => {
          if (!element.uploadSuccessful) {
            imageResizer(element)
              .then((res: any) => {
                res.type = element?.type;
                ApiServices.imageUpload(res, imagePicker.from, youtubeURL)
                  .then(async (res: any) => {
                    if (res) {
                      const { public_gallery, private_gallery } = res;
                      currentUser.media = res;
                      await setData(storageKeys.USER, currentUser);
                      element.uploadSuccessful = true;
                      element.uri =
                        imagePicker.from === 'public_gallery'
                          ? public_gallery[public_gallery.length - 1]
                          : private_gallery[private_gallery.length - 1];
                      forceUpdate();
                    }
                  })
                  .catch(() => {
                    element.uploadFailed = true;
                    forceUpdate();
                  });
              })
              .catch(() => {
                element.uploadFailed = true;
                forceUpdate();
              });
          }
        });
      }
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
        currentUser.media = res;
        setData(storageKeys.USER, currentUser);
        updateCurrentUser(currentUser);
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
      buttonPickerVisible.from === 'primary_image_to_show'
    ) {
      deleteProfileImage();
    }
  };

  const onCoverImageLoadStart = () => {
    setCoverImageLoader(true);
  };

  const onCoverImageLoadEnd = () => {
    setCoverImageLoader(false);
  };

  const onProfileImageLoadStart = () => {
    setProfileImageLoader(true);
  };

  const onProfileImageLoadEnd = () => {
    setProfileImageLoader(false);
  };

  const onProfileImageError = () => {
    setProfileImageLoader(false);
  };

  const youtubeURLValidation = (url: any) => {
    const p =
      /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    return url.match(p) ? RegExp.$1 : false;
  };

  const onSavePress = () => {
    if (youtubeURL.length === 0) {
      flashErrorMessage('No link has been added');
    } else if (!youtubeURLValidation(youtubeURL)) {
      flashErrorMessage('Video can only be a YouTube link');
    } else {
      setLoader({
        visible: true,
        message: LanguageKeys.savingYoutubeVideo,
      });
      ApiServices.imageUpload({}, {}, youtubeURL)
        .then(async (res) => {
          currentUser.media = res;
          await setData(storageKeys.USER, currentUser);
          flashSuccessMessage(LanguageKeys.saved);
          hideLoader();
        })
        .catch(hideLoader);
    }
  };

  // const RenderCover = () => {
  //   return uploadingCoverLoader ? (
  //     <View style={Styles.coverPhoto}>
  //       <AnimatedLoader text="Uploading cover image..." visible={true} />
  //     </View>
  //   ) : coverImage.length === 0 ? (
  //     <Ripple style={Styles.coverPhoto} onPress={onAddCoverPress}>
  //       <Image
  //         source={Images.camera}
  //         resizeMode="contain"
  //         style={Styles.cameraIcon}
  //       />
  //       <Text style={Styles.uploadPhoto}>{LanguageKeys.uploadPhoto}</Text>
  //     </Ripple>
  //   ) : (
  //     <View style={Styles.coverPhoto}>
  //       <Image
  //         source={{ uri: coverImage }}
  //         resizeMode="cover"
  //         style={Styles.coverPhoto}
  //         onLoadStart={onCoverImageLoadStart}
  //         onLoadEnd={onCoverImageLoadEnd}
  //       />
  //       <View
  //         style={{
  //           ...Styles.deleteCoverBtnCon,
  //           alignItems: Rtl ? 'flex-start' : 'flex-end',
  //         }}
  //       >
  //         <Ripple
  //           style={{ ...Styles.deleteCoverBtn, ...Styles.shadow }}
  //           onPress={onCoverDeletePress}
  //         >
  //           <AntDesign name="delete" color={Colors.color1} size={wp(4.5)} />
  //         </Ripple>
  //       </View>
  //       {coverImageLoader && (
  //         <ActivityIndicator
  //           color={Colors.theme}
  //           size={wp(5)}
  //           style={{ position: 'absolute' }}
  //         />
  //       )}
  //     </View>
  //   );
  // };

  // const onVideoPress = () => {
  //   props.navigation.navigate('MyVideo');
  // };

  return (
    <Container>
      <ModalLoader visible={loader.visible} message={loader.message} />
      <Header
        title={LanguageKeys.photosAndVideos}
        navigation={props.navigation}
        customConponent={() => (
          <View style={{ flex: 1 }}>
            <Ripple
              style={Styles.tooltipWrapper}
              onPress={() => setToolTipVisible(true)}
            >
              <Image source={Images.infoIcon} style={Styles.infoIcon} />
            </Ripple>
            <Modal visible={toolTipVisible}>
              <View style={Styles.modalWrapper}>
                <Ripple
                  style={Styles.closeWrapper}
                  onPress={() => setToolTipVisible(false)}
                >
                  <AntDesign name="close" size={wp(6)} color={Colors.color1} />
                </Ripple>
                <View style={Styles.tootltipTextWrapper}>
                  <Image source={Images.quotesIcon} style={Styles.quotesIcon} />
                  <Text style={Styles.tootltipTitle}>
                    Honoring Islamic Values
                  </Text>
                  <Text style={Styles.tootltipDesc}>
                    We request you to uphold modesty, inviting blessings and
                    mercy from Allah. Profile pictures can be blurred for
                    privacy. You can decide who gets to see your images.
                  </Text>
                  <Text style={Styles.tootltipTitle}>Quranic Versed:</Text>
                  <Text style={Styles.tootltipText}>
                    {
                      "And tell the believing women to lower their gaze and guard their private parts and not expose their adornment except that which (necessarily)... (Qur'an 24:31)"
                    }
                  </Text>
                  <ReactText style={[Styles.tootltipTitle, { marginTop: 30 }]}>
                    Hadith:
                  </ReactText>
                  <Text style={Styles.tootltipText}>
                    {
                      'Modesty is part of faith and faith is in Paradise, but obscenity is a part of hardness of the heart and hardness of the heart is in Hell. (Sahih Muslim)'
                    }
                  </Text>
                </View>

                <Button
                  onPress={() => setToolTipVisible(false)}
                  buttonStyle={Styles.closeBtn}
                  text={'Close'}
                  textStyle={Styles.closeBtnText}
                />
              </View>
            </Modal>
          </View>
        )}
      />
      <ScrollView
        contentContainerStyle={Styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* <RenderHeadingDes
          heading={LanguageKeys.cover}
          description={LanguageKeys.coverDes}
        />
        {RenderCover()} */}
        {/* <View
          style={{
            ...Styles.videoVoiceContainer,
            flexDirection: Rtl ? 'row-reverse' : 'row',
          }}
        >
          <Ripple style={Styles.videoVoiceIconWrapper} onPress={onVideoPress}>
            <View style={Styles.videoVoiceIconContainer}>
              <Ionicons
                name="play-outline"
                size={wp(7)}
                color={Colors.color2}
              />
            </View>
            <Text style={Styles.videoVoiceIconText}>My Video</Text>
          </Ripple>
          <Ripple
            style={{ ...Styles.videoVoiceIconWrapper, marginLeft: wp(4) }}
            // onPress={onEditPress}
          >
            <View style={Styles.videoVoiceIconContainer}>
              <AntDesign name="sound" size={wp(7)} color={Colors.color2} />
            </View>
            <Text style={Styles.videoVoiceIconText}>My audio</Text>
          </Ripple>
        </View> */}
        <RenderHeadingDes
          heading={LanguageKeys.profilePhotoHeading}
          description={LanguageKeys.profilePhotoDes}
        />
        {AddProfilePictureBtn()}
        {/* <View style={{ flexDirection: Rtl ? 'row-reverse' : 'row' }}>
          <IconInput
            label={LanguageKeys.youTubeVideoHeading}
            outerLabelStyle={Styles.heading}
            containerStyle={Styles.inputOuterCon}
            inputStyle={{
              width: wp(75),
              color: Colors.color1,
            }}
            value={youtubeURL}
            onChangeText={onChangeYoutubeURL}
            numberOfLines={1}
          />
          <Ripple onPress={onSavePress} style={Styles.youtubeSaveBtn}>
            <Text style={Styles.youtubeSaveBtnTxt}>Save</Text>
          </Ripple>
        </View> */}

        <RenderList
          heading={LanguageKeys.publicPhotosHeading}
          description={LanguageKeys.publicPhotosDes}
          data={publicPhotos}
          from={'public_gallery'}
        />
        <RenderList
          heading={LanguageKeys.privatePhotosHeading}
          description={LanguageKeys.privatePhotosDes}
          data={privatePhotos}
          from={'private_gallery'}
        />
      </ScrollView>
      <ImagePicker
        visible={imagePicker.visible}
        from={imagePicker.from}
        onImageSelection={(res: any) => {
          const fromKey = imagePicker.from;
          hideImagePicker();
          if (fromKey === 'public_gallery' || fromKey === 'private_gallery') {
            onImagePublicPrivateSelection(res);
          } else {
            const selection = Array.isArray(res) ? res : res ? [res] : [];
            setTimeout(
              () => onImageProfileCoverSelection(selection, fromKey),
              isIOS ? 1000 : 0
            );
          }
        }}
        onClose={hideImagePicker}
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

export default PhotosAndVideos;

const { width } = Dimensions.get('window');

const Styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    paddingBottom: hp(10),
  },
  headingDesCon: {
    paddingVertical: hp(2),
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
  modalWrapper: {
    flex: 1,
    padding: 10,
    backgroundColor: Colors.color2,
  },
  tooltipWrapper: {
    position: 'absolute',
    right: 10,
    top: -15,
    backgroundColor: Colors.color3,
    borderRadius: 50,
    padding: 5,
  },
  infoIcon: {
    width: 25,
    height: 25,
  },
  quotesIcon: {
    width: 80,
    height: 80,
    opacity: 0.3,
  },
  tootltipTextWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  closeWrapper: {
    alignSelf: 'flex-end',
    paddingRight: 15,
    marginTop: isIOS ? 40 : 2,
  },
  tootltipTitle: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium,
    marginTop: 20,
  },
  tootltipText: {
    color: Colors.color1,
    fontSize: Typography.small3,
    fontFamily: Fonts.APPFONT_R,
  },
  tootltipDesc: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small3,
    color: Colors.color1,
  },
  closeBtn: {
    backgroundColor: Colors.color2,
    borderWidth: 1,
    borderColor: Colors.greyRGBA61,
    marginBottom: hp(2),
    marginHorizontal: wp(5),
  },
  closeBtnText: {
    color: Colors.blackRGBA70,
  },
  italic: { fontStyle: 'italic' },
  coverPhoto: {
    width: wp(100),
    height: hp(30),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.color21,
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
    paddingTop: hp(2),
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
