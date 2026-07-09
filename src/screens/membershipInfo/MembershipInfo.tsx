import { useIsFocused } from '@react-navigation/native';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Purchases from 'react-native-purchases';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {
  AnimatedLoader,
  Button,
  Container,
  Header,
  LinearGradient,
  Text,
} from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
import { ApiServices, StorageManager, useGlobalContext } from '../../services';

type RenderRowProps = {
  label: string;
  value: string;
  showDivider?: boolean;
};

const RenderRow = ({ label, value, showDivider = false }: RenderRowProps) => (
  <View style={[Styles.row, showDivider && Styles.rowDivider]}>
    <Text style={Styles.rowLabel}>{label}</Text>
    <Text style={Styles.rowValue}>{value}</Text>
  </View>
);

type BenefitRowProps = {
  label: string;
  icon: string;
  showDivider?: boolean;
};

const BenefitRow = ({ label, icon, showDivider = false }: BenefitRowProps) => (
  <View style={[Styles.benefitRow, showDivider && Styles.rowDivider]}>
    <View style={Styles.benefitIconCircle}>
      <Ionicons name={icon} size={wp(4.5)} color={Colors.primary} />
    </View>
    <Text style={Styles.benefitTxt}>{label}</Text>
  </View>
);

const PRO_BENEFITS = [
  { label: LanguageKeys.proFeature1, icon: 'chatbubble-ellipses' },
  { label: LanguageKeys.proFeature2, icon: 'eye' },
  { label: LanguageKeys.proFeature3, icon: 'heart' },
  { label: LanguageKeys.proFeature4, icon: 'rocket' },
];

const MembershipInfo = (props: any) => {
  const { setData, storageKeys } = StorageManager;
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const [user, setUser] = useState<any>(null);
  const [loader, setLoader] = useState(true);
  const [membershipInfo, setMembershipInfo] = useState<any>(null);
  const isFocused = useIsFocused();

  const onUpdateToProPress = () => {
    props.navigation.navigate('ProFeaturesPromotion', {
      from: 'Settings',
      navigateTo: 'MembershipCongrats',
    });
  };

  const getMembershipInfo = async () => {
    try {
      const user = await ApiServices.getCurrentUserDetail();
      if (user) {
        setUser(user);
        updateCurrentUser(user);
        await setData(storageKeys.USER, user);
      }
      const customerInfo: any = await Purchases.getCustomerInfo();
      if (customerInfo?.activeSubscriptions?.length !== 0) {
        setMembershipInfo(customerInfo);
      }
      setLoader(false);
    } catch (error) {
      setLoader(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      setTimeout(() => {
        getMembershipInfo();
      }, 0);
    }
  }, [isFocused]);

  const hasMembership = !(
    user?.membership_status === 0 || !user?.membership_status
  );

  const renewalDate = currentUser.membership_status
    ? moment(currentUser?.membership_expiry)?.format('DD MMM, YYYY hh:mm A')
    : moment(
        membershipInfo?.entitlements?.active['Premium bundles']?.expirationDate
      )?.format('DD MMM, YYYY hh:mm A');

  return (
    <Container style={Styles.screen}>
      <Header
        title={LanguageKeys.membershipInformation}
        navigation={props.navigation}
        titleVariant="display"
      />
      {loader ? (
        <AnimatedLoader
          visible={loader}
          text={'Loading...'}
          style={Styles.loader}
        />
      ) : (
        <View style={Styles.innerCon}>
          {hasMembership ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={Styles.fieldsOuterCon}
            >
              <View style={Styles.planCard}>
                <View style={Styles.planIcon}>
                  <Ionicons name="diamond" size={wp(6)} color={Colors.color2} />
                </View>
                <View style={Styles.planTextCon}>
                  <Text style={Styles.planLabel}>{LanguageKeys.active}</Text>
                  <Text
                    variant="display"
                    style={Styles.planTitle}
                    numberOfLines={2}
                  >
                    {LanguageKeys.premiumMembershipStatus}
                  </Text>
                </View>
                <Ionicons
                  name="checkmark-circle"
                  size={wp(6)}
                  color={Colors.color2}
                />
              </View>

              <View style={Styles.groupCard}>
                <RenderRow
                  label={LanguageKeys.proPackagePurchasedOn}
                  value={moment(
                    membershipInfo?.entitlements?.active['Premium bundles']
                      ?.latestPurchaseDate
                  )?.format('DD MMM, YYYY hh:mm A')}
                  showDivider
                />
                <RenderRow
                  label={LanguageKeys.renewalDate}
                  value={renewalDate}
                />
              </View>
            </ScrollView>
          ) : (
            <>
              <ScrollView
                style={Styles.emptyScrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={Styles.emptyScroll}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryMid]}
                  style={Styles.heroCard}
                >
                  <View style={Styles.heroIconCircle}>
                    <Ionicons
                      name="diamond"
                      size={wp(9)}
                      color={Colors.color2}
                    />
                  </View>
                  <Text variant="display" style={Styles.heroTitle}>
                    {LanguageKeys.goProWithPureHalf}
                  </Text>
                  <Text style={Styles.heroSub}>
                    {LanguageKeys.proPitchSubtitle}
                  </Text>
                  <View style={Styles.statusPill}>
                    <Text style={Styles.statusPillTxt}>
                      {LanguageKeys.noActiveMembership}
                    </Text>
                  </View>
                </LinearGradient>
                <Text style={Styles.sectionLabel}>
                  {LanguageKeys.whatYouGetWithPro}
                </Text>
                <View style={Styles.benefitsCard}>
                  {PRO_BENEFITS.map((b, i) => (
                    <BenefitRow
                      key={b.label}
                      label={b.label}
                      icon={b.icon}
                      showDivider={i < PRO_BENEFITS.length - 1}
                    />
                  ))}
                </View>
              </ScrollView>
              <Text style={Styles.reassureTxt}>
                {LanguageKeys.cancelAnytime}
              </Text>
              <Button
                text={LanguageKeys.upgradeToPro}
                buttonStyle={Styles.button}
                onPress={onUpdateToProPress}
              />
            </>
          )}
        </View>
      )}
    </Container>
  );
};

