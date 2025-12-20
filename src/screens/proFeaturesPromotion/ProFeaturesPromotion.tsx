import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Linking,
  LogBox,
  StatusBar,
  TouchableOpacity,
  View,
} from 'react-native';
import { StyleSheet } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Purchases from 'react-native-purchases';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { LinearGradient, ModalLoader, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
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

const ProFeaturesPromotion = (props: any) => {
  LogBox.ignoreAllLogs(true);
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
  const [packagesList, setPackagesList] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState<any>('');
  const [showSubscribeButton, setShowSubscribeButton] = useState(false);

  const hideLoading = () => setLoading(false);
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
    setPaymentMethodListVisible(false);
    setLoaderModal({
      visible: true,
      message: LanguageKeys.loading,
    });
    try {
      // const userID = JSON.stringify(currentUser?.id)
      // await Purchases.logIn(userID)

      let customerInfo: any = null;
      if (fromRestore) {
        customerInfo = await Purchases.restorePurchases();
      } else {
        customerInfo = await Purchases.purchasePackage(selectedPackage);
      }

      if (
        customerInfo?.activeSubscriptions?.length !== 0 &&
        (customerInfo?.latestExpirationDate ||
          customerInfo?.customerInfo?.latestExpirationDate)
      ) {
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
        console.log('navigateTo', navigateTo);
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
    } catch (e: any) {
      hideLoaderModal();
      console.log('error while purchasing package =>', e);
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
    if (selectedPackage?.title === 'free') onClosePress();
    else setPaymentMethodListVisible(true);
  };

  const getPackages = async () => {
    Purchases.getOfferings()
      .then((res) => {
        console.warn('getPackages', res);
        if (res) {
          const availablePackages: any = res?.current?.availablePackages;
          setPackagesList(availablePackages);
          setSelectedPackage(availablePackages[1]);
          setLoading(false);
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        console.log('error while getting packages =>', error);
        hideLoading();
      });
  };

  useEffect(() => {
    getPackages();
  }, []);

  const onPackageSelection = async (item: any) => {
    setSelectedPackage(item);
    setShowSubscribeButton(false);

    // Skip RevenueCat for free package
    if (item?.title === 'free') {
      return;
    }

    // Try RevenueCat purchase first
    try {
      setLoaderModal({
        visible: true,
        message: LanguageKeys.loading,
      });

      const customerInfo: any = await Purchases.purchasePackage(item);

      if (
        customerInfo?.activeSubscriptions?.length !== 0 &&
        (customerInfo?.latestExpirationDate ||
          customerInfo?.customerInfo?.latestExpirationDate)
      ) {
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
    } catch (e: any) {
      hideLoaderModal();
      console.log('error while purchasing package =>', e);
      // If user cancels or RevenueCat fails, show subscribe button
      setShowSubscribeButton(true);
    }
  };

  const hidePaymentMethodList = () => {
    setPaymentMethodListVisible(false);
  };

  return (
    <ImageBackground style={Styles.container} source={Images.slide4}>
      <StatusBar
        translucent
        backgroundColor={'transparent'}
        barStyle={'light-content'}
      />
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
            style={{
              ...Styles.headerContainer,
              alignItems: Rtl ? 'flex-start' : 'flex-end',
            }}
          >
            <Ripple onPress={onClosePress}>
              <AntDesign name="close" size={wp(10)} color={Colors.color2} />
            </Ripple>
          </View>
          <View>
            <Text style={Styles.heading}>{LanguageKeys.goProWithPureHalf}</Text>
            <FlatList
              data={proFeatures}
              renderItem={renderProFeatures}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
          {loading ? (
            <ActivityIndicator
              color={Colors.color2}
              size={wp(5)}
              style={{ marginTop: hp(10) }}
            />
          ) : (
            <View style={Styles.listOuterCon}>
              <PackagesList
                data={packagesList}
                onPackageSelection={onPackageSelection}
                navigation={props.navigation}
              />
              {showSubscribeButton && selectedPackage?.title !== 'free' && (
                <Ripple style={Styles.subscribeNowBtn} onPress={onBuyNowPress}>
                  <Text style={Styles.subscribeBtnTxt}>
                    {LanguageKeys.moreWaysToSubscribe}
                  </Text>
                </Ripple>
              )}
              {selectedPackage?.title === 'free' && (
                <Ripple style={Styles.subscribeNowBtn} onPress={onBuyNowPress}>
                  <Text style={Styles.subscribeBtnTxt}>
                    {props?.route?.params?.from === 'SignUp'
                      ? 'continue'
                      : 'goBack'}
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
    paddingTop: hp(5),
    paddingBottom: hp(2),
  },
  heading: {
    fontSize: Typography.large3,
    fontFamily: Fonts.APPFONT_B,
    includeFontPadding: false,
    color: Colors.color2,
    marginBottom: hp(1.5),
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
});
