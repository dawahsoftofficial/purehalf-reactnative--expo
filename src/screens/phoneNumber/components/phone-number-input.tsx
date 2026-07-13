import React, { memo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { Text } from '@/components';

import { Typography, wp } from '../../../global';
import { CheckRtl } from '../../../languages';
import { Colors, Fonts } from '../../../res';
import { isIOS } from '../../../services';

type Country = {
  code: string;
  dial_code: string;
  flag: string;
  name: string;
};

type PhoneNumberInputProps = {
  phoneNumber: string;
  selectedCountry: Country;
  onPhoneNumberChange: (text: string) => void;
  onCountryPress: () => void;
};

function PhoneNumberInput({
  phoneNumber,
  selectedCountry,
  onPhoneNumberChange,
  onCountryPress,
}: PhoneNumberInputProps) {
  const Rtl = CheckRtl();

  return (
    <View
      style={[Styles.container, { flexDirection: Rtl ? 'row-reverse' : 'row' }]}
    >
      <Ripple
        style={[
          Styles.flagButton,
          { flexDirection: Rtl ? 'row-reverse' : 'row' },
        ]}
        onPress={onCountryPress}
      >
        <Text style={Styles.flag}>{selectedCountry.flag}</Text>
        <Text style={Styles.dialCode}>{selectedCountry.dial_code}</Text>
        <AntDesign
          name="caretdown"
          size={wp(3)}
          color={Colors.color1}
          style={Styles.caret}
        />
      </Ripple>
      <TextInput
        style={[Styles.input, { textAlign: Rtl ? 'right' : 'left' }]}
        keyboardType="number-pad"
        value={phoneNumber}
        onChangeText={onPhoneNumberChange}
        placeholderTextColor={Colors.color1}
      />
    </View>
  );
}

export default memo(PhoneNumberInput);

const Styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: Colors.color1,
    height: wp(11),
    alignItems: 'center',
    marginVertical: 12,
  },
  flagButton: {
    height: wp(11),
    minWidth: wp(18),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flag: {
    fontSize: wp(8),
    includeFontPadding: false,
    alignSelf: 'center',
    paddingBottom: wp(!isIOS ? 0.2 : 0),
  },
  dialCode: {
    fontSize: Typography.medium,
    marginHorizontal: wp(0.5),
    paddingBottom: wp(!isIOS ? 0.2 : 0),
    paddingRight: wp(!isIOS ? 0.2 : 0),
    includeFontPadding: false,
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color1,
    alignSelf: 'center',
  },
  caret: {
    marginLeft: wp(1),
  },
  input: {
    color: Colors.color1,
    height: wp(11),
    width: wp(70),
    paddingVertical: 4,
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_R,
    paddingHorizontal: wp(2),
  },
});
