import moment from 'moment';
import React, { useEffect } from 'react';
import { BackHandler, Image, StatusBar, StyleSheet, View } from 'react-native';
import { AppEventsLogger } from 'react-native-fbsdk-next';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Animation } from '../../animations';
import { Button, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';
import { ApiServices, StorageManager, useGlobalContext } from '../../services';
import { addAnaylatics } from '../../services/firebase/analytics';
import { formatMembershipAmount } from './membership-purchase-display';

type RowItem = {
  label: string;
  value: string;
  badge?: string;
};

const DetailRow = ({
  label,
  value,
  badge,
  last,
}: RowItem & { last: boolean }) => (
  <View style={[Styles.row, !last && Styles.rowDivider]}>
    <Text style={Styles.rowLabel}>{label}</Text>
    <View style={Styles.rowValueWrap}>
      <Text style={Styles.rowValue}>{value}</Text>
      {!!badge && (
        <View style={Styles.activePill}>
          <Text style={Styles.activePillTxt}>{badge}</Text>
        </View>
      )}
    </View>
  </View>
);

const MembershipCongrats = (props: any) => {
  const {
    title,
    amount,
    localizedPrice,
    currencyCode,
    isNewTransaction,
    date_of_expiry = null,
  } = props.route.params;
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const { storageKeys, setData } = StorageManager;

  const onGetStartedPress = () => {
    props.navigation.reset({
      index: 0,
      routes: [{ name: 'BottomTab' }],
    });
  };

  const updateNewTransaction = () => {
    if (isNewTransaction) {
      //Facebook Event For Manual Paid Tracking
      AppEventsLogger.logPurchase(Number(amount), currencyCode || 'PKR');
      ApiServices.updateDetails({ paid_tracking: 1 }).then(async (res) => {
        await setData(storageKeys.USER, res);
        updateCurrentUser(res);
      });
    }
  };

  useEffect(() => {
    updateNewTransaction();
    if (title && amount) {
      addAnaylatics('PaymentSuccess', {
        amount,
        currency: currencyCode || 'PKR',
      });
    }
    const backAction = () => {
      onGetStartedPress();
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );
    return () => backHandler.remove();
  }, []);

  const expiryDate = currentUser?.membership_expiry || date_of_expiry;
  const formattedExpiry = expiryDate
    ? moment(expiryDate).format('DD MMM, YYYY')
    : '';
  const planName = title ? String(title) : LanguageKeys.premiumPlan;

  const rows: RowItem[] = [];
  if (Number(amount) > 0) {
    rows.push({
      label: LanguageKeys.amountPaid,
      value: formatMembershipAmount({
        amount,
        localizedPrice,
        currencyCode,
      }),
    });
  }
  rows.push({ label: LanguageKeys.membershipLabel, value: planName });
  if (formattedExpiry) {
    rows.push({
      label: LanguageKeys.activeUntil,
      value: formattedExpiry,
      badge: LanguageKeys.activeLabel,
    });
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={Styles.container}>
      <StatusBar
        translucent
        backgroundColor={'transparent'}
        barStyle={'dark-content'}
      />
      <View style={Styles.content}>
        <View style={Styles.centerGroup}>
          <Animation
            animation="zoomIn"
            duration={520}
            style={Styles.medallionWrap}
          >
            <View style={[Styles.halo, Styles.haloOuter]} />
            <View style={[Styles.halo, Styles.haloInner]} />
            <Ionicons
              name="sparkles"
              size={wp(4.6)}
              color={Colors.primaryLite}
              style={Styles.sparkleTopRight}
            />
            <Ionicons
              name="sparkles"
              size={wp(3.2)}
              color={Colors.primaryLite}
              style={Styles.sparkleBottomLeft}
            />
            <View style={Styles.medallionUnit}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryMid]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={Styles.medallion}
              >
                <Image
                  source={Images.membership}
                  resizeMode="contain"
                  style={Styles.crown}
                />
              </LinearGradient>
              <View style={Styles.seal}>
                <Ionicons
                  name="checkmark"
                  size={wp(4.8)}
                  color={Colors.color2}
                />
              </View>
            </View>
          </Animation>

          <Animation animation="fadeInUp" duration={520} style={Styles.body}>
            <Text variant="display" style={Styles.headline}>
              {LanguageKeys.alhamdulillah}
            </Text>
            <Text style={Styles.subtitle}>
              {LanguageKeys.premiumMemberSubtitle}
            </Text>

            <View style={Styles.card}>
              {rows.map((row, index) => (
                <DetailRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  badge={row.badge}
                  last={index === rows.length - 1}
                />
              ))}
            </View>

            <View style={Styles.footerNote}>
              <Ionicons
                name="sparkles"
                size={wp(3.6)}
                color={Colors.primaryMid}
              />
              <Text style={Styles.footerNoteTxt}>
                {LanguageKeys.enjoySuperpowers}
              </Text>
            </View>
          </Animation>
        </View>

        <Button
          buttonStyle={Styles.cta}
          text={LanguageKeys.diveInAndExplore}
          onPress={onGetStartedPress}
        />
      </View>
    </SafeAreaView>
  );
};

