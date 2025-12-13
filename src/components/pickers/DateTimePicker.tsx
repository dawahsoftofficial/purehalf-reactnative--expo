import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import React, { useState } from 'react';
import { Image, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

import { Animation } from '../../animations';
import { hp, Typography, wp } from '../../global';
import Constants from '../../global/Constants';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
import { isIOS } from '../../services';
import { Text } from '..';

const DateTimePickerFun = (props: any) => {
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

  const onPressOuterBtn = () => setVisible(true);
  const closePickerIos = () => {
    setVisible(false);
    setDate(props.date);
  };

  const onChangeAndroidDate = (data: any) => {
    const { type, nativeEvent } = data;
    const { timestamp } = nativeEvent;
    if (type === 'dismissed') {
      setVisible(false);
    } else if (type === 'set') {
      setVisible(false);
      setDate(new Date(timestamp));
      props.selectedDate(new Date(timestamp));
    }
  };

  const onChangeIosDate = (data: any) => {
    const { nativeEvent } = data;
    const { timestamp } = nativeEvent;
    setDate(new Date(timestamp));
  };

  const onConfirmIos = () => {
    setVisible(false);
    setDate(date);
    props.selectedDate(date);
  };

  const RenderIcon = () => (
    <Image
      source={icon}
      resizeMode="contain"
      style={[Styles.btnIcon, { marginLeft: Rtl ? wp(-1) : 0 }, iconStyle]}
    />
  );
  const RenderBtn = () => (
    <Ripple style={Styles.btn} onPress={onPressOuterBtn} disabled={disabled}>
      {date?.length !== 0 ? (
        <Text style={Styles.btnTxt}>{moment(date).format('Do MMM, YYYY')}</Text>
      ) : (
        <Text style={{ ...Styles.btnTxt, color: Colors.color28 }}>
          {LanguageKeys.selectDateOfBirth}
        </Text>
      )}
    </Ripple>
  );

  return (
    <View style={Styles.container}>
      <Text
        style={[
          Styles.inputLabel,
          outerLabelStyle,
          { alignSelf: Rtl ? 'flex-end' : 'flex-start' },
        ]}
      >
        {label}
      </Text>
      {
        <View
          style={[
            Styles.btnOuterContainer,
            {
              flexDirection: Rtl ? 'row-reverse' : 'row',
              backgroundColor: disabled ? Colors.color54 : Colors.color3,
            },
          ]}
        >
          <RenderIcon />
          <RenderBtn />
        </View>
      }

      <Modal
        visible={visible && isIOS}
        transparent={true}
        onRequestClose={closePickerIos}
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
                value={date?.length !== 0 ? new Date(date) : new Date()}
                mode={mode}
                is24Hour={true}
                onChange={onChangeIosDate}
                maximumDate={maxDate ? maxDate : new Date()}
                display={'spinner'}
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

      {!isIOS && visible && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date?.length !== 0 ? new Date(date) : new Date()}
          mode={mode}
          is24Hour={true}
          onChange={onChangeAndroidDate}
          display={'spinner'}
          maximumDate={new Date()}
          themeVariant="light"
        />
      )}
    </View>
  );
};

export default DateTimePickerFun;
const Styles = StyleSheet.create({
  container: {},
  inputLabel: {
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_R,
    marginBottom: Constants.fontFamilyMarginBottom,
    color: Colors.color1,
  },
  btnOuterContainer: {
    borderBottomWidth: 1,
    marginTop: hp(1),
    alignItems: 'center',
    backgroundColor: Colors.color3,
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
    width: wp(85),
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
    color: Colors.color1,
  },
});