export default MembershipInfo;

const Styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.appBg,
  },
  loader: {
    flex: 1,
  },
  innerCon: {
    paddingHorizontal: wp(4),
    flex: 1,
  },
  fieldsOuterCon: {
    paddingTop: hp(3),
    paddingBottom: hp(3),
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: wp(4),
    marginBottom: hp(2),
  },
  planIcon: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(5.5),
    backgroundColor: Colors.primaryRGBA12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTextCon: {
    flex: 1,
    marginHorizontal: wp(3),
  },
  planLabel: {
    color: Colors.primaryLite,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.tiny1,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: hp(0.3),
  },
  planTitle: {
    color: Colors.color2,
    fontSize: Typography.medium1,
  },
  groupCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.hairline,
    overflow: 'hidden',
  },
  row: {
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(4),
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  rowLabel: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small1,
    color: Colors.muted,
  },
  rowValue: {
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small3,
    color: Colors.ink,
    marginTop: hp(0.4),
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.7),
    paddingHorizontal: wp(4),
    gap: wp(3),
  },
  benefitIconCircle: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTxt: {
    flexShrink: 1,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small2,
    color: Colors.ink,
    textAlign: 'center',
  },
  button: {
    marginVertical: hp(2),
  },
  emptyScrollView: {
    flex: 1,
  },
  emptyScroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(3),
  },
  heroCard: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: 24,
    paddingVertical: hp(3.5),
    paddingHorizontal: wp(6),
    marginBottom: hp(3),
  },
  heroIconCircle: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(10),
    backgroundColor: Colors.whiteRGBA18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2),
  },
  heroTitle: {
    color: Colors.color2,
    fontSize: Typography.large,
    textAlign: 'center',
  },
  heroSub: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    color: Colors.whiteRGBA90,
    textAlign: 'center',
    marginTop: hp(1),
  },
  statusPill: {
    backgroundColor: Colors.whiteRGBA18,
    borderRadius: 100,
    paddingVertical: hp(0.6),
    paddingHorizontal: wp(4),
    marginTop: hp(2),
  },
  statusPillTxt: {
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small1,
    color: Colors.color2,
    textAlign: 'center',
  },
  sectionLabel: {
    alignSelf: 'center',
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.tiny1,
    color: Colors.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: hp(1.2),
  },
  reassureTxt: {
    alignSelf: 'center',
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small1,
    color: Colors.muted,
    textAlign: 'center',
  },
  benefitsCard: {
    alignSelf: 'stretch',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.hairline,
    overflow: 'hidden',
  },
});
