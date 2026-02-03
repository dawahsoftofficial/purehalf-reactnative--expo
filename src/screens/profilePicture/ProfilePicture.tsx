import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import * as ImagePickCrop from 'react-native-image-crop-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import { hp, wp } from '@/global';
import { Colors } from '@/res';

import { Button, ImagePicker } from '../../components';
import { LanguageKeys } from '../../languages';
import {
  ApiServices,
  flashSuccessMessage,
  isIOS,
  StorageManager,
  useGlobalContext,
} from '../../services';
import { addAnaylatics } from '../../services/firebase/analytics';
import GuidelinesModal from './components/guidelines-modal';
import ProfilePictureHeader from './components/profile-picture-header';
import ProfilePictureUpload from './components/profile-picture-upload';
import UploadProgress from './components/upload-progress';

type ImageData = {
  uri: string;
  type: string;
  [key: string]: unknown;
};

type CroppedImage = {
  path?: string;
  height?: number;
  width?: number;
  size?: number;
  [key: string]: unknown;
};

type ResizedImageObj = {
  uri: string;
  name: string;
  height: number;
  width: number;
  size: number;
};

type User = {
  gender?: string;
  guardian?: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone_number?: string;
  media?: {
    primary_image?: string;
    un_blur_primary_image?: string;
  };
  [key: string]: unknown;
};

