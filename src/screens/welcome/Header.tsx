import moment from 'moment';
import React from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text as ReactText,
  View,
} from 'react-native';
import { hasDynamicIsland, hasNotch } from 'react-native-device-info';
import Ripple from 'react-native-material-ripple';

import { Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';
import { isIOS, useGlobalContext } from '../../services';
import ProfileComplete from './ProfileComplete';

const Header = (props: any) => {
  const { currentUser } = useGlobalContext();
  const { navigation = {} } = props;

  const Rtl = CheckRtl();
  const onMembershipPress = () =>
    navigation.navigate('MembershipInfo', { from: 'Welcome' });

  return (
    <View
      style={{
        ...Styles.headerContainer,
        flexDirection: Rtl ? 'row-reverse' : 'column',
      }}
    >
      <View
        style={[
          Styles.innerHeaderCon,
          { flexDirection: Rtl ? 'row-reverse' : 'row' },
        ]}
      >
        <Text style={Styles.headerTxt}>{LanguageKeys.hi},</Text>
        <ReactText
          style={[Styles.headerTxt, { marginHorizontal: wp(1) }]}
          numberOfLines={1}
        >
          {currentUser?.full_name}
        </ReactText>
        {currentUser?.membershipExpiry !== null &&
          moment(currentUser?.membershipExpiry).isAfter(moment()) && (
            <Ripple style={Styles.membershipBtn} onPress={onMembershipPress}>
              <Image
                source={Images.membershipWhite}
                resizeMode="contain"
                style={Styles.membershipBtnIcon}
              />
            </Ripple>
          )}
      </View>
      <ProfileComplete />
    </View>
  );
};

export default Header;

const { width } = Dimensions.get('window');

const Styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    // alignItems: 'center',
    // justifyContent: 'space-between',
    marginTop: isIOS && (hasDynamicIsland() || hasNotch()) ? 13 : 0,
  },
  innerHeaderCon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTxt: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small3,
    marginBottom: 8,
    alignSelf: 'center',
  },
  membershipBtnIcon: {
    width: width * 0.035,
    height: width * 0.035 * 1,
  },
  membershipBtn: {
    width: width * 0.07,
    height: width * 0.07 * 1,
    borderRadius: (width * 0.07 * 1) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: wp(1),
    marginTop: isIOS ? hp(-0.3) : 0,
    backgroundColor: Colors.color47,
  },
});
