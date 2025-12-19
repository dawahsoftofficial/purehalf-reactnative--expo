import React, { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { hp, Typography, wp } from '../../global';
import { Colors, Fonts } from '../../res';
import { isIOS } from '../../services';
import { Text } from '..';

const MARGIN_TOP = isIOS ? hp(6) : hp(2);
const LocationPicker = (props: any) => {
  const [inputText, setInputText] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const {
    visible = false,
    // onClose = () => null,
  } = props;

  const onInputFocus = () => {
    setInputFocused(true);
  };

  const onInputBlur = () => {
    setInputFocused(false);
  };

  const onInputTextChange = (text: any) => {
    setInputText(text);
  };

  const onSelect = (data: any, details: any) => {
    setInputText('');
    setInputFocused(false);
    if (props?.onSelect) {
      props.onSelect(data, details);
    }
  };

  const onClose = () => {
    setInputText('');
    setInputFocused(false);
    if (props?.onClose) {
      props.onClose();
    }
  };

  return (
    <Modal
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
    >
      <View style={{ flex: 1 }}>
        <Ripple style={Styles.closeBtn} onPress={onClose}>
          <AntDesign name="close" color={Colors.color1} size={wp(8)} />
        </Ripple>
        <GooglePlacesAutocomplete
          placeholder="Search location"
          onPress={onSelect}
          query={{
            key: 'AIzaSyAlfbGzg9sXg19h6eDnXrUOYqkEn_LsfOY',
            language: 'en',
          }}
          styles={{
            textInputContainer: Styles.inputContainer,
            textInput: Styles.input,
            listView: Styles.listView,
          }}
          fetchDetails={true}
          textInputProps={{
            onFocus: onInputFocus,
            onBlur: onInputBlur,
            onChangeText: onInputTextChange,
          }}
        />
        {!inputFocused && inputText.length === 0 ? (
          <View style={Styles.descriptionCon}>
            <Text style={Styles.description}>
              Providing us with your country and city information will assist us
              in finding people nearby you.
            </Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
};

export default LocationPicker;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeBtn: {
    position: 'absolute',
    right: wp(4),
    top: MARGIN_TOP + hp(1),
  },
  inputContainer: {
    width: wp(82),
    marginLeft: wp(4),
    marginTop: MARGIN_TOP,
  },
  input: {
    backgroundColor: Colors.color8,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.medium,
    includeFontPadding: false,
    color: Colors.color1,
    height: hp(6),
  },
  listView: {
    alignSelf: 'center',
    width: wp(90),
  },
  descriptionCon: {
    position: 'absolute',
    top: hp(40),
    width: wp(100),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(10),
  },
  description: {
    alignSelf: 'center',
    textAlign: 'center',
    color: Colors.color28,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
  },
});
