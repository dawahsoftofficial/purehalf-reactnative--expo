import React, { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { hp, wp } from '../../../global';
import { Colors, Fonts, Images } from '../../../res';

type ProfilePictureUploadProps = {
  imageUri: string;
  onPress: () => void;
};

function ProfilePictureUpload({
  imageUri,
  onPress,
}: ProfilePictureUploadProps) {
  if (imageUri) {
    return (
      <Ripple style={Styles.container} onPress={onPress}>
        <Image
          source={{ uri: imageUri }}
          resizeMode="cover"
          style={Styles.image}
        />
        <View style={Styles.cameraIconWrapper}>
          <AntDesign name="camerao" size={wp(8)} color={Colors.color2} />
        </View>
      </Ripple>
    );
  }

  return (
    <Ripple style={Styles.container} onPress={onPress}>
      <Image
        source={Images.addPhoto}
        resizeMode="contain"
        style={Styles.addImageIcon}
      />
      <Text style={Styles.addImageText}>
        Tap the image below to upload your profile picture
      </Text>
    </Ripple>
  );
}

export default memo(ProfilePictureUpload);

const Styles = StyleSheet.create({
  container: {
    marginTop: hp(3),
    width: wp(70),
    height: wp(70),
    borderRadius: 150,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
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
  addImageIcon: {
    width: 205,
    height: 205,
    opacity: 0.7,
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
});
