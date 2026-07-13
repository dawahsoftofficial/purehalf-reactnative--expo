import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
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
        <View style={Styles.iconCircle}>
          <Ionicons name="location-sharp" size={wp(9)} color={Colors.primary} />
        </View>
        <Text variant="display" style={Styles.heading}>
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
    paddingHorizontal: wp(3),
  },
  iconCircle: {
    width: wp(18),
    height: wp(18),
    borderRadius: wp(9),
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(1),
  },
  heading: {
    alignSelf: 'center',
    textAlign: 'center',
    lineHeight: wp(7.5),
    fontSize: Typography.large1,
    color: Colors.ink,
    marginTop: hp(2.5),
    marginBottom: hp(1),
  },
  description: {
    alignSelf: 'center',
    textAlign: 'center',
    lineHeight: wp(5.4),
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    color: Colors.muted,
    marginHorizontal: wp(4),
  },
  button: {
    width: wp(78),
    marginTop: hp(3.5),
    marginBottom: hp(1),
  },
});