export default MembershipCongrats;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  content: {
    flex: 1,
    paddingHorizontal: wp(6),
    paddingBottom: hp(1),
  },
  centerGroup: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallionWrap: {
    width: wp(50),
    height: wp(50),
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    borderRadius: wp(25),
  },
  haloOuter: {
    width: wp(50),
    height: wp(50),
    backgroundColor: 'rgba(75, 46, 131, 0.05)',
  },
  haloInner: {
    width: wp(40),
    height: wp(40),
    backgroundColor: Colors.primaryRGBA12,
  },
  sparkleTopRight: {
    position: 'absolute',
    top: wp(4),
    right: wp(7),
  },
  sparkleBottomLeft: {
    position: 'absolute',
    bottom: wp(7),
    left: wp(5),
  },
  medallionUnit: {
    width: wp(27),
    height: wp(27),
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallion: {
    width: wp(27),
    height: wp(27),
    borderRadius: wp(13.5),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  crown: {
    width: wp(13),
    height: wp(13),
    tintColor: Colors.color2,
  },
  seal: {
    position: 'absolute',
    bottom: -wp(0.5),
    right: -wp(0.5),
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    backgroundColor: Colors.verified,
    borderWidth: 3,
    borderColor: Colors.appBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    width: '100%',
    alignItems: 'center',
    marginTop: hp(2.5),
  },
  headline: {
    color: Colors.ink,
    fontSize: wp(8),
    lineHeight: wp(9.5),
    includeFontPadding: false,
    alignSelf: 'center',
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small3,
    includeFontPadding: false,
    alignSelf: 'center',
    textAlign: 'center',
    marginTop: hp(0.6),
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.hairline,
    paddingHorizontal: wp(4.5),
    marginTop: hp(3),
    shadowColor: Colors.ink,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.7),
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  rowLabel: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    includeFontPadding: false,
    alignSelf: 'center',
  },
  rowValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    flexShrink: 1,
    marginLeft: wp(3),
    justifyContent: 'flex-end',
  },
  rowValue: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small3,
    includeFontPadding: false,
    alignSelf: 'center',
    textAlign: 'right',
  },
  activePill: {
    backgroundColor: 'rgba(46, 158, 91, 0.12)',
    paddingHorizontal: wp(2.4),
    paddingVertical: hp(0.35),
    borderRadius: 20,
  },
  activePillTxt: {
    color: '#1D7A46',
    fontFamily: Fonts.APPFONT_B,
    fontSize: wp(2.9),
    includeFontPadding: false,
    alignSelf: 'center',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(1.5),
    marginTop: hp(2.2),
  },
  footerNoteTxt: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    includeFontPadding: false,
    alignSelf: 'center',
  },
  cta: {
    marginTop: hp(1.5),
    marginBottom: hp(1),
  },
});
