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

// Portrait-oriented card (not a circle) with a gentle tilt, reading as a
// kept photo rather than a generic avatar widget. Corner radius stays
// modest deliberately -- combining a large radius with a dashed border has
// known rendering quirks on Android, so the inset frame is a solid line
// instead.
const CARD_WIDTH = wp(38);
const CARD_HEIGHT = wp(49);
const CARD_RADIUS = wp(4.5);

function ProfilePictureUpload({
  imageUri,
  onPress,
}: ProfilePictureUploadProps) {
  const hasImage = Boolean(imageUri);

  return (
    <View style={Styles.wrapper}>
      <Ripple
        style={Styles.card}
        onPress={onPress}
        rippleContainerBorderRadius={CARD_RADIUS}
      >
        {hasImage ? (
          <Image
            source={{ uri: imageUri }}
            resizeMode="cover"
            style={Styles.image}
          />
        ) : (
          <>
            <View style={Styles.inset} />
            <Ionicons
              name="camera-outline"
              size={wp(11)}
              color={Colors.primaryMid}
            />
          </>
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
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: CARD_RADIUS,
    backgroundColor: Colors.lavender,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-2deg' }],
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 5,
  },
  inset: {
    position: 'absolute',
    top: wp(2.2),
    left: wp(2.2),
    right: wp(2.2),
    bottom: wp(2.2),
    borderWidth: 1.5,
    borderColor: Colors.primaryLite,
    borderRadius: CARD_RADIUS - wp(1.5),
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: CARD_RADIUS,
  },
  badge: {
    position: 'absolute',
    right: -wp(2.2),
    bottom: -wp(2.2),
    width: wp(10.5),
    height: wp(10.5),
    borderRadius: wp(3),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: Colors.appBg,
  },
  caption: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small2,
    marginTop: hp(2),
  },
});
