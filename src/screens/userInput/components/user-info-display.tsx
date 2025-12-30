import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { hp } from '@/global';

import { IconInput } from '../../../components';
import { LanguageKeys } from '../../../languages';
import { Colors, Images } from '../../../res';

type User = {
  phone_number?: string;
  email?: string;
};

type UserInfoDisplayProps = {
  user: User | null;
  fromSettings: boolean;
};

function UserInfoDisplay({ user, fromSettings }: UserInfoDisplayProps) {
  if (!fromSettings) {
    return null;
  }

  const label = user?.phone_number
    ? LanguageKeys.phoneNumber
    : LanguageKeys.email;

  const value = user?.phone_number || user?.email || '';

  return (
    <View style={Styles.container}>
      <IconInput
        label={label}
        value={value}
        icon={Images.user}
        disabled={fromSettings}
        placeholder={LanguageKeys.enterEmail}
        outerLabelStyle={{ color: Colors.color1 }}
      />
    </View>
  );
}

export default memo(UserInfoDisplay);

const Styles = StyleSheet.create({
  container: {
    marginBottom: hp(3),
  },
});
