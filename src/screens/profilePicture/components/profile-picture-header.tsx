import React, { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

import { Text } from '../../../components';
import { Colors, Fonts, Images } from '../../../res';

type ProfilePictureHeaderProps = {
  onTooltipPress: () => void;
};

function ProfilePictureHeader({ onTooltipPress }: ProfilePictureHeaderProps) {
  return (
    <View style={Styles.headerWrapper}>
      <Text style={Styles.headerText}>Profile Picture</Text>
      <Ripple style={Styles.tooltipWrapper} onPress={onTooltipPress}>
        <Image source={Images.infoIcon} style={Styles.infoIcon} />
      </Ripple>
    </View>
  );
}

export default memo(ProfilePictureHeader);

const Styles = StyleSheet.create({
  headerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_R,
    fontSize: 20,
  },
  tooltipWrapper: {
    borderRadius: 25,
    marginLeft: 5,
  },
  infoIcon: {
    width: 25,
    height: 25,
  },
});
