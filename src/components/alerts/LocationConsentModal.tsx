import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';
import { Button } from '../buttons';
import Text from '../Text';
import AlertContainer from './AlertContainer';

type LocationConsentModalProps = {
  visible?: boolean;
  onClose?: () => void;
  onContinue?: () => void;
};

const LocationConsentModal = (props: LocationConsentModalProps) => {
  const {
    visible = false,
    onClose = () => null,
    onContinue = () => null,
  } = props;

  return (
    <AlertContainer visible={visible} onClose={onClose}>
      <View style={Styles.contentContainer}>
        <Image
          source={Images.mapIcon}
          resizeMode="contain"
          style={Styles.icon}
        />
        <Text style={Styles.heading}>
          {LanguageKeys.locationConsentHeading}
        </Text>
        <Text style={Styles.description}>
          {LanguageKeys.locationConsentDescription}
        </Text>
        <Button
          text={LanguageKeys.continue}
          buttonStyle={Styles.button}
          onPress={onContinue}
        />
      </View>
    </AlertContainer>
  );
};

export default LocationConsentModal;

const Styles = StyleSheet.create({
  contentContainer: {
    alignItems: 'center',
  },
  icon: {
    width: wp(10),
    height: hp(6),
  },
  heading: {
    alignSelf: 'center',
    textAlign: 'center',
    lineHeight: wp(7),
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.large1,
    color: Colors.color1,
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  description: {
    alignSelf: 'center',
    textAlign: 'center',
    lineHeight: wp(5),
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    color: Colors.color1,
    marginHorizontal: wp(4),
  },
  button: {
    width: wp(80),
    marginTop: hp(5),
    marginBottom: hp(3),
  },
});
