import { StyleSheet } from 'react-native';

import { hp, Typography, wp } from '../../global';
import { Colors, Fonts } from '../../res';

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  tagLineHeading: {
    alignSelf: 'center',
    fontFamily: Fonts.APPFONT_B,
    color: Colors.color1,
    fontSize: Typography.medium1,
    maxWidth: wp(75),
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
    height: hp(9),
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingHorizontal: wp(8),
  },
  tagLineEditBtn: {
    position: 'absolute',
  },
  tagLineInput: {
    height: hp(6),
    includeFontPadding: false,
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color1,
    width: wp(64),
    borderRadius: 8,
    backgroundColor: Colors.color2,
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
    paddingVertical: hp(1),
    paddingHorizontal: wp(2),
    marginRight: wp(-2),
  },
});
