import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Ripple from 'react-native-material-ripple';

import { Animation } from '../../animations';
import { Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl } from '../../languages';
import { Colors, Fonts } from '../../res';
import { ApiServices, useGlobalContext } from '../../services';
import Bank from './Bank';
import EasyPaisa from './EasyPaisa';
import JazzCash from './JazzCash';

const PaymentMethodList = (props: any) => {
  const Rtl = CheckRtl();
  const { visible = false, selectedPackage = {} } = props;
  const { currentUser } = useGlobalContext();
  const [easyPaisaVisible, setEasyPaisaVisible] = useState(false);
  const [jazzCashVisible, setJazzCashVisible] = useState(false);
  const [bankVisible, setBankVisible] = useState(false);
  const [bankDetails, setBankDetails] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [os] = useState(Platform.OS === 'android' ? '2' : '1');

  const getData = useCallback(() => {
    const userCountry = currentUser?.country || null;

    const filterPaymentMethodsByCountry = (methods: any[]) => {
      return methods.filter((item: any) => {
        // Get country from detail.COUNTRY or detail_complete.COUNTRY
        const paymentMethodCountry =
          item?.detail?.COUNTRY || item?.detail_complete?.COUNTRY || null;

        // If country is -1, show for everyone
        if (paymentMethodCountry === -1 || paymentMethodCountry === '-1') {
          return true;
        }

        // If no payment method country specified, show it (fallback)
        if (!paymentMethodCountry) {
          return true;
        }

        // If no user country, show all (fallback)
        if (!userCountry) {
          return true;
        }

        // Normalize country values for comparison (handle both string and number)
        const normalizedPaymentCountry = String(
          paymentMethodCountry || ''
        ).toUpperCase();
        const normalizedUserCountry = String(userCountry || '').toUpperCase();

        // If payment method country is PK
        if (normalizedPaymentCountry === 'PK') {
          // Only show if user country is also PK
          return normalizedUserCountry === 'PK';
        }

        // For other countries, show only if user country matches
        return normalizedPaymentCountry === normalizedUserCountry;
      });
    };

    ApiServices.getPaymentInfo()
      .then((res: any) => {
        const sortedMethods = res?.sort(
          (a: any, b: any) => a?.position - b?.position
        );
        const filteredMethods = filterPaymentMethodsByCountry(
          sortedMethods || []
        );
        setPaymentMethods(filteredMethods);
      })
      .catch(() => {});
  }, [currentUser?.country]);

  useEffect(() => {
    getData();
  }, [getData]);

  const onItemPress = (item: any) => {
    const msg = `Salaam, its ${currentUser?.first_name + ' ' + currentUser?.last_name}, I would like to purchase a ${selectedPackage?.packageType} Subscription (${selectedPackage?.product?.priceString}). My Payment number is ${JSON.stringify(currentUser?.id * 3146)}. Jazak Allah Khayran`;
    const phoneWithCountryCode = '923330093158';

    const mobile =
      Platform.OS == 'ios' ? phoneWithCountryCode : '+' + phoneWithCountryCode;
    if (item.id?.toString()?.startsWith('bank')) {
      setBankDetails(item);
      setBankVisible(true);
    } else if (item.id?.toString()?.startsWith('jazz_cash')) {
      if (mobile) {
        if (msg) {
          const url = 'whatsapp://send?text=' + msg + '&phone=' + mobile;
          Linking.openURL(url).catch(() => {
            console.log('Make sure WhatsApp installed on your device');
          });
        } else {
          console.log('Please insert message to send');
        }
      }
    } else if (item.id?.toString()?.startsWith('easy_paisa')) {
      if (mobile) {
        if (msg) {
          const url = 'whatsapp://send?text=' + msg + '&phone=' + mobile;
          Linking.openURL(url).catch(() => {
            console.log('Make sure WhatsApp installed on your device');
          });
        } else {
          console.log('Please insert message to send');
        }
      }
    } else if (item?.type === 6) {
      if (props?.onPlayOrAppStorePress) {
        props?.onPlayOrAppStorePress();
      }
    } else if (item?.type === 5) {
      if (props?.onPlayOrAppStorePress) {
        props?.onPlayOrAppStorePress();
      }
    }
  };

  const renderPaymentMethods = ({ item, index }: any) => {
    if (item?.device_type !== os && item?.device_type != 0) return null;
    return (
      <Ripple
        style={[
          Styles.itemContainer,
          {
            flexDirection: Rtl ? 'row-reverse' : 'row',
            borderBottomWidth: index === paymentMethods.length - 1 ? 0 : 0.5,
          },
        ]}
        onPress={onItemPress.bind(null, item)}
      >
        <Image
          source={{ uri: item?.icon }}
          resizeMode="contain"
          style={Styles.itemImage}
        />
        <Text style={Styles.itemLabel}>
          {item?.detail?.SERVICE ||
            item?.detail?.ACCOUNT_NAME ||
            item?.detail?.BANK}
        </Text>
      </Ripple>
    );
  };

  const renderListHeader = () => (
    <View style={Styles.headerCon}>
      <Text style={Styles.heading}>choosePaymentMethod</Text>
      <Text style={Styles.headingDescription}>paymentMethodDescription</Text>
    </View>
  );

  const hideEasyPaisa = () => {
    setEasyPaisaVisible(false);
  };

  const hideJazzCash = () => {
    setJazzCashVisible(false);
  };

  const onClose = () => {
    if (easyPaisaVisible) {
      setEasyPaisaVisible(false);
    }
    if (jazzCashVisible) {
      setJazzCashVisible(false);
    }
    if (bankVisible) {
      setBankVisible(false);
    }
    if (props?.onClose) {
      props.onClose();
    }
  };

  const onRequestClose = () => {
    if (easyPaisaVisible) {
      setEasyPaisaVisible(false);
    }
    if (jazzCashVisible) {
      setJazzCashVisible(false);
    } else {
      if (props?.onClose) {
        props.onClose();
      }
    }
  };

  return (
    <Modal visible={visible} transparent={true} onRequestClose={onRequestClose}>
      <TouchableOpacity
        style={Styles.container}
        activeOpacity={1}
        onPress={onClose}
      >
        <StatusBar
          backgroundColor={Colors.blackRGBA70}
          barStyle={'light-content'}
        />
        <Animation duration={500}>
          <TouchableOpacity style={Styles.contentContainer} activeOpacity={1}>
            {easyPaisaVisible ? (
              <EasyPaisa
                onClose={hideEasyPaisa}
                selectedPackage={selectedPackage}
                onCloseAll={onClose}
              />
            ) : jazzCashVisible ? (
              <JazzCash
                onClose={hideJazzCash}
                selectedPackage={selectedPackage}
                onCloseAll={onClose}
              />
            ) : bankVisible ? (
              <Bank
                onClose={() => setBankVisible(false)}
                selectedPackage={selectedPackage}
                bankDetails={bankDetails}
                onCloseAll={onClose}
              />
            ) : (
              <FlatList
                data={paymentMethods}
                renderItem={renderPaymentMethods}
                ListHeaderComponent={renderListHeader}
              />
            )}
          </TouchableOpacity>
        </Animation>
      </TouchableOpacity>
    </Modal>
  );
};

export default PaymentMethodList;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.blackRGBA70,
    justifyContent: 'flex-end',
  },
  contentContainer: {
    paddingTop: hp(2.5),
    paddingBottom: hp(2),
    backgroundColor: Colors.color2,
    borderTopRightRadius: 12,
    borderTopLeftRadius: 12,
    paddingHorizontal: wp(6),
  },
  itemContainer: {
    borderBottomColor: Colors.color18,
    height: hp(7),
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 30,
    height: 30,
  },
  headerCon: {
    paddingBottom: hp(3),
  },
  heading: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.medium2,
    includeFontPadding: false,
  },
  headingDescription: {
    color: Colors.color12,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small,
    includeFontPadding: false,
    marginTop: hp(0.3),
  },
  itemLabel: {
    color: Colors.color1,
    alignSelf: 'center',
    textAlign: 'center',
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small2,
    marginHorizontal: wp(5),
  },
  itemLabelTwo: {
    marginHorizontal: wp(6.4),
  },
  itemImageTwo: {
    width: 50,
    height: 30,
  },
});
