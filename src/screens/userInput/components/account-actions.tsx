import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

import { Button, Text } from '../../../components';
import { hp, Typography, wp } from '../../../global';
import { LanguageKeys } from '../../../languages';
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
    <View style={Styles.container}>
      <Button
        text={LanguageKeys.logOut}
        variant="outline"
        onPress={onLogoutPress}
        buttonStyle={Styles.logoutBtn}
      />
      <Ripple style={Styles.deleteBtn} onPress={onDeleteAccountPress}>
        <Text style={Styles.deleteText}>{LanguageKeys.deleteAccount}</Text>
      </Ripple>
    </View>
  );
}

export default memo(AccountActions);

const Styles = StyleSheet.create({
  container: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(2),
  },
  logoutBtn: {
    height: hp(6),
  },
  deleteBtn: {
    alignSelf: 'center',
    paddingVertical: hp(1.2),
    marginTop: hp(0.5),
  },
  deleteText: {
    fontSize: Typography.small2,
    fontFamily: Fonts.APPFONT_M,
    color: Colors.color24,
    alignSelf: 'center',
  },
});
