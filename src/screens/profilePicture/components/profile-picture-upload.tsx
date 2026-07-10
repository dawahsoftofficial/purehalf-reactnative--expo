import React, { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { hp, Typography, wp } from '../../../global';
import { Colors, Fonts } from '../../../res';

type ProfilePictureUploadProps = {
  imageUri: string;
  onPress: () => void;
};

const RING = wp(56);

function ProfilePictureUpload({
  imageUri,
  onPress,
}: ProfilePictureUploadProps) {
  const hasImage = Boolean(imageUri);

  return (
    <View style={Styles.wrapper}>
      <Ripple
        style={Styles.ring}
        onPress={onPress}
        rippleContainerBorderRadius={RING / 2}
      >
        {hasImage ? (
          <Image
            source={{ uri: imageUri }}
            resizeMode="cover"
            style={Styles.image}
          />
        ) : (
          <Ionicons name="person" size={wp(26)} color={Colors.primaryLite} />
        )}
        <View style={Styles.badge}>
          <Ionicons
            name={hasImage ? 'camera' : 'add'}
            size={wp(5)}
            color={Colors.color2}
          />
        </View>
      </Ripple>
      <Text style={Styles.caption}>
        {hasImage ? 'Tap to change your photo' : 'Tap to upload'}
      </Text>
    </View>
  );
}

export default memo(ProfilePictureUpload);

const Styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginTop: hp(4),
  },
  ring: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    backgroundColor: Colors.lavender,
    borderWidth: 2,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: RING / 2,
  },
  badge: {
    position: 'absolute',
    right: wp(3),
    bottom: wp(3),
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.appBg,
  },
  caption: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small2,
    marginTop: hp(2),
  },
});
