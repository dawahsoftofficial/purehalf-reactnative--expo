import React, { useState } from 'react';
import { Image, Modal, ScrollView, Text, View } from 'react-native';
import { StyleSheet } from 'react-native';
import CircularProgress from 'react-native-circular-progress-indicator';
import { AppEventsLogger } from 'react-native-fbsdk-next';
import * as ImagePickCrop from 'react-native-image-crop-picker';
import Ripple from 'react-native-material-ripple';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { Animation } from '../../animations';
import { Button, ImagePicker } from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';
import {
  ApiServices,
  flashSuccessMessage,
  isIOS,
  StorageManager,
  useGlobalContext,
} from '../../services';
import { addAnaylatics } from '../../services/firebase/analytics';

const ProfilePicture = (props: any) => {
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const { setData, storageKeys } = StorageManager;
  const guardian = currentUser?.guardian ? currentUser?.guardian : false;
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [image, setImage] = useState('');
  const [uploadingProgress, setUploadingProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [toolTipVisible, setToolTipVisible] = useState<boolean>(false);

  const onAddImagePress = () => setImagePickerVisible(true);

  const hideImagePicker = () => setImagePickerVisible(false);

  const onImageSelection = (data: any) => {
    console.log('Image Selection pr ayasads', data?.length, data);
    // if (data?.length) {
    ImagePickCrop.openCropper({
      path: data[0]?.uri,
      mediaType: data[0]?.type,
      width: 450,
      height: 450,
    })
      .then((image) => {
        const resizedImageObj = {
          height: image?.height,
          width: image?.width,
          uri: image?.path,
          name: image?.path?.split('/')[image?.path?.split('/')?.length - 1],
          size: image?.size,
        };
        setUploading(true);
        setUploadingProgress(0);
        ApiServices.addProfilePicture(resizedImageObj, (progress: any) => {
          const progressValue = Math.min(
            Math.max(Number(progress) || 0, 0),
            100
          );
          setUploadingProgress(progressValue);
        })
          .then(async (res: any) => {
            const result = res?.results;
            const user = {
              ...currentUser,
              media: {
                primary_image: result?.primary_image,
              },
            };
            updateCurrentUser(user);
            await setData(storageKeys.USER, user);
            flashSuccessMessage('Profile Picture Updated');
            setImage(resizedImageObj?.uri);
            setUploading(false);
            setUploadingProgress(0);
          })
          .catch((error) => {
            console.log('Errorr  1', error);
            setUploading(false);
            setUploadingProgress(0);
          });
      })
      .catch((error) => {
        console.log('Errorr  3333', error);
        setUploading(false);
        setUploadingProgress(0);
      });
    // }
  };

  const onContinuePress = () => {
    //Facebook Event For complete Registration
    const info = {
      gender: currentUser?.gender || '',
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      email: currentUser?.email || '',
      phoneNumber: currentUser?.phone_number || '',
    };
    AppEventsLogger.logEvent(AppEventsLogger.AppEvents.CompletedRegistration, {
      [AppEventsLogger.AppEventParams.RegistrationMethod]: 'email',
      ...info,
    });
    addAnaylatics('Complete Registration', info);
    if (guardian || currentUser?.gender !== 'female') {
      props.navigation.reset({
        index: 0,
        routes: [{ name: 'WelcomeUser' }],
      });
    } else {
      props.navigation.reset({
        index: 0,
        routes: [{ name: 'AddWali' }],
      });
    }
  };

  return (
    <SafeAreaView style={Styles.container}>
      <Modal
        transparent={true}
        visible={toolTipVisible}
        onRequestClose={() => setToolTipVisible(false)}
        animationType="fade"
      >
        <View style={Styles.modalWrapper}>
          <Ripple
            style={Styles.closeWrapper}
            onPress={() => setToolTipVisible(false)}
          >
            <AntDesign name="close" size={wp(6)} color={Colors.color1} />
          </Ripple>
          <View style={Styles.tootltipTextWrapper}>
            <Text style={Styles.tootltipTitle}>Guildlines</Text>
            <Text style={Styles.guildlineText}>
              {`\u2022`} The picture quality should be high and not blurry. The
              picture should not be your whole body but only the face and upper
              portion of your body like a passport picture.
            </Text>
            <Text style={Styles.guildlineText}>
              {`\u2022`} The profile picture should be a front facing picture
              that is clearly visible, avoid sunglasses and should not be facing
              some other way.
            </Text>
            <Text style={Styles.guildlineText}>
              {`\u2022`} We have already added some instructions on the profile
              picture screen by clicking on the i icon.
            </Text>
            <View style={Styles.pfpContainer}>
              <View>
                <Text style={Styles.pfpText}>Incorrect</Text>
                {currentUser?.gender === 'female' ? (
                  <Image
                    source={Images.wrongPFPFemale}
                    style={Styles.pfpImage}
                  />
                ) : (
                  <Image source={Images.wrongPFP} style={Styles.pfpImage} />
                )}
              </View>
              <View>
                <Text style={Styles.pfpText}>Correct</Text>
                {currentUser?.gender === 'female' ? (
                  <Image
                    source={Images.rightPfpFemale}
                    style={Styles.pfpImage}
                  />
                ) : (
                  <Image source={Images.rightPfp} style={Styles.pfpImage} />
                )}
              </View>
            </View>
          </View>
          <Button
            text={LanguageKeys.close}
            onPress={() => setToolTipVisible(false)}
            buttonStyle={Styles.closeBtn}
            textStyle={Styles.closeBtnText}
          />
        </View>
      </Modal>
      <ScrollView contentContainerStyle={Styles.scrollConrtainer}>
        <>
          <View style={Styles.innerContainer}>
            <View style={Styles.headerWrapper}>
              <Text style={Styles.headerText}>Profile Picture</Text>
              <Ripple
                style={Styles.tooltipWrapper}
                onPress={() => setToolTipVisible(true)}
              >
                <Image source={Images.infoIcon} style={Styles.infoIcon} />
              </Ripple>
            </View>
            {uploading ? (
              <View style={Styles.addImageCon}>
                <Animation animation="zoomIn">
                  <CircularProgress
                    value={uploadingProgress}
                    maxValue={100}
                    radius={110}
                    duration={100}
                    progressValueColor={Colors.color1}
                    title={'Uploading'}
                    titleColor={Colors.color1}
                    titleStyle={{ fontSize: 25, fontFamily: Fonts.APPFONT_B }}
                    progressValueStyle={{ fontSize: 65 }}
                    inActiveStrokeColor={Colors.color18}
                    activeStrokeColor={Colors.theme}
                  />
                </Animation>
              </View>
            ) : image?.length !== 0 ? (
              <Ripple style={Styles.addImageCon} onPress={onAddImagePress}>
                <Image
                  source={{ uri: image }}
                  resizeMode="cover"
                  style={Styles.image}
                />
                <View style={Styles.cameraIconWrapper}>
                  <AntDesign
                    name="camerao"
                    size={wp(8)}
                    color={Colors.color2}
                  />
                </View>
                {/* <Button
                  text="Change Picture"
                  buttonStyle={Styles.changeImageButton}
                  textStyle={Styles.buttonText}
                  onPress={onAddImagePress}
                /> */}
              </Ripple>
            ) : (
              <Ripple style={Styles.addImageCon} onPress={onAddImagePress}>
                <Image
                  source={Images.addPhoto}
                  resizeMode="contain"
                  style={Styles.addImageIcon}
                />
                <Text style={Styles.addImageText}>
                  Tap the image below to upload your profile picture
                </Text>
              </Ripple>
            )}
          </View>
          <View style={Styles.btnWrapper}>
            {/* {currentUser?.gender === 'female' ? (
              <Button text={'Skip for now'} onPress={onContinuePress} />
            ) : null} */}
            <Button
              disabled={image?.length === 0 ? true : false}
              text={LanguageKeys.continue}
              onPress={onContinuePress}
              buttonStyle={{ marginTop: 10 }}
            />
          </View>
          <ImagePicker
            visible={imagePickerVisible}
            from={'primary_image'}
            onImageSelection={(res: any) => {
              hideImagePicker();
              setTimeout(
                () => {
                  onImageSelection(res);
                },
                isIOS ? 1000 : 0
              );
            }}
            onClose={hideImagePicker}
          />
        </>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfilePicture;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollConrtainer: {
    flex: 1,
    marginHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 25,
  },
  headerWrapper: {
    // position: 'relative'
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_R,
    fontSize: 20,
  },
  modalWrapper: {
    flex: 1,
    padding: 10,
    backgroundColor: Colors.color2,
  },
  tooltipWrapper: {
    borderRadius: 25,
    padding: 7,
    marginLeft: 5,
    marginBottom: 5,
  },
  infoIcon: {
    width: 25,
    height: 25,
  },
  tootltipTextWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  closeWrapper: {
    alignSelf: 'flex-end',
    paddingRight: 10,
    marginTop: isIOS ? 45 : 5,
  },
  tootltipTitle: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium2,
    marginTop: 20,
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
  addImageCon: {
    marginTop: hp(3),
    width: wp(70),
    height: wp(70),
    borderRadius: 150,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: Colors.color51,
    // overflow: 'hidden',
    alignSelf: 'center',
    // position: 'relative'
    // borderRad
  },
  addImageIcon: {
    width: 205,
    height: 205,
    opacity: 0.7,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 150,
  },
  cameraIconWrapper: {
    position: 'absolute',
    right: 15,
    bottom: 10,
    backgroundColor: Colors.color15,
    padding: 10,
    borderRadius: 50,
  },
  addImageText: {
    color: Colors.color1,
    fontSize: wp(4),
    fontFamily: Fonts.APPFONT_R,
    marginVertical: hp(3),
    paddingHorizontal: 25,
    opacity: 0.7,
    textAlign: 'center',
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 6,
    right: wp(2),
    height: 28,
    paddingHorizontal: wp(4),
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 12,
    fontFamily: Fonts.APPFONT_SB,
  },
  guildlineText: {
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color22,
    marginTop: 5,
  },
  pfpContainer: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginTop: 20,
  },
  pfpText: {
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_M,
    color: Colors.color1,
  },
  pfpImage: {
    width: wp(42),
    height: hp(20),
    borderRadius: 5,
  },
  btnWrapper: {
    width: '100%',
    marginBottom: 10,
  },
});
