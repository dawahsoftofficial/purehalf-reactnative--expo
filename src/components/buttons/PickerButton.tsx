import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl } from '../../languages';
import { Colors, Fonts } from '../../res';

const PickerButton = (props: any) => {
  const Rtl = CheckRtl();
  const {
    outerContainerStyle = {},
    buttonContainer = {},
    outerLabelStyle = {},
    buttonTextStyle = {},
    outerLabel = '',
    buttonText = '',
    onPress = () => null,
  } = props;

  const RenderBtnTxt = () => (
    <Text style={[Styles.buttonText, buttonTextStyle]}>{buttonText}</Text>
  );

  const RenderDownBtn = () => (
    <AntDesign name="down" color={Colors.muted} size={wp(3.5)} />
  );
  return (
    <View style={[Styles.container, outerContainerStyle]}>
      <Text style={[Styles.outerLabel, outerLabelStyle]}>{outerLabel}</Text>
      {Rtl ? (
        <Ripple
          style={[Styles.buttonContainer, buttonContainer]}
          onPress={onPress}
        >
          <RenderDownBtn />
          <RenderBtnTxt />
        </Ripple>
      ) : (
        <Ripple
          style={[Styles.buttonContainer, buttonContainer]}
          onPress={onPress}
        >
          <RenderBtnTxt />
          <RenderDownBtn />
        </Ripple>
      )}
    </View>
  );
};

export default PickerButton;

const Styles = StyleSheet.create({
  container: {},
  outerLabel: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small2,
    lineHeight: wp(4.5),
  },
  buttonContainer: {
    paddingVertical: hp(1.6),
    backgroundColor: Colors.surface,
    paddingHorizontal: wp(3),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.4,
    borderColor: Colors.hairline,
    borderRadius: 12,
    marginTop: hp(1),
  },
  buttonText: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    lineHeight: wp(4.5),
    alignSelf: 'center',
  },
});
