import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AlertContainer, Button, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors } from '../../res';

const ConfirmAlert = (props: any) => {
  const { visible = false, onClose = () => null, onPress = () => null } = props;
  return (
    <AlertContainer visible={visible} onClose={onClose}>
      <Text variant="display" style={Styles.heading}>
        {LanguageKeys.saveSearchSureAlert}
      </Text>
      <View style={Styles.btnsCon}>
        <Button
          variant="outline"
          text={LanguageKeys.cancel}
          buttonStyle={Styles.btn}
          onPress={onClose}
        />
        <Button
          text={LanguageKeys.yes}
          buttonStyle={Styles.btn}
          onPress={onPress}
        />
      </View>
    </AlertContainer>
  );
};

export default ConfirmAlert;

const Styles = StyleSheet.create({
  heading: {
    fontSize: Typography.medium1,
    color: Colors.ink,
    includeFontPadding: false,
    alignSelf: 'center',
    textAlign: 'center',
  },
  btn: {
    marginTop: hp(3),
    marginBottom: hp(1),
    flex: 1,
    marginHorizontal: wp(1.5),
  },
  btnsCon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(6),
    paddingTop: hp(1),
  },
});
