import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import Ripple from 'react-native-material-ripple';

import { Text } from '../../../components';
import { hp, Typography } from '../../../global';
import { LanguageKeys } from '../../../languages';
import { Colors, Fonts } from '../../../res';

type TryAgainLinkProps = {
  onPress: () => void;
};

function TryAgainLink({ onPress }: TryAgainLinkProps) {
  return (
    <Ripple onPress={onPress}>
      <Text style={Styles.locationText}>{LanguageKeys.tryAgain}</Text>
    </Ripple>
  );
}

export default memo(TryAgainLink);

const Styles = StyleSheet.create({
  locationText: {
    marginTop: hp(5),
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_M,
    color: Colors.color4,
    alignSelf: 'center',
    textDecorationLine: 'underline',
  },
});
