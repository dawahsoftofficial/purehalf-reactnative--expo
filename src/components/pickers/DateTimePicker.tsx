import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

import { Animation } from '../../animations';
import { hp, Typography, wp } from '../../global';
import Constants from '../../global/Constants';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
import { isIOS } from '../../services';
import { Text } from '..';

const DateTimePickerFun = React.memo((props: any) => {
  const Rtl = CheckRtl();
  const [visible, setVisible] = useState(false);
  const [date, setDate] = useState(props.date);
  const {
    icon = null,
    iconStyle = null,
    label = 'Date of birth',
    mode = 'date',
    outerLabelStyle = {},
    disabled = false,
    maxDate = new Date(),
  } = props;

  // Sync internal date state with props.date changes
  useEffect(() => {
    setDate(props.date);
  }, [props.date]);

  // Check if date is valid (not empty, not null, not undefined)
  const hasValidDate = useMemo(() => {
    if (!date) return false;
    if (typeof date === 'string' && date.length === 0) return false;
    if (date instanceof Date && isNaN(date.getTime())) return false;
    return true;
  }, [date]);

  // Get formatted date string - ensure today's date is always formatted correctly
  const formattedDate = useMemo(() => {
    if (!hasValidDate || !date) return null;
    try {
      let dateToFormat: Date;
      if (date instanceof Date) {
        dateToFormat = date;
      } else if (typeof date === 'string') {
        dateToFormat = new Date(date);
      } else {
        return null;
      }

      // Check if date is valid (including today's date)
      if (isNaN(dateToFormat.getTime())) return null;

      // Format the date - this will work for any valid date including today
      // No special handling needed - today's date should format normally
      const formatted = moment(dateToFormat).format('Do MMM, YYYY');
      return formatted || null;
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return null;
    }
  }, [date, hasValidDate]);

  // Get date value for picker
  const pickerDateValue = useMemo(() => {
    if (!hasValidDate) return new Date();
    if (date instanceof Date) return date;
    try {
      return new Date(date);
    } catch {
      return new Date();
    }
  }, [date, hasValidDate]);

  // Memoized styles
  const iconContainerStyle = useMemo(
    () => ({
      marginLeft: Rtl ? wp(-1) : 0,
    }),
    [Rtl]
  );

  const labelStyle = useMemo(
    () => [
      Styles.inputLabel,
      outerLabelStyle,
      { alignSelf: Rtl ? 'flex-end' : 'flex-start' },
    ],
    [outerLabelStyle, Rtl]
  );

  const containerStyle = useMemo(
    () => [
      Styles.btnOuterContainer,
      {
        flexDirection: (Rtl ? 'row-reverse' : 'row') as 'row' | 'row-reverse',
        backgroundColor: disabled ? Colors.lavender : Colors.surface,
      },
    ],
    [Rtl, disabled]
  );

  const placeholderTextStyle = useMemo(
    () => [Styles.btnTxt, { color: Colors.muted }],
    []
  );

  // Memoized handlers
  const onPressOuterBtn = useCallback(() => {
    if (!disabled) {
      setVisible(true);
    }
  }, [disabled]);

  const closePickerIos = useCallback(() => {
    setVisible(false);
    setDate(props.date);
  }, [props.date]);

  const onChangeAndroidDate = useCallback(
    (data: any) => {
      const { type, nativeEvent } = data;
      const { timestamp } = nativeEvent;
      if (type === 'dismissed') {
        setVisible(false);
      } else if (type === 'set') {
        const selectedDate = new Date(timestamp);
        setVisible(false);
        setDate(selectedDate);
        props.selectedDate?.(selectedDate);
      }
    },
    [props]
  );

  const onChangeIosDate = useCallback((data: any) => {
    const { nativeEvent } = data;
    const { timestamp } = nativeEvent;
    const selectedDate = new Date(timestamp);
    setDate(selectedDate);
  }, []);

  const onConfirmIos = useCallback(() => {
    setVisible(false);
    // Use pickerDateValue to ensure we get the current picker value
    // even if onChange wasn't called (user confirmed without changing)
    const dateToConfirm = pickerDateValue;
    setDate(dateToConfirm);
    props.selectedDate?.(dateToConfirm);
  }, [pickerDateValue, props]);

  // Memoized icon element
  const iconElement = useMemo(() => {
    if (!icon) return null;
    return (
      <Image
        source={icon}
        resizeMode="contain"
        style={[Styles.btnIcon, iconContainerStyle, iconStyle]}
      />
    );
  }, [icon, iconContainerStyle, iconStyle]);

  // Memoized button text element
  const buttonTextElement = useMemo(() => {
    if (formattedDate) {
      return <Text style={Styles.btnTxt}>{formattedDate}</Text>;
    }
    return (
      <Text style={placeholderTextStyle}>{LanguageKeys.selectDateOfBirth}</Text>
    );
  }, [formattedDate, placeholderTextStyle]);

  const modalVisible = visible && isIOS;
  const androidPickerVisible = !isIOS && visible;

  return (
    <View style={Styles.container}>
      <Text style={labelStyle}>{label}</Text>
      <View style={containerStyle}>
        {iconElement}
        <Ripple
          style={Styles.btn}
          onPress={onPressOuterBtn}
          disabled={disabled}
        >
          {buttonTextElement}
        </Ripple>
      </View>

      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={closePickerIos}
        animationType="fade"
      >
        <TouchableOpacity
          style={Styles.pickerContainer}
          activeOpacity={1}
          onPress={closePickerIos}
        >
          <TouchableOpacity activeOpacity={1}>
            <Animation animation="zoomIn" style={Styles.pickerInnerCon}>
              <DateTimePicker
                testID="dateTimePicker"
                value={pickerDateValue}
                mode={mode}
                is24Hour={true}
                onChange={onChangeIosDate}
                maximumDate={maxDate || new Date()}
                display="spinner"
                themeVariant="light"
              />
              {isIOS && (
                <Ripple style={Styles.dateConfirmBtn} onPress={onConfirmIos}>
                  <Text style={Styles.confirmTxt}>confirm</Text>
                </Ripple>
              )}
            </Animation>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {androidPickerVisible && (
        <DateTimePicker
          testID="dateTimePicker"
          value={pickerDateValue}
          mode={mode}
          is24Hour={true}
          onChange={onChangeAndroidDate}
          display="spinner"
          maximumDate={maxDate || new Date()}
          themeVariant="light"
        />
      )}
    </View>
  );
});

