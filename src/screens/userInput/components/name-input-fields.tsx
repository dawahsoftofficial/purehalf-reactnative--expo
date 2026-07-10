import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { IconInput } from '../../../components';
import { wp } from '../../../global';
import { LanguageKeys } from '../../../languages';
import { Colors } from '../../../res';

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
}: NameInputFieldsProps) {
  const labelColor = Colors.ink;

  return (
    <View style={Styles.container}>
      <View style={Styles.field}>
        <IconInput
          label={LanguageKeys.firstName}
          placeholder={LanguageKeys.enterFirstName}
          value={firstName}
          onChangeText={onFirstNameChange}
          containerStyle={Styles.fill}
          inputStyle={Styles.inputStyle}
          outerLabelStyle={{ color: labelColor }}
        />
      </View>
      <View style={Styles.field}>
        <IconInput
          label={LanguageKeys.lastName}
          placeholder={LanguageKeys.enterLastName}
          value={lastName}
          onChangeText={onLastNameChange}
          containerStyle={Styles.fill}
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
    alignItems: 'flex-start',
    gap: wp(3),
  },
  field: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  inputStyle: {
    flex: 1,
    width: undefined,
  },
});
