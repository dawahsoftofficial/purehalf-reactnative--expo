import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { AlertContainer, Button, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';

const SaveAndSearchAlert = (props: any) => {
  const Rtl = CheckRtl();
  const { t }: any = useTranslation();
  const [input, setInput] = useState('');
  const { visible = false } = props;

  const onChangeText = (text: any) => {
    setInput(text);
  };

  const onClose = () => {
    setInput('');
    props.onClose();
  };

  const onPress = () => {
    setInput('');
    if (props?.onPress) {
      props?.onPress(input);
    }
  };

  return (
    <AlertContainer visible={visible} onClose={onClose}>
      <View style={Styles.inputContainer}>
        <Text variant="display" style={Styles.inputOuterLabel}>
          {LanguageKeys.nameYourSearch}
        </Text>
        <View style={Styles.inputOuterContainer}>
          <TextInput
            style={{ ...Styles.input, textAlign: Rtl ? 'right' : 'left' }}
            placeholder={t(LanguageKeys.nameYourSearch)}
            placeholderTextColor={Colors.muted}
            value={input}
            onChangeText={onChangeText}
            maxLength={100}
          />
        </View>
      </View>
      <Button
        text={LanguageKeys.saveAndSearch}
        icon={<Ionicons name="search" color={Colors.color2} size={wp(5)} />}
        buttonStyle={Styles.searchBtn}
        onPress={onPress}
        disabled={!input.trim()}
      />
    </AlertContainer>
  );
};

export default SaveAndSearchAlert;

const Styles = StyleSheet.create({
  inputContainer: {
    paddingHorizontal: wp(4),
    marginBottom: hp(2),
  },
  inputOuterLabel: {
    fontSize: Typography.medium1,
    color: Colors.ink,
    lineHeight: wp(6),
  },
  searchBtn: {
    marginHorizontal: wp(4),
    marginTop: hp(1),
    marginBottom: hp(2),
  },
  inputOuterContainer: {
    borderWidth: 1.4,
    borderColor: Colors.hairline,
    borderRadius: 12,
    marginTop: hp(1.6),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: wp(2),
  },
  input: {
    height: hp(6.3),
    paddingHorizontal: wp(3),
    fontSize: Typography.small3,
    fontFamily: Fonts.APPFONT_R,
    flex: 1,
    color: Colors.ink,
  },
});
