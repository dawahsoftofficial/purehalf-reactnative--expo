import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import Ripple from 'react-native-material-ripple';

import { Text } from '../../../components';
import { Typography } from '../../../global';
import { Colors, Fonts } from '../../../res';

type AccountActionsProps = {
  onLogoutPress: () => void;
  onDeleteAccountPress: () => void;
};

function AccountActions({
  onLogoutPress,
  onDeleteAccountPress,
}: AccountActionsProps) {
  return (
    <>
      <Ripple onPress={onLogoutPress}>
        <Text style={Styles.actionText}>logOut</Text>
      </Ripple>
      <Ripple onPress={onDeleteAccountPress}>
        <Text style={Styles.actionText}>deleteAccount</Text>
      </Ripple>
    </>
  );
}

export default memo(AccountActions);

const Styles = StyleSheet.create({
  actionText: {
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_R,
    color: Colors.theme,
    textDecorationLine: 'underline',
    alignSelf: 'center',
    marginTop: 10,
  },
});