type ProfilePictureResponse = {
  results?: {
    primary_image?: string;
    un_blur_primary_image?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type ProfilePictureProps = {
  navigation: {
    reset: (config: { index: number; routes: Array<{ name: string }> }) => void;
  };
};

function ProfilePicture(props: ProfilePictureProps) {
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const { setData, storageKeys } = StorageManager;
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [image, setImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingProgress, setUploadingProgress] = useState(0);
  const [toolTipVisible, setToolTipVisible] = useState(false);

  const onAddImagePress = useCallback(() => {
    setImagePickerVisible(true);
  }, []);

  const hideImagePicker = useCallback(() => {
    setImagePickerVisible(false);
  }, []);

  const showTooltip = useCallback(() => {
    setToolTipVisible(true);
  }, []);

  const hideTooltip = useCallback(() => {
    setToolTipVisible(false);
  }, []);

  const handleUploadProgress = useCallback((progress: number) => {
    let progressValue = Number(progress) || 0;

    // Debug: Log the raw progress value to understand what we're receiving
    console.log('[Upload Progress] Raw value:', progressValue);

    // If progress is between 0 and 1, it's a decimal - convert to percentage
    if (progressValue > 0 && progressValue <= 1) {
      progressValue = progressValue * 100;
    }
    // If progress is between 1 and 10, it might be a scaled value - convert to percentage
    else if (progressValue > 1 && progressValue <= 10) {
      progressValue = (progressValue / 10) * 100;
    }

    // Ensure progress is between 0 and 100
    progressValue = Math.min(Math.max(progressValue, 0), 100);

    console.log('[Upload Progress] Normalized value:', progressValue);

    // Use requestAnimationFrame to ensure state updates happen on next frame
    requestAnimationFrame(() => {
      setUploadingProgress(progressValue);
    });
  }, []);

  const resetUploadState = useCallback(() => {
    setUploading(false);
    setUploadingProgress(0);
  }, []);

  const onImageSelection = useCallback(
    (data: ImageData[]) => {
      if (!data || data.length === 0) {
        return;
      }

      const firstImage = data[0];
      if (!firstImage?.uri) {
        return;
      }

      ImagePickCrop.openCropper({
        path: firstImage.uri,
        mediaType: 'photo',
        width: 450,
        height: 450,
      })
        .then((croppedImage: unknown) => {
          const image = croppedImage as CroppedImage;
          const pathParts = image.path?.split('/') || [];
          const resizedImageObj: ResizedImageObj = {
            height: image.height || 0,
            width: image.width || 0,
            uri: image.path || '',
            name: pathParts[pathParts.length - 1] || 'image.jpg',
            size: image.size || 0,
          };

          setUploading(true);
          setUploadingProgress(0);

          ApiServices.addProfilePicture(resizedImageObj, handleUploadProgress)
            .then(async (res: unknown) => {
              const response = res as ProfilePictureResponse;
              const result = response?.results;

              // Use primary_image from API response (or un_blur_primary_image as fallback)
              const primaryImage = result?.un_blur_primary_image || '';

              // Update user with profile picture from API response
              const user: User = {
                ...(currentUser as User),
                media: {
                  un_blur_primary_image: primaryImage,
                },
              };

              updateCurrentUser(user);
              await setData(storageKeys.USER, user);

              flashSuccessMessage('Profile Picture Updated');
              setImage(resizedImageObj.uri);
              resetUploadState();
            })
            .catch((error) => {
              console.error('Error uploading profile picture:', error);
              resetUploadState();
            });
        })
        .catch((error) => {
          console.error('Error cropping image:', error);
          resetUploadState();
        });
    },
    [
      currentUser,
      handleUploadProgress,
      resetUploadState,
      setData,
      storageKeys.USER,
      updateCurrentUser,
    ]
  );

  const onContinuePress = useCallback(() => {
    const user = currentUser as User;

    // Check if user has already completed onboarding
    // Indicators: membership_status is set, or they have profile details (detail object with data)
    const hasMembership =
      user?.membership_status !== null &&
      user?.membership_status !== undefined &&
      user?.membership_status !== 0;

    const hasProfileDetails =
      user?.detail &&
      typeof user.detail === 'object' &&
      Object.keys(user.detail).length > 0;

    const hasCompletedOnboarding = hasMembership || hasProfileDetails;

    if (hasCompletedOnboarding) {
      // Existing user updating profile picture - go directly to BottomTab
      props.navigation.reset({
        index: 0,
        routes: [{ name: 'BottomTab' }],
      });
      return;
    }

    // New user during signup - go through onboarding flow
    const info = {
      gender: user?.gender || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phoneNumber: user?.phone_number || '',
    };

    // Facebook Event For complete Registration
    // AppEventsLogger.logEvent(AppEventsLogger.AppEvents.CompletedRegistration, {
    //   [AppEventsLogger.AppEventParams.RegistrationMethod]: 'email',
    //   ...info,
    // });
    addAnaylatics('complete_registration', info);

    // For females: if they already have guardian, skip AddWali
    const isFemale = user?.gender === 'female';
    const hasGuardian = Boolean(user?.guardian);
    const nextRoute = isFemale && !hasGuardian ? 'AddWali' : 'WelcomeUser';

    props.navigation.reset({
      index: 0,
      routes: [{ name: nextRoute }],
    });
  }, [currentUser, props.navigation]);

  const handleImagePickerSelection = useCallback(
    (res: ImageData[]) => {
      hideImagePicker();
      setTimeout(
        () => {
          onImageSelection(res);
        },
        isIOS ? 1000 : 0
      );
    },
    [hideImagePicker, onImageSelection]
  );

  const isButtonDisabled = useMemo(() => image.length === 0, [image]);

  return (
    <SafeAreaView style={Styles.container}>
      <GuidelinesModal
        visible={toolTipVisible}
        user={currentUser as User}
        onClose={hideTooltip}
      />
      <ScrollView contentContainerStyle={Styles.scrollContainer}>
        <View style={Styles.innerContainer}>
          <ProfilePictureHeader onTooltipPress={showTooltip} />
          {uploading ? (
            <UploadProgress progress={uploadingProgress} />
          ) : (
            <ProfilePictureUpload imageUri={image} onPress={onAddImagePress} />
          )}
        </View>
        <View style={Styles.btnWrapper}>
          <Button
            disabled={isButtonDisabled}
            text={LanguageKeys.continue}
            onPress={onContinuePress}
            buttonStyle={Styles.continueButton}
          />
        </View>
        <ImagePicker
          from="primary_image_to_show"
          onClose={hideImagePicker}
          visible={imagePickerVisible}
          onImageSelection={handleImagePickerSelection}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

export default ProfilePicture;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.color2,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: wp(4),
    paddingBottom: hp(1.5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  btnWrapper: {
    width: '100%',
  },
  continueButton: {},
});
