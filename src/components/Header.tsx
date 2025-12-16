import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { hp, Typography, wp } from '../global';
import { CheckRtl } from '../languages';
import { Colors, Fonts } from '../res';
import Text from './Text';

const Header = (props: any) => {
  const Rtl = CheckRtl();
  const {
    navigation = null,
    title = '',
    arrowColor = Colors.color1,
    containerStyle = {},
    customConponent = () => null,
  } = props;
  const onArrowLeftPress = () => navigation.goBack();
  return (
    <View
      style={[
        Styles.headerContainer,
        { flexDirection: Rtl ? 'row-reverse' : 'row' },
        containerStyle,
      ]}
    >
      {navigation && (
        <TouchableOpacity onPress={onArrowLeftPress} activeOpacity={1}>
          <AntDesign
            name={Rtl ? 'arrowright' : 'arrowleft'}
            color={arrowColor}
            size={wp(6)}
          />
        </TouchableOpacity>
      )}
      <Text
        style={{
          ...Styles.headerTxt,
          marginHorizontal: navigation ? wp(3) : 0,
        }}
      >
        {title}
      </Text>
      {customConponent && customConponent()}
    </View>
  );
};

export default Header;

const Styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    borderBottomWidth: 0.7,
    borderBottomColor: Colors.color7,
  },
  headerTxt: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_B,
    alignSelf: 'center',
    fontSize: Typography.medium,
    lineHeight: wp(6),
  },
  shadow: {
    shadowColor: Colors.color1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
