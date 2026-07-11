import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, TextInput, View } from 'react-native';

import { hp, Typography, wp } from '../../global';
import { CheckRtl } from '../../languages';
import { Colors, Fonts } from '../../res';
import { Text } from '..';

const IconInput = React.memo((props: any) => {
  const Rtl = CheckRtl();
  const { t }: any = useTranslation();
  const {
    icon = null,
    iconStyle = null,
    inputStyle = null,
    outerLabelStyle = {},
    containerStyle = {},
    label = '',
    value = '',
    onChangeText = () => null,
    onFocus = () => null,
    onBlur = () => null,
    placeholder = '',
    placeholderColor = Colors.muted,
    secureTextEntry = false,
    disabled = false,
    multiline = false,
    numberOfLines,
    maxLength,
  } = props;

  const iconElement = useMemo(() => {
    if (!icon) return null;
    return (
      <Image
        source={icon}
        resizeMode="contain"
        style={[Styles.inputIcon, iconStyle]}
      />
    );
  }, [icon, iconStyle]);

  return (
    <View style={[Styles.container, containerStyle]}>
      <Text style={[Styles.inputLabel, outerLabelStyle]}>{label}</Text>
      {Rtl ? (
        <View
          style={[
            Styles.inputOuterContainer,
            { backgroundColor: disabled ? Colors.lavender : Colors.surface },
            multiline && Styles.inputOuterContainerMultiline,
          ]}
        >
          <TextInput
            style={[
              Styles.input,
              {
                textAlign: Rtl ? 'right' : 'left',
                paddingRight: icon ? 0 : wp(2),
                paddingLeft: wp(2),
              },
              multiline && Styles.inputMultiline,
              inputStyle,
            ]}
            placeholder={t(placeholder)}
            placeholderTextColor={placeholderColor}
            value={value}
            onChangeText={onChangeText}
            onFocus={onFocus}
            onBlur={onBlur}
            multiline={multiline}
            numberOfLines={numberOfLines}
            maxLength={maxLength}
            textAlignVertical={multiline ? 'top' : 'center'}
            secureTextEntry={secureTextEntry}
            editable={!disabled}
          />
          {iconElement}
        </View>
      ) : (
        <View
          style={[
            Styles.inputOuterContainer,
            { backgroundColor: disabled ? Colors.lavender : Colors.surface },
            multiline && Styles.inputOuterContainerMultiline,
          ]}
        >
          {iconElement}
          <TextInput
            style={[
              Styles.input,
              {
                textAlign: Rtl ? 'right' : 'left',
                paddingLeft: icon ? 0 : wp(2),
                paddingRight: wp(2),
              },
              multiline && Styles.inputMultiline,
              inputStyle,
            ]}
            placeholder={t(placeholder)}
            placeholderTextColor={placeholderColor}
            value={value}
            onChangeText={onChangeText}
            onFocus={onFocus}
            onBlur={onBlur}
            multiline={multiline}
            numberOfLines={numberOfLines}
            maxLength={maxLength}
            textAlignVertical={multiline ? 'top' : 'center'}
            secureTextEntry={secureTextEntry}
            editable={!disabled}
          />
        </View>
      )}
    </View>
  );
});

IconInput.displayName = 'IconInput';

export default IconInput;

const Styles = StyleSheet.create({
  container: {},
  inputLabel: {
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_M,
    color: Colors.ink,
  },
  inputOuterContainer: {
    borderWidth: 1.4,
    borderColor: Colors.hairline,
    borderRadius: 12,
    marginTop: hp(0.8),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(2),
    backgroundColor: Colors.surface,
  },
  inputOuterContainerMultiline: {
    alignItems: 'flex-start',
    paddingVertical: hp(1.2),
  },
  input: {
    height: hp(6.3),
    fontSize: Typography.small3,
    fontFamily: Fonts.APPFONT_R,
    includeFontPadding: false,
    width: wp(80),
    color: Colors.ink,
  },
  inputMultiline: {
    height: hp(16),
    paddingTop: 0,
  },
  inputIcon: {
    width: wp(4),
    height: hp(3),
    marginHorizontal: wp(3),
  },
});
