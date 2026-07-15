import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { type Asset, launchCamera } from 'react-native-image-picker';
import Ripple from 'react-native-material-ripple';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';

import { Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
import {
  ApiServices,
  flashErrorMessage,
  flashSuccessMessage,
  StorageManager,
  useGlobalContext,
} from '../../services';

const ProfileIntroVideo = ({ navigation }: any) => {
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const { setData, storageKeys } = StorageManager;
  const [cameraType, setCameraType] = useState<'front' | 'back'>('front');
  const [asset, setAsset] = useState<Asset | null>(null);
  const [uploading, setUploading] = useState(false);

  const openCamera = () => {
    launchCamera(
      {
        mediaType: 'video',
        cameraType,
        durationLimit: 10,
        videoQuality: 'high',
        saveToPhotos: false,
      },
      (response) => {
        if (response.didCancel) return;
        const selected = response.assets?.[0];
        if (!selected?.uri) {
          flashErrorMessage();
          return;
        }
        if ((selected.duration ?? 0) > 10.5) {
          flashErrorMessage('Please record a video no longer than 10 seconds.');
          return;
        }
        setAsset(selected);
      }
    );
  };

  const submit = async () => {
    if (!asset?.uri || uploading) return;
    setUploading(true);
    try {
      const media = await ApiServices.imageUpload(
        {
          uri: asset.uri,
          name: asset.fileName ?? 'profile-intro.mp4',
          type: asset.type ?? 'video/mp4',
        },
        'intro_video',
        []
      );
      const updatedUser = { ...currentUser, media };
      updateCurrentUser(updatedUser);
      await setData(storageKeys.USER, updatedUser);
      flashSuccessMessage(LanguageKeys.mediaSubmittedForReview);
      navigation.goBack();
    } catch (error: any) {
      flashErrorMessage(error?.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={Styles.screen}>
      {asset?.uri ? (
        <Video
          source={{ uri: asset.uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          repeat
        />
      ) : (
        <View style={Styles.cameraStage}>
          <View style={Styles.faceGuide}>
            <Ionicons
              name="person-outline"
              size={wp(24)}
              color={Colors.whiteRGBA30}
            />
          </View>
          <Text style={Styles.guideTitle}>{LanguageKeys.videoIntroTitle}</Text>
          <Text style={Styles.guideCaption}>
            {LanguageKeys.tenSecondMaximum}
          </Text>
        </View>
      )}

      <View style={Styles.topBar}>
        <Ripple style={Styles.roundButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={wp(6)} color={Colors.color2} />
        </Ripple>
        {!asset ? (
          <Ripple
            style={Styles.roundButton}
            onPress={() =>
              setCameraType((value) => (value === 'front' ? 'back' : 'front'))
            }
            accessibilityLabel={LanguageKeys.flipCamera}
          >
            <Ionicons
              name="camera-reverse-outline"
              size={wp(6)}
              color={Colors.color2}
            />
          </Ripple>
        ) : null}
      </View>

      <View style={Styles.bottomPanel}>
        {asset ? (
          <View style={Styles.reviewActions}>
            <Ripple
              style={Styles.secondaryButton}
              onPress={() => setAsset(null)}
              disabled={uploading}
            >
              <Ionicons name="refresh" size={wp(5)} color={Colors.color2} />
              <Text style={Styles.buttonText}>{LanguageKeys.retake}</Text>
            </Ripple>
            <Ripple
              style={Styles.submitButton}
              onPress={submit}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <Ionicons
                  name="checkmark"
                  size={wp(5)}
                  color={Colors.primary}
                />
              )}
              <Text style={Styles.submitText}>
                {LanguageKeys.submitForReview}
              </Text>
            </Ripple>
          </View>
        ) : (
          <View style={Styles.recordWrap}>
            <Ripple style={Styles.recordOuter} onPress={openCamera}>
              <View style={Styles.recordInner} />
            </Ripple>
            <Text style={Styles.recordLabel}>{LanguageKeys.tapToRecord}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default ProfileIntroVideo;

const Styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#111017' },
  cameraStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(8),
  },
  faceGuide: {
    width: wp(58),
    height: hp(43),
    borderWidth: 2,
    borderColor: Colors.whiteRGBA30,
    borderRadius: wp(29),
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  guideTitle: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium,
    marginTop: hp(3),
    alignSelf: 'center',
  },
  guideCaption: {
    color: Colors.whiteRGBA90,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    marginTop: hp(0.6),
    alignSelf: 'center',
  },
  topBar: {
    position: 'absolute',
    top: hp(5),
    left: wp(5),
    right: wp(5),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roundButton: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(5.5),
    backgroundColor: Colors.blackRGBA50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: hp(19),
    backgroundColor: Colors.blackRGBA70,
    justifyContent: 'center',
    paddingHorizontal: wp(6),
    paddingBottom: hp(3),
  },
  recordWrap: { alignItems: 'center' },
  recordOuter: {
    width: wp(22),
    height: wp(22),
    borderRadius: wp(11),
    borderWidth: 4,
    borderColor: Colors.color2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordInner: {
    width: wp(17),
    height: wp(17),
    borderRadius: wp(8.5),
    backgroundColor: Colors.attention,
  },
  recordLabel: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small2,
    marginTop: hp(1.2),
    alignSelf: 'center',
  },
  reviewActions: { flexDirection: 'row', gap: wp(3) },
  secondaryButton: {
    flex: 1,
    minHeight: hp(6),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.whiteRGBA30,
    flexDirection: 'row',
    gap: wp(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    flex: 1.6,
    minHeight: hp(6),
    borderRadius: 16,
    backgroundColor: Colors.color2,
    flexDirection: 'row',
    gap: wp(2),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(2),
  },
  buttonText: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small1,
  },
  submitText: {
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small1,
  },
});
