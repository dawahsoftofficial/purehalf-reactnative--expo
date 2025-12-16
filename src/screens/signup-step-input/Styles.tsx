import { StyleSheet } from 'react-native';

import { hp, Typography, wp } from '../../global';
import { Colors, Fonts } from '../../res';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.color7,
  },
  headerContainer: {
    backgroundColor: Colors.color2,
    paddingTop: hp(2),
    paddingBottom: hp(1.5),
    paddingHorizontal: wp(4),
    borderBottomWidth: 0.7,
    borderBottomColor: Colors.color7,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium1,
    lineHeight: wp(6),
  },
  chatRibbon: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatRibbonText: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small2,
    includeFontPadding: false,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: wp(4),
    paddingTop: hp(4),
  },
  questionText: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.large1,
    lineHeight: wp(7),
    marginBottom: hp(4),
    includeFontPadding: false,
  },
  inputContainer: {
    marginTop: hp(2),
  },
  inputWrapper: {
    marginTop: 0,
  },
  textInput: {
    backgroundColor: Colors.color2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.color27,
    paddingHorizontal: wp(3),
    minHeight: hp(6),
    includeFontPadding: false,
    fontSize: Typography.small2,
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color1,
    width: '100%',
  },
  buttonContainer: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(3),
    paddingTop: hp(2),
    backgroundColor: Colors.color2,
    borderTopWidth: 0.7,
    borderTopColor: Colors.color7,
  },
  nextButton: {
    width: '100%',
  },
});
