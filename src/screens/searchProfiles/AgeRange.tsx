import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
      props?.onMinAgeChange?.(item.value);
    } else {
      setMaxAge(item.value);
      props?.onMaxAgeChange?.(item.value);
      closePicker();
    }
  };

  const closePicker = () => {
    setPickerVisible({
      visible: false,
      button: '',
    });
  };

  const hasSelection =
    minAge !== LanguageKeys.any || maxAge !== LanguageKeys.any;

  const RenderSelector = ({ value, onPress }: any) => (
    <Ripple
      style={{
        ...Styles.selector,
        flexDirection: Rtl ? 'row-reverse' : 'row',
      }}
      onPress={onPress}
      hitSlop={6}
      rippleColor={Colors.primary}
    >
      <Text style={Styles.selectorTxt}>{value}</Text>
      <Ionicons name="chevron-down" color={Colors.muted} size={wp(4)} />
    </Ripple>
  );

  return (
    <View style={Styles.container}>
      <View
        style={{
          ...Styles.headerRow,
          flexDirection: Rtl ? 'row-reverse' : 'row',
        }}
      >
        <Text style={Styles.label}>{LanguageKeys.ageRange}</Text>
        {hasSelection && (
          <Ripple onPress={onClearPress} hitSlop={16} style={Styles.clearLink}>
            <Text style={Styles.clearTxt}>{LanguageKeys.clear}</Text>
          </Ripple>
        )}
      </View>
      <View
        style={{
          ...Styles.selectorsRow,
          flexDirection: Rtl ? 'row-reverse' : 'row',
        }}
      >
        <RenderSelector
          value={minAge}
          onPress={openPicker.bind(null, 'start')}
        />
        <View style={Styles.dash} />
        <RenderSelector value={maxAge} onPress={openPicker.bind(null, 'end')} />
      </View>
      <Picker
        visible={pickerVisible.visible}
        onClose={closePicker}
        onPress={onPickerAgePress}
        data={ageRange}
        headerTitle={LanguageKeys.ageRange}
      />
    </View>
  );
};

export default AgeRange;

const Styles = StyleSheet.create({
  container: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.8),
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small2,
    includeFontPadding: false,
  },
  clearLink: {
    paddingHorizontal: wp(1),
  },
  clearTxt: {
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small,
    color: Colors.primaryMid,
    includeFontPadding: false,
  },
  selectorsRow: {
    alignItems: 'center',
    marginTop: hp(1.2),
  },
  dash: {
    width: wp(4),
    height: 1.4,
    backgroundColor: Colors.hairline,
    marginHorizontal: wp(2),
  },
  selector: {
    flex: 1,
    height: hp(5.6),
    borderRadius: 12,
    borderWidth: 1.4,
    borderColor: Colors.hairline,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(3.5),
  },
  selectorTxt: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small2,
    includeFontPadding: false,
    alignSelf: 'center',
  },
});
