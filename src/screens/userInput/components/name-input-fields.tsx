import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { IconInput } from '../../../components';
import { wp } from '../../../global';
import { LanguageKeys } from '../../../languages';
import { Colors, Images } from '../../../res';

type NameInputFieldsProps = {
  firstName: string;
  lastName: string;
  onFirstNameChange: (text: string) => void;
  onLastNameChange: (text: string) => void;
  fromSettings: boolean;
};

function NameInputFields({
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
  fromSettings,
}: NameInputFieldsProps) {
  const labelColor = fromSettings ? Colors.color1 : Colors.color1;

  return (
    <View style={Styles.container}>
      <View style={Styles.inputFieldCon}>
        <IconInput
          label={LanguageKeys.firstName}
          placeholder={LanguageKeys.enterFirstName}
          icon={Images.user}
          value={firstName}
          onChangeText={onFirstNameChange}
          inputStyle={Styles.inputStyle}
          outerLabelStyle={{ color: labelColor }}
        />
      </View>
      <View style={Styles.inputFieldCon}>
        <IconInput
          label={LanguageKeys.lastName}
          placeholder={LanguageKeys.enterLastName}
          icon={Images.user}
          value={lastName}
          onChangeText={onLastNameChange}
          inputStyle={Styles.inputStyle}
          outerLabelStyle={{ color: labelColor }}
        />
      </View>
    </View>
  );
}

export default memo(NameInputFields);

const Styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputFieldCon: {
    marginBottom: 0,
  },
  inputStyle: {
    width: wp(35),
  },
});
