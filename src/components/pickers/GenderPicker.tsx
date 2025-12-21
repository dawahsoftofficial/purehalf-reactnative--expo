import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Animation } from '../../animations';
import { hp, Typography, wp } from '../../global';
import Constants from '../../global/Constants';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';
import { isIOS } from '../../services';
import { Text } from '..';

type GenderItem = {
  label: string;
  value: string;
  id: string;
  selected: boolean;
};

interface GenderPickerProps {
  value?: string;
  outerLabelStyle?: any;
  disabled?: boolean;
  onSelect?: (value: string) => void;
}

const GenderPicker = React.memo((props: GenderPickerProps) => {
  const Rtl = CheckRtl();
  const { value = '', outerLabelStyle = {}, disabled = false } = props;
  const [genderModalVisible, setGenderModalVisible] = useState(false);

  // Initialize genders list - memoized and updated when value changes
  const genders = useMemo<GenderItem[]>(
    () => [
      {
        label: LanguageKeys.male,
        value: LanguageKeys.male,
        id: '1',
        selected: value === LanguageKeys.male,
      },
      {
        label: LanguageKeys.female,
        value: LanguageKeys.female,
        id: '2',
        selected: value === LanguageKeys.female,
      },
    ],
    [value]
  );

  const activeGender = value;
  const hasActiveGender = activeGender && activeGender.length > 0;

  // Memoized handlers
  const showGenderModal = useCallback(() => {
    if (!disabled) {
      setGenderModalVisible(true);
    }
  }, [disabled]);

  const closeGenderModal = useCallback(() => {
    setGenderModalVisible(false);
  }, []);

  const onGenderPress = useCallback(
    (item: GenderItem) => {
      props.onSelect?.(item.value);
      setGenderModalVisible(false);
    },
    [props]
  );

  // Memoized radio icon component
  const renderRadio = useCallback((isSelected: boolean) => {
    return isSelected ? (
      <Ionicons name="radio-button-on" size={wp(4.5)} color={Colors.theme} />
    ) : (
      <Ionicons name="radio-button-off" size={wp(4.5)} color={Colors.theme} />
    );
  }, []);

  // Memoized item container style
  const itemContainerStyleBase = useMemo(
    () => [
      Styles.itemContainer,
      {
        justifyContent: (Rtl ? 'flex-end' : 'flex-start') as
          | 'flex-start'
          | 'flex-end',
      },
    ],
    [Rtl]
  );

  // Memoized gender item renderer
  const renderGenders = useCallback(
    ({ item }: { item: GenderItem }) => {
      const radioIcon = renderRadio(item.selected);
      return (
        <TouchableOpacity
          style={itemContainerStyleBase}
          onPress={() => onGenderPress(item)}
          activeOpacity={0.5}
        >
          {!Rtl && radioIcon}
          <Text style={Styles.itemLabel}>{item.label}</Text>
          {Rtl && radioIcon}
        </TouchableOpacity>
      );
    },
    [Rtl, onGenderPress, renderRadio, itemContainerStyleBase]
  );

  // Memoized styles
  const labelStyle = useMemo(
    () => [Styles.label, outerLabelStyle],
    [outerLabelStyle]
  );

  const containerStyle = useMemo(
    () => [
      Styles.container,
      {
        flexDirection: (Rtl ? 'row-reverse' : 'row') as 'row' | 'row-reverse',
        backgroundColor: disabled ? Colors.color54 : Colors.color3,
      },
    ],
    [Rtl, disabled]
  );

  const innerContainerStyle = useMemo(
    () => [
      Styles.innerContainer,
      { flexDirection: (Rtl ? 'row-reverse' : 'row') as 'row' | 'row-reverse' },
    ],
    [Rtl]
  );

  const placeholderTextStyle = useMemo(
    () => [Styles.outerBtnLabel, { color: Colors.color28 }],
    []
  );

  // Memoized elements
  const downIconElement = useMemo(
    () => <AntDesign name="down" size={wp(3.5)} color={Colors.color4} />,
    []
  );

  const groupImageElement = useMemo(
    () => (
      <Image
        source={Images.groupUser}
        resizeMode="contain"
        style={Styles.groupUserIcon}
      />
    ),
    []
  );

  const genderTextElement = useMemo(() => {
    if (hasActiveGender) {
      return <Text style={Styles.outerBtnLabel}>{activeGender}</Text>;
    }
    return (
      <Text style={placeholderTextStyle}>{LanguageKeys.selectGender}</Text>
    );
  }, [hasActiveGender, activeGender, placeholderTextStyle]);

  // Memoized keyExtractor for FlatList
  const keyExtractor = useCallback((item: GenderItem) => item.id, []);

  return (
    <View>
      <Text style={labelStyle}>{LanguageKeys.gender}</Text>
      <Ripple
        style={containerStyle}
        onPress={showGenderModal}
        disabled={disabled}
      >
        <View style={innerContainerStyle}>
          {groupImageElement}
          {genderTextElement}
        </View>
        {downIconElement}
      </Ripple>

      <Modal
        visible={genderModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeGenderModal}
      >
        <TouchableOpacity
          style={Styles.modalContainer}
          activeOpacity={1}
          onPress={closeGenderModal}
        >
          <Animation style={Styles.listContainer} duration={300}>
            <FlatList
              data={genders}
              renderItem={renderGenders}
              keyExtractor={keyExtractor}
            />
          </Animation>
        </TouchableOpacity>
      </Modal>
    </View>
  );
});

GenderPicker.displayName = 'GenderPicker';

export default GenderPicker;

const Styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.color3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: hp(6.3),
    paddingLeft: wp(2),
    paddingRight: wp(5),
    borderBottomWidth: 0.7,
    borderColor: Colors.color1,
    marginTop: hp(0.8),
  },
  label: {
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_R,
    marginBottom: Constants.fontFamilyMarginBottom,
    color: Colors.color1,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: hp(6),
  },
  groupUserIcon: {
    width: wp(4.5),
    height: hp(4),
  },
  outerBtnLabel: {
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color1,
    fontSize: Typography.small3,
    marginTop: !isIOS ? hp(0.35) : 0,
    alignSelf: 'center',
    marginHorizontal: wp(3),
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0,0.5)',
    justifyContent: 'flex-end',
  },
  listContainer: {
    width: wp(100),
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    backgroundColor: Colors.color2,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
  },
  itemContainer: {
    paddingVertical: hp(1.4),
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemLabel: {
    marginHorizontal: wp(1),
    fontSize: Typography.medium,
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_R,
    marginBottom: Constants.fontFamilyMarginBottom,
  },
});
