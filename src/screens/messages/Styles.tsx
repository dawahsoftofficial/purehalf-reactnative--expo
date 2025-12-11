import { StyleSheet, Dimensions } from "react-native";
import { hp, Typography, wp } from "../../global";
import Constants from "../../global/Constants";
import { Colors, Fonts } from "../../res";

const { width } = Dimensions.get('window')
export default StyleSheet.create({
    contentContainer: {
        paddingHorizontal: wp(4)
    },
    topBarContainer: {
        marginVertical: hp(1),
        borderRadius: 30,
        paddingVertical: hp(1),
        backgroundColor: Colors.color13,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(5),
    },
    topBarBtn: {
        width: wp(23),
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 30,
        paddingVertical: hp(0.3),
        backgroundColor: Colors.color2,
    },
    topBarBtnTxt: {
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_R,
        fontSize: Typography.small1,
        marginBottom: Constants.fontFamilyMarginBottom,
        alignSelf: 'center'
    },
    badgeView: {
        width: width * 0.033,
        height: width * 1 * 0.033,
        borderRadius: width * 1 * 0.033 / 2,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        backgroundColor: Colors.color14,
        top: hp(-0.5),
    },
    badgeTxt: {
        color: Colors.color2,
        fontSize: wp(2.5),
        fontFamily: Fonts.APPFONT_R,
        marginBottom: Constants.fontFamilyMarginBottom,
        alignSelf: 'center'
    },
    convOuterCon: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: hp(3),
    },
    profilePictureCon: {
        width: width * 0.13,
        height: width * 1 * 0.13,
        borderRadius: width * 1 * 0.13 / 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.color21
    },
    profilePicture: {
        width: width * 0.13,
        height: width * 1 * 0.13,
        borderRadius: width * 1 * 0.13 / 2,
    },
    emptyProfilePicture: {
        width: width * 0.07,
        height: width * 1 * 0.07,
        marginTop: hp(-0.5)
    },
    messageView: {
        width: wp(55),
        alignSelf: 'center',
    },
    timeView: {
        width: wp(18),
    },
    userName: {
        color: Colors.color1,
        fontSize: Typography.small2,
        fontFamily: Fonts.APPFONT_B,
        marginBottom: Constants.fontFamilyMarginBottom
    },
    message: {
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_R,
        fontSize: Typography.small1,
    },
    timeTxt: {
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_R,
        fontSize: Typography.small2,
        alignSelf: 'flex-end',
        marginTop: hp(0.6),
    },
    listContainer: {
        paddingVertical: hp(2),
    },
    headerCon: {
        paddingTop: hp(1.5),
        paddingBottom: hp(0.5),
        paddingHorizontal: wp(4)
    },
    headerTitle: {
        fontSize: Typography.medium,
        fontFamily: Fonts.APPFONT_B,
        color: Colors.color1
    },
    emptyListCon: {
        height: hp(70),
        width: wp(100),
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyListText: {
        color: Colors.color1,
        alignSelf: 'center',
        textAlign: 'center',
        fontFamily: Fonts.APPFONT_R,
        fontSize: Typography.medium,
        marginRight: wp(6)
    },
    unReadCon: {
        alignSelf: 'flex-end',
        minWidth: width * 0.05,
        height: width * 1 * 0.05,
        borderRadius: width * 1 * 0.05 / 2,
        backgroundColor: Colors.theme,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: wp(1)
    },
    unReadCount: {
        color: Colors.color2,
        fontFamily: Fonts.APPFONT_R,
        fontSize: Typography.small
    }
})