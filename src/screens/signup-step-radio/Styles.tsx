import { Dimensions, StyleSheet } from 'react-native';

import { hp, Typography, wp } from '../../global';
import { Colors, Fonts } from '../../res';

const { width } = Dimensions.get('window');

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
  radioContainer: {
    // flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: hp(2),
  },
  radioTile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    borderRadius: 8,
    borderWidth: 1.5,
    width: '100%',
    marginBottom: hp(2),
    justifyContent: 'center',
  },
  radioCircle: {
    width: width * 0.04,
    height: width * 0.04,
    borderRadius: (width * 0.04) / 2,
    borderWidth: 2,
    marginRight: wp(2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioLabel: {
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small2,
    includeFontPadding: false,
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