DateTimePickerFun.displayName = 'DateTimePicker';

export default DateTimePickerFun;
const Styles = StyleSheet.create({
  container: {},
  inputLabel: {
    fontSize: Typography.medium,
    marginBottom: Constants.fontFamilyMarginBottom,
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_M,
  },
  btnOuterContainer: {
    borderWidth: 1.4,
    borderColor: Colors.hairline,
    borderRadius: 12,
    marginTop: hp(1),
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: wp(2),
  },
  btnIcon: {
    width: wp(4),
    height: hp(3),
  },
  btn: {
    height: hp(6.3),
    paddingHorizontal: wp(3),
    justifyContent: 'center',
    flex: 1,
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerInnerCon: {
    backgroundColor: Colors.color2,
    borderRadius: 10,
  },
  dateConfirmBtn: {
    alignSelf: 'center',
    marginVertical: hp(2),
    backgroundColor: Colors.theme,
    paddingHorizontal: wp(5),
    paddingVertical: hp(1),
    borderRadius: 8,
  },
  confirmTxt: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.medium,
  },
  btnTxt: {
    fontSize: Typography.small3,
    fontFamily: Fonts.APPFONT_R,
    marginBottom: Constants.fontFamilyMarginBottom,
    color: Colors.ink,
  },
});
