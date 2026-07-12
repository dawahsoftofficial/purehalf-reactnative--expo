import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Linking,
  StatusBar,
  TouchableOpacity,
  View,
} from 'react-native';
import { StyleSheet } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { LinearGradient, ModalLoader, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { REVENUECAT_ENTITLEMENT_ID } from '../../global/Entitlements';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';
import {
  flashErrorMessage,
  flashSuccessMessage,
  StorageManager,
  useGlobalContext,
} from '../../services';
import PackagesList from './PackagesList';
import PaymentMethodList from './PaymentMethodList';

// M18 requires verifying the entitlement is genuinely active before granting
// premium on restore; using `activeSubscriptions.length` alone counts expired
// entries.
const ENTITLEMENT_ID = REVENUECAT_ENTITLEMENT_ID;

const ProFeaturesPromotion = (props: any) => {
  const { top } = useSafeAreaInsets();
  const Rtl = CheckRtl();
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const { setData, storageKeys } = StorageManager;
  const [paymentMethodListVisible, setPaymentMethodListVisible] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const [loaderModal, setLoaderModal] = useState({
    visible: false,
    message: '',
  });
  const [packagesList, setPackagesList] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any>('');
  const [showSubscribeButton, setShowSubscribeButton] = useState(false);
  // M17 fix: lock against re-entrant purchase calls (double-tap on a package).
  const purchaseInFlightRef = useRef(false);

  // Returns true when the customer payload reflects a currently-active
  // entitlement for this app. Fixes M18 — checking activeSubscriptions.length
  // alone was wrong because expired subscriptions remain in that array.
  const hasActiveEntitlement = (customerInfo: any): boolean => {
    const ci = customerInfo?.customerInfo ?? customerInfo;
    if (!ci) return false;
    const entitlement = ci?.entitlements?.active?.[ENTITLEMENT_ID];
    if (entitlement?.isActive === true) return true;
    // Fallback for older payload shapes where entitlements aren't surfaced —
    // require BOTH a non-empty active subscriptions array AND a future
    // expiration date, not either-or.
    const expiry =
      ci?.latestExpirationDate ?? customerInfo?.latestExpirationDate;
    const hasActive =
      Array.isArray(ci?.activeSubscriptions) &&
      ci.activeSubscriptions.length > 0;
    return hasActive && !!expiry && new Date(expiry).getTime() > Date.now();
  };

  const hideLoaderModal = () =>
    setLoaderModal({
      visible: false,
      message: '',
    });

  const [proFeatures] = useState([
    {
      title: LanguageKeys.proFeature1,
      id: '1',
    },
    {
      title: LanguageKeys.proFeature2,
      id: '2',
    },
    {
      title: LanguageKeys.proFeature3,
      id: '3',
    },
    {
      title: LanguageKeys.proFeature4,
      id: '4',
    },
  ]);

  const renderProFeatures = ({ item }: any) => {
    return (
      <View
        style={{
          ...Styles.listItemCon,
          flexDirection: Rtl ? 'row-reverse' : 'row',
        }}
      >
        <Image
          source={Images.logoWithoutText}
          resizeMode="contain"
          style={Styles.itemIcon}
        />
        <Text style={Styles.itemTitle}>{item.title}</Text>
      </View>
    );
  };

  const onPlayOrAppStorePress = async (fromRestore = false) => {
    if (purchaseInFlightRef.current) return;
    purchaseInFlightRef.current = true;
    setPaymentMethodListVisible(false);
    setLoaderModal({
      visible: true,
      message: LanguageKeys.loading,
    });
    try {
      let customerInfo: any = null;
      if (fromRestore) {
        customerInfo = await Purchases.restorePurchases();
      } else {
        customerInfo = await Purchases.purchasePackage(selectedPackage);
      }

      if (hasActiveEntitlement(customerInfo)) {
        const updatedUser = {
          ...currentUser,
          membership_expiry:
            customerInfo?.latestExpirationDate ||
            customerInfo?.customerInfo?.latestExpirationDate,
          membership_status: 1,
        };
        updateCurrentUser(updatedUser);
        await setData(storageKeys.USER, updatedUser);
        hideLoaderModal();
        flashSuccessMessage(LanguageKeys.upgradedSuccessfully);
        const navigateTo = props?.route?.params?.navigateTo;
        if (navigateTo && navigateTo === 'goBack') {
          props.navigation.goBack();
        } else {
          props.navigation.reset({
            index: 0,
            routes: [
              {
                name: 'MembershipCongrats',
                params: {
                  amount: selectedPackage?.product?.price,
                  title: selectedPackage?.product?.title,
                },
              },
            ],
          });
        }
      } else {
        if (fromRestore) {
          flashErrorMessage('restoreSubscriptionErrorMessage');
        }
        hideLoaderModal();
      }
    } catch {
      hideLoaderModal();
    } finally {
      purchaseInFlightRef.current = false;
    }
  };

  const onClosePress = () => {
    if (props?.route?.params?.from === 'SignUp') {
      props.navigation.reset({
        index: 0,
        routes: [{ name: 'BottomTab' }],
      });
    } else {
      props.navigation.goBack();
    }
  };
  const onBuyNowPress = async () => {
    setPaymentMethodListVisible(true);
  };

  const getPackages = useCallback(async () => {
    Purchases.getOfferings()
      .then((res) => {
        if (res) {
          const availablePackages: PurchasesPackage[] =
            res?.current?.availablePackages || [];
          console.log('availablePackages', availablePackages);

          // Package features mapping
          const packageFeatures: Record<string, string[]> = {
            'Plus (Starter)': [
              '10 chats instantly on purchase',
              '3 chats/day',
              'See Who Liked You',
              'Who Visited You: last 7 days',
              'Priority in Search: Low',
            ],
            'Pro (Recommended)': [
              '15 chats instantly on purchase',
              '6 chats/day',
              'See Who Liked You',
              'Who Visited You: last 30 days',
              'Premium Chat Filters',
            ],
            'Elite (Highest Visbility)': [
              '30 chats instantly on purchase',
              '12 chats/day',
              'See Who Liked You',
              'Who Visited You: last 90 days',
              'Premium Chat Filters',
              'Priority in Search: High',
            ],
          };

          // Add features to each package
          const packagesWithFeatures = availablePackages.map((pkg) => {
            const features = packageFeatures[pkg.identifier] || [];
            return {
              ...pkg,
              features,
            };
          });

          setPackagesList(packagesWithFeatures as unknown as any[]);
          setSelectedPackage(availablePackages[1]);
          setLoading(false);
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    getPackages();
  }, [getPackages]);

  const onPackageSelection = async (item: any) => {
    if (purchaseInFlightRef.current) return;
    purchaseInFlightRef.current = true;
    setSelectedPackage(item);
    setShowSubscribeButton(false);

    // Try RevenueCat purchase first
    try {
      setLoaderModal({
        visible: true,
        message: LanguageKeys.loading,
      });

      const customerInfo: any = await Purchases.purchasePackage(item);

      if (hasActiveEntitlement(customerInfo)) {
        const updatedUser = {
          ...currentUser,
          membership_expiry:
            customerInfo?.latestExpirationDate ||
            customerInfo?.customerInfo?.latestExpirationDate,
          membership_status: 1,
        };
        updateCurrentUser(updatedUser);
        await setData(storageKeys.USER, updatedUser);
        hideLoaderModal();
        flashSuccessMessage(LanguageKeys.upgradedSuccessfully);
        const navigateTo = props?.route?.params?.navigateTo;
        if (navigateTo && navigateTo === 'goBack') {
          props.navigation.goBack();
        } else {
          props.navigation.reset({
            index: 0,
            routes: [
              {
                name: 'MembershipCongrats',
                params: {
                  amount: item?.product?.price,
                  title: item?.product?.title,
                },
              },
            ],
          });
        }
      } else {
        hideLoaderModal();
        setShowSubscribeButton(true);
      }
    } catch {
      hideLoaderModal();
      // If user cancels or RevenueCat fails, show subscribe button
      setShowSubscribeButton(true);
    } finally {
      purchaseInFlightRef.current = false;
    }
  };

  const hidePaymentMethodList = () => {
    setPaymentMethodListVisible(false);
  };

  return (
    <ImageBackground style={Styles.container} source={Images.slide4}>
      <StatusBar backgroundColor={Colors.color33} barStyle={'light-content'} />
      <ModalLoader
        visible={loaderModal.visible}
        message={loaderModal.message}
      />
      <LinearGradient
        colors={[Colors.blackRGBA70, Colors.color36]}
        style={Styles.container}
      >
        <View style={Styles.linearContainer}>
          <View
            style={[
              Styles.headerContainer,
              {
                paddingTop: top,
              },
            ]}
          >
            <Image
              source={Images.logoWithoutText}
              resizeMode="contain"
              style={Styles.logo}
            />
            <Ripple onPress={onClosePress}>
              <AntDesign name="close" size={wp(8)} color={Colors.color2} />
            </Ripple>
          </View>
          <View>
            <Text style={Styles.heading}>{LanguageKeys.goProWithPureHalf}</Text>
          </View>
          {loading ? (
            <ActivityIndicator
              size={wp(5)}
              color={Colors.color2}
              style={{ marginTop: hp(10) }}
            />
          ) : (
            <View style={Styles.listOuterCon}>
              <PackagesList
                data={packagesList}
                onPackageSelection={onPackageSelection}
                navigation={props.navigation}
              />
              {showSubscribeButton && (
                <Ripple style={Styles.subscribeNowBtn} onPress={onBuyNowPress}>
                  <Text style={Styles.subscribeBtnTxt}>
                    {LanguageKeys.moreWaysToSubscribe}
                  </Text>
                </Ripple>
              )}

              <View
                style={{
                  ...Styles.termsCon,
                  flexDirection: Rtl ? 'row-reverse' : 'row',
                }}
              >
                <Text style={Styles.termsDes}>bySubscribingDes</Text>
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL('https://purehalf.com/terms-conditions/')
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      ...Styles.termsDes,
                      marginHorizontal: wp(1),
                      textDecorationLine: 'underline',
                    }}
                  >
                    termsAndConditions
                  </Text>
                </TouchableOpacity>
              </View>
              <View
                style={{
                  ...Styles.termsCon,
                  flexDirection: Rtl ? 'row-reverse' : 'row',
                  marginTop: 0,
                }}
              >
                <Text style={Styles.termsDes}>alsoRefund</Text>
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL('https://purehalf.com/refund-policy/')
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      ...Styles.termsDes,
                      marginHorizontal: wp(1),
                      textDecorationLine: 'underline',
                    }}
                  >
                    refundPolicyText
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={Styles.restoreBtn}
                onPress={onPlayOrAppStorePress.bind(null, true)}
              >
                <Text style={Styles.restoreTxt}>restoreSubscription</Text>
              </TouchableOpacity>
            </View>
          )}
          <PaymentMethodList
            visible={paymentMethodListVisible}
            onClose={hidePaymentMethodList}
            selectedPackage={selectedPackage}
            onPlayOrAppStorePress={onPlayOrAppStorePress}
          />
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

export default ProFeaturesPromotion;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  linearContainer: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  heading: {
    fontSize: Typography.large3,
    fontFamily: Fonts.APPFONT_B,
    includeFontPadding: false,
    color: Colors.color2,
    // marginBottom: hp(1.5),
  },
  listItemCon: {
    marginTop: hp(1),
    flexDirection: 'row',
    alignItems: 'center',
  },
  listOuterCon: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: hp(2),
  },
  listContainer: {
    marginTop: hp(4),
  },
  itemIcon: {
    width: wp(6),
    height: hp(4),
  },
  itemTitle: {
    fontFamily: Fonts.APPFONT_R,
    includeFontPadding: false,
    color: Colors.color2,
    marginHorizontal: wp(3),
    alignSelf: 'center',
    fontSize: Typography.small3,
  },
  subscribeNowBtn: {
    width: '100%',
    backgroundColor: Colors.color40,
    borderRadius: 8,
    height: wp(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(1),
  },
  subscribeBtnTxt: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_B,
    textAlign: 'center',
    alignSelf: 'center',
    includeFontPadding: false,
    fontSize: Typography.small3,
  },
  termsCon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(1),
  },
  termsDes: {
    fontSize: Typography.tiny1,
    alignSelf: 'center',
    textAlign: 'center',
    fontFamily: Fonts.APPFONT_R,
    includeFontPadding: false,
    color: Colors.color2,
  },
  restoreTxt: {
    fontSize: Typography.small,
    alignSelf: 'center',
    textAlign: 'center',
    fontFamily: Fonts.APPFONT_R,
    includeFontPadding: false,
    color: Colors.color2,
  },
  restoreBtn: {
    marginVertical: 5,
    paddingVertical: 5,
    alignSelf: 'center',
  },
  logo: {
    width: wp(20),
    height: hp(8),
  },
});
