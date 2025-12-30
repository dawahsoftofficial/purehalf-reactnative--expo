import { Dimensions, StyleSheet } from 'react-native';

import { hp, Typography, wp } from '../../global';
import { Colors, Fonts } from '../../res';

const { width } = Dimensions.get('window');

const Styles = StyleSheet.create({
  innerContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  guardianTextWrapper: {
    backgroundColor: Colors.color55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guardianText: {
    fontSize: Typography.small2,
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color2,
  },
  messagesListContainer: {
    paddingTop: hp(3),
    paddingHorizontal: wp(3),
  },
  textContainer: {
    width: wp(100),
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
  },
  mainText: {
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_B,
    color: Colors.color1,
  },
  subText: {
    width: wp(80),
    textAlign: 'center',
    fontSize: Typography.small1,
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color4,
    marginTop: 10,
  },
  smilyIconBtn: {
    width: wp(10),
    height: hp(5),
    marginLeft: wp(2),
    borderRadius: hp(5) / 2,
    marginVertical: hp(1),
    justifyContent: 'center',
    alignItems: 'center',
  },
  smilyIcon: {
    width: wp(10),
    height: hp(5),
  },
  messageInputOuter: {
    flexDirection: 'row',
    backgroundColor: Colors.color13,
    marginTop: hp(1),
    marginBottom: hp(2),
    marginHorizontal: wp(4),
    borderRadius: 30,
    alignItems: 'center',
    maxHeight: hp(20),
  },
  messageInput: {
    width: wp(79),
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color1,
    paddingHorizontal: wp(4),
    textAlignVertical: 'center',
    // paddingTop: !isIOS ? hp(1.9) : hp(0.8),
    maxHeight: hp(20),
    minHeight: hp(4.5),
    includeFontPadding: false,
  },
  sendBtn: {
    width: width * 0.12,
    height: width * 0.12 * 1,
    borderRadius: (width * 0.12 * 1) / 2,
    backgroundColor: Colors.theme,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageCon: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    borderRadius: 20,
    maxWidth: wp(75),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  messageTxt: {
    fontSize: Typography.small2,
    fontFamily: Fonts.APPFONT_R,
    includeFontPadding: false,
    flexShrink: 1,
    marginRight: wp(2),
  },
  messageTimeAndStatusWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  messageTimeInline: {
    fontSize: Typography.tiny1,
    fontFamily: Fonts.APPFONT_R,
    includeFontPadding: false,
    opacity: 0.8,
  },
  seenIconInline: {
    marginLeft: wp(0.5),
  },
  messageTime: {
    fontSize: Typography.tiny1,
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color34,
    includeFontPadding: false,
  },
  messageSendingCon: {
    flexDirection: 'row',
    marginVertical: hp(0.5),
    paddingHorizontal: wp(1),
    alignSelf: 'flex-end',
  },
  sendingText: {
    alignSelf: 'center',
    fontFamily: Fonts.APPFONT_L,
    fontSize: Typography.tiny1,
    includeFontPadding: false,
    color: Colors.color1,
  },
  seenIcon: {
    marginRight: wp(-1),
    marginLeft: wp(1.5),
  },
  messageTimeCon: {
    paddingVertical: hp(0.5),
    alignItems: 'flex-end',
    paddingRight: wp(2),
  },
  sendIcon: {
    width: wp(7),
    height: hp(4),
  },
  disabledInputCon: {
    position: 'absolute',
    width: wp(91),
    height: hp(6.9),
    borderRadius: 30,
  },
  seenProfileImageContainer: {
    marginTop: hp(0.5),
    marginRight: wp(1),
    marginLeft: wp(1),
  },
  seenProfileImage: {
    width: wp(4),
    height: wp(4),
    borderRadius: wp(2),
    borderWidth: 1,
    borderColor: Colors.color2,
  },
});

export default Styles;
