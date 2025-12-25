import React, { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { Button } from '../../../components';
import { hp, wp } from '../../../global';
import { LanguageKeys } from '../../../languages';
import { Colors } from '../../../res';
import { isIOS } from '../../../services';

type ButtonStatus = {
  is_apple?: number;
  is_phone?: number;
  is_google?: number;
};

type AuthButtonsProps = {
  buttonStatus: ButtonStatus | null;
  loading: boolean;
  checkBox: boolean;
  onContinuePress: (type: 'phone' | 'google' | 'apple') => void;
};

function AuthButtons({
  buttonStatus,
  loading,
  checkBox,
  onContinuePress,
}: AuthButtonsProps) {
  const buttons = useMemo(() => {
    const buttonList = [];

    if (isIOS && buttonStatus?.is_apple === 1) {
      buttonList.push({
        key: 'apple',
        text: LanguageKeys.startWithWithApple,
        icon: 'apple',
        buttonStyle: [Styles.appleBtn, !checkBox && { opacity: 0.7 }],
      });
    }

    if (buttonStatus?.is_google === 1) {
      buttonList.push({
        key: 'google',
        text: LanguageKeys.startWithWithGoogle,
        icon: 'google',
        buttonStyle: [Styles.googleBtn, !checkBox && { opacity: 0.7 }],
      });
    }

    if (buttonStatus?.is_phone === 1) {
      buttonList.push({
        key: 'phone',
        text: LanguageKeys.startWithWithPhone,
        icon: 'cellphone',
        buttonStyle: { marginTop: hp(2) },
      });
    }

    return buttonList;
  }, [buttonStatus, checkBox]);

  return (
    <>
      {buttons.map((button) => (
        <Button
          key={button.key}
          text={button.text}
          onPress={() =>
            onContinuePress(button.key as 'phone' | 'google' | 'apple')
          }
          loading={loading}
          disabled={!checkBox}
          buttonStyle={button.buttonStyle}
          icon={
            <MaterialCommunityIcons
              name={button.icon}
              size={wp(5)}
              color={Colors.color2}
            />
          }
        />
      ))}
    </>
  );
}

export default memo(AuthButtons);

const Styles = StyleSheet.create({
  googleBtn: {
    backgroundColor: Colors.color60,
    marginTop: hp(2),
  },
  appleBtn: {
    backgroundColor: Colors.color1,
    marginTop: hp(2),
  },
});
