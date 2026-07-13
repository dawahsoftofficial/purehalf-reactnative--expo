import moment from 'moment';
import React, { useEffect } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text as ReactText,
  TouchableOpacity,
  View,
} from 'react-native';
import { hasDynamicIsland, hasNotch } from 'react-native-device-info';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';
import { ApiServices, isIOS, useGlobalContext } from '../../services';
import { useNotificationStore } from '../../stores';
import ProfileComplete from './ProfileComplete';

const Header = (props: any) => {
  const { currentUser } = useGlobalContext();
  const { navigation = {} } = props;

  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  useEffect(() => {
    ApiServices.getUserStats()
      .then((res: any) => setUnreadCount(res?.unread_notifications ?? 0))
      .catch(() => null);
  }, [setUnreadCount]);

  const Rtl = CheckRtl();
  const onMembershipPress = () =>
    navigation.navigate('MembershipInfo', { from: 'Welcome' });
  const onBellPress = () => navigation.navigate('Notifications');

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
      <TouchableOpacity
        style={Styles.bellBtn}
        activeOpacity={0.7}
        onPress={onBellPress}
      >
        <AntDesign name="bells" color={Colors.ink} size={wp(6)} />
        {unreadCount > 0 && (
          <View style={Styles.bellBadge}>
            <ReactText style={Styles.bellBadgeTxt} numberOfLines={1}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </ReactText>
          </View>
        )}
      </TouchableOpacity>
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
  bellBtn: {
    position: 'absolute',
    right: 0,
    top: isIOS && (hasDynamicIsland() || hasNotch()) ? 13 : 0,
    padding: wp(1),
  },
  bellBadge: {
    position: 'absolute',
    right: wp(0.2),
    top: -hp(0.4),
    minWidth: wp(4.2),
    height: wp(4.2),
    borderRadius: wp(4.2) / 2,
    backgroundColor: Colors.theme,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(1),
  },
  bellBadgeTxt: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_R,
    fontSize: wp(2.6),
  },
});
