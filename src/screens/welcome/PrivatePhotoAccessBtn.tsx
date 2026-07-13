import React from 'react';
import { StyleSheet, Text as ReactText, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';

const PrivatePhotoAccessBtn = (props: any) => {
  const { navigation = {}, photoRequests = null } = props;
  const Rtl = CheckRtl();

  const onPress = () => {
    navigation.navigate('PrivatePhotoRequest');
  };
  return (
    <Ripple
      rippleColor={Colors.primary}
      style={[Styles.container, { flexDirection: Rtl ? 'row-reverse' : 'row' }]}
      onPress={onPress}
    >
      <View style={Styles.iconWrap}>
        <Ionicons name="images-outline" size={wp(5)} color={Colors.primary} />
        {photoRequests ? (
          <View style={Styles.badge}>
            <ReactText style={Styles.badgeTxt} numberOfLines={1}>
              {Number(photoRequests) > 99 ? '99+' : photoRequests}
            </ReactText>
          </View>
        ) : null}
      </View>
      <Text style={Styles.text} numberOfLines={2}>
        {LanguageKeys.privatePhotoBtnDes}
      </Text>
      <Ionicons
        name={Rtl ? 'chevron-back' : 'chevron-forward'}
        color={Colors.primary}
        size={wp(5)}
      />
    </Ripple>
  );
};

export default PrivatePhotoAccessBtn;

const Styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1.3),
    backgroundColor: Colors.lavender,
    marginTop: hp(1.4),
    marginHorizontal: wp(3),
    gap: wp(3),
  },
  iconWrap: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -wp(1),
    right: -wp(1),
    minWidth: wp(4.6),
    height: wp(4.6),
    borderRadius: wp(2.3),
    paddingHorizontal: wp(1),
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.lavender,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeTxt: {
    color: Colors.surface,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.tiny,
    includeFontPadding: false,
  },
  text: {
    flex: 1,
    alignSelf: 'center',
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small1,
    includeFontPadding: false,
  },
});
