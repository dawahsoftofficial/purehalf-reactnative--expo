import React from 'react';
import {
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Animation } from '../../animations';
import { hp, Typography, wp } from '../../global';
import { Colors, Fonts, Images } from '../../res';
import { isIOS } from '../../services';
import { Button } from '../buttons';
import Text from '../Text';

const ImagePicker = (props: any) => {
  const { from = '', visible = false, onClose = () => null } = props;

  const onCameraPress = () => {
    let options: any = {};
    if (from === 'video') {
      options = {
        mediaType: 'video',
        videoQuality: 'high',
        cameraType: 'front',
        durationLimit: 25,
      };
    } else {
      options = {
        mediaType: 'photo',
        quality: 0.5,
        cameraType: 'back',
      };
    }

    launchCamera(options, (res) => {
      if (!res?.didCancel && res?.assets && res.assets.length > 0) {
        if (props?.onImageSelection) {
          props.onImageSelection(res.assets);
        }
      }
    });
  };

  const onImageLibraryPress = () => {
    let options: any = {};
    if (from === 'video') {
      options = {
        mediaType: 'video',
        durationLimit: 15,
      };
    } else {
      options = {
        mediaType: 'photo',
        quality: 0.5,
        selectionLimit:
          from === 'cover_image' || from === 'primary_image_to_show' ? 1 : 10,
        presentationStyle: 'pageSheet',
      };
    }
    launchImageLibrary(options, (res) => {
      if (!res?.didCancel && res?.assets && res.assets.length > 0) {
        if (props?.onImageSelection) {
          props.onImageSelection(res.assets);
        }
      }
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <StatusBar
        backgroundColor={Colors.blackRGBA50}
        barStyle="light-content"
      />
      <TouchableOpacity
        style={Styles.container}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={Styles.innerContainer}
          onStartShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
        >
          <Animation style={Styles.animationContainer}>
            <View style={Styles.headerCon}>
              <Text style={Styles.headerTxt} numberOfLines={1}>
                Select option
              </Text>
              <AntDesign
                name="close"
                color={Colors.color1}
                size={wp(5)}
                style={Styles.closeBtn}
                onPress={onClose}
              />
            </View>
            <Button
              text="Camera"
              buttonStyle={Styles.button}
              icon={
                <Ionicons
                  name="camera-outline"
                  color={Colors.color2}
                  size={wp(6)}
                  style={{ marginHorizontal: wp(2) }}
                />
              }
              onPress={onCameraPress}
            />
            <Button
              text={isIOS ? 'Photo library' : 'Gallery'}
              buttonStyle={{ ...Styles.button, marginTop: hp(3) }}
              icon={
                <Image
                  source={Images.galleryWhite}
                  style={{
                    width: wp(5.5),
                    height: hp(5),
                    marginHorizontal: wp(2),
                  }}
                  resizeMode="contain"
                />
              }
              onPress={onImageLibraryPress}
            />
          </Animation>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default ImagePicker;

const Styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.blackRGBA50,
    justifyContent: 'flex-end',
    flex: 1,
    paddingTop: hp(12),
  },
  innerContainer: {
    backgroundColor: Colors.color2,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    paddingBottom: hp(5),
  },
  animationContainer: {
    width: '100%',
  },
  headerCon: {
    borderBottomWidth: 0.2,
    borderBottomColor: Colors.color4,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    paddingVertical: hp(1.5),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.color8,
    marginBottom: hp(3),
  },
  headerTxt: {
    color: Colors.color1,
    alignSelf: 'center',
    textAlign: 'center',
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small2,
    lineHeight: wp(5),
    maxWidth: wp(80),
  },
  closeBtn: {
    alignSelf: 'flex-end',
    marginBottom: hp(1),
    position: 'absolute',
    paddingHorizontal: wp(2),
  },
  button: {
    width: wp(80),
    alignSelf: 'center',
  },
  buttonTxt: {
    textAlign: 'center',
    alignSelf: 'center',
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_SB,
    includeFontPadding: false,
    fontSize: Typography.medium,
  },
});
