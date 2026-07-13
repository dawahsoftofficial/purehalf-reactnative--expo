import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import Ripple from 'react-native-material-ripple';

import { Text } from '../../../components';
import { hp, Typography } from '../../../global';
import { LanguageKeys } from '../../../languages';
import { Colors, Fonts } from '../../../res';

type ReportLinkProps = {
  isReported: boolean;
  onPress: () => void;
};

function ReportLink({ isReported, onPress }: ReportLinkProps) {
  const textColor = isReported ? Colors.randomRGBA70 : Colors.color44;

  return (
    <Ripple
      style={Styles.reportContainer}
      onPress={isReported ? () => {} : onPress}
    >
      <Text style={[Styles.reportText, { color: textColor }]}>
        {LanguageKeys.report}
      </Text>
    </Ripple>
  );
}

export default memo(ReportLink);

const Styles = StyleSheet.create({
  reportContainer: {
    marginTop: hp(2),
  },
  reportText: {
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_M,
    alignSelf: 'center',
    textDecorationLine: 'underline',
  },
});
