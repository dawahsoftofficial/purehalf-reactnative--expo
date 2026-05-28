import { StyleSheet } from 'react-native';

import { hp, Typography, wp } from '../../global';
import { Colors, Fonts } from '../../res';

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  tagLineHeading: {
    fontFamily: Fonts.APPFONT_B,
    color: Colors.color1,
    fontSize: Typography.medium,
    flex: 1,
  },
  userNotAvailDes: {
    color: Colors.color22,
    alignSelf: 'center',
    textAlign: 'center',
    includeFontPadding: false,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.medium,
    marginTop: hp(4),
  },
  somethingWentWrontText: {
    color: Colors.color22,
    alignSelf: 'center',
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small3,
    marginBottom: hp(2),
  },
  tryAgainWrapper: {
    width: wp(60),
    alignSelf: 'center',
    backgroundColor: Colors.color18,
  },
  tryAgainText: {
    color: Colors.color22,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small3,
  },
  tagLineOuterCon: {
    marginHorizontal: wp(4),
    marginVertical: hp(4.5),
    backgroundColor: Colors.color2,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.color27,
    overflow: 'hidden',
    paddingTop: hp(2),
    paddingBottom: hp(2),
  },
  tagLineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
  },
  tagLineText: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    color: Colors.color11,
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    includeFontPadding: false,
  },
  tagLineEditBtn: {
    position: 'absolute',
  },
  tagLineInput: {
    height: hp(6),
    minWidth: 0,
    includeFontPadding: false,
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color1,
    borderRadius: 8,
    backgroundColor: Colors.color3,
    borderWidth: 1,
    borderColor: Colors.color27,
    paddingHorizontal: wp(2),
    fontSize: Typography.small2,
  },
  tagLineSubmitBtn: {
    backgroundColor: Colors.themeRGBA50,
    width: wp(12),
    height: hp(6),
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: wp(1.2),
  },
  editButton: {
    // paddingVertical: hp(1),
    // paddingHorizontal: wp(2),
    // marginRight: wp(-2),
  },
});
