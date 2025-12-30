import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { Picker, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';

const AgeRange = (props: any) => {
  const [ageRange, setAgeRange] = useState([
    { label: LanguageKeys.any, value: LanguageKeys.any },
  ]);
  const { onClearPress = () => null } = props;
  const Rtl = CheckRtl();

  const [minAge, setMinAge] = useState<any>(LanguageKeys.any);
  const [maxAge, setMaxAge] = useState<any>(LanguageKeys.any);

  const range = (start: any, end: any, length = end - start) =>
    Array.from({ length }, (_, i) => ({
      label: JSON.stringify(start + i),
      value: JSON.stringify(start + i),
    }));

  const [pickerVisible, setPickerVisible] = useState({
    visible: false,
    button: '',
  });

  useEffect(() => {
    if (ageRange?.length < 80) {
      ageRange.push(...range(1, 80));
      setAgeRange(ageRange);
    }
  }, []);

  useEffect(() => {
    setMaxAge(props?.maxAge);
  }, [props?.maxAge]);

  useEffect(() => {
    setMinAge(props?.minAge);
  }, [props?.minAge]);

  const openPicker = (button: any) => {
    setPickerVisible({
      visible: true,
      button: button,
    });
  };

  const onPickerAgePress = (item: any) => {
    if (pickerVisible.button === 'start') {
      setMinAge(item.value);
      closePicker();
      if (props?.onMinAgeChange) {
        props.onMinAgeChange(item.value);
      }
    } else {
      setMaxAge(item.value);
      if (props?.onMaxAgeChange) {
        props.onMaxAgeChange(item.value);
      }
      closePicker();
    }
  };

  const closePicker = () => {
    setPickerVisible({
      visible: false,
      button: '',
    });
  };

  const RenderDropDownBtn = ({ text, onPress }: any) => (
    <Ripple style={Styles.ageDropDownBtn} onPress={onPress}>
      <Text style={Styles.ageDropDownTxt}>{text}</Text>
      <AntDesign name="down" color={Colors.color1} size={wp(3)} />
    </Ripple>
  );

  const RenderAgeRange = () => (
    <View
      style={{
        ...Styles.ageRangeCon,
        flexDirection: Rtl ? 'row-reverse' : 'row',
      }}
    >
      <Text style={Styles.fieldDesc}>{LanguageKeys.between}</Text>
      <RenderDropDownBtn
        text={minAge}
        onPress={openPicker.bind(null, 'start')}
      />
      <Text style={Styles.fieldDesc}>{LanguageKeys.and}</Text>
      <RenderDropDownBtn text={maxAge} onPress={openPicker.bind(null, 'end')} />
    </View>
  );

  return (
    <View style={Styles.container}>
      <Text style={Styles.fieldHeading}>{LanguageKeys.ageRange}</Text>
      <RenderAgeRange />
      <Picker
        visible={pickerVisible.visible}
        onClose={closePicker}
        onPress={onPickerAgePress}
        data={ageRange}
        headerTitle={LanguageKeys.ageRange}
      />
      <Ripple
        style={{
          ...Styles.clearButton,
          alignSelf: Rtl ? 'flex-start' : 'flex-end',
        }}
        onPress={onClearPress}
      >
        <Text style={Styles.clearButtonText}>{LanguageKeys.clear}</Text>
      </Ripple>
    </View>
  );
};

export default AgeRange;

const Styles = StyleSheet.create({
  container: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
  },
  fieldHeading: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small1,
    includeFontPadding: false,
  },
  fieldDesc: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_L,
    fontSize: Typography.small1,
    lineHeight: wp(4.5),
    alignSelf: 'center',
  },
  ageRangeCon: {
    paddingTop: hp(1),
    flexDirection: 'row',
    alignItems: 'center',
  },
  ageDropDownBtn: {
    borderWidth: 0.5,
    borderColor: Colors.color27,
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(1),
    borderRadius: 4,
    backgroundColor: Colors.color2,
    marginHorizontal: wp(3),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: hp(4),
  },
  ageDropDownTxt: {
    fontFamily: Fonts.APPFONT_L,
    fontSize: Typography.small1,
    color: Colors.color1,
    marginHorizontal: wp(1),
    includeFontPadding: false,
    alignSelf: 'center',
    textAlign: 'center',
  },
  clearButton: {
    position: 'absolute',
    top: '35%',
    paddingHorizontal: wp(3),
  },
  clearButtonText: {
    fontFamily: Fonts.APPFONT_L,
    fontSize: Typography.tiny2,
    color: Colors.color4,
    includeFontPadding: false,
  },
});
