import {
  View,
  Image,
  ImageBackground,
  StatusBar,
  BackHandler,
  SafeAreaView,
} from 'react-native';
import React, { useEffect } from 'react';
import { Button, Text } from '../../components';
import { Images } from '../../res';
import { Animation } from '../../animations';
import { LanguageKeys } from '../../languages';
import { StyleSheet } from 'react-native';
import { hp, wp, Typography } from '../../global';
import { Colors, Fonts } from '../../res';
import { addAnaylatics } from '../../services/firebase/analytics';
import { ApiServices, StorageManager, useGlobalContext } from '../../services';
import moment from 'moment';
import { AppEventsLogger } from 'react-native-fbsdk-next';

const MembershipCongrats = (props: any) => {
  const {
    title,
    amount,
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
      AppEventsLogger.logPurchase(amount, 'PKR');
      ApiServices.updateDetails({ paid_tracking: 1 }).then(async (res) => {
        await setData(storageKeys.USER, res);
        updateCurrentUser(res);
      });
    }
  };

  useEffect(() => {
    updateNewTransaction();
    if (title && amount) {
      addAnaylatics('PaymentSuccess', { amount });
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

  return (
    <ImageBackground source={Images.slide4} style={Styles.container}>
      <StatusBar
        translucent
        backgroundColor={'transparent'}
        barStyle={'dark-content'}
      />
      <View style={Styles.contentContainer}>
        <View style={Styles.iconContainer}>
          <Animation animation="zoomIn">
            <Image
              source={Images.membership}
              resizeMode="contain"
              style={Styles.icon}
            />
          </Animation>
        </View>
        <Animation style={Styles.buttonDescriptionSecion}>
          {/* <Text style={Styles.heading}>
                            {LanguageKeys.proUserSuccessHeading}
                        </Text> */}

          <Text style={Styles.heading}>
            {'Alhamdulillah! You are now a premium member'}
          </Text>
          <Text style={Styles.description}>{`You've paid Rs. ${amount}`}</Text>
          <Text
            containerStyle={{ justifyContent: 'center' }}
            style={Styles.expiryText}
          >
            {LanguageKeys.membershipactiveText}{' '}
            {moment(currentUser?.membership_expiry || date_of_expiry).format(
              'DD MMM, YYYY'
            )}
          </Text>
          <Text style={Styles.description}>{'Enjoy the superpowers!'}</Text>
          {/* <Text style={Styles.description}>
                        {LanguageKeys.membershipUpgradeMsg}
                    </Text> */}
        </Animation>
        <Button
          buttonStyle={{ marginBottom: 20, backgroundColor: Colors.color47 }}
          text={LanguageKeys.diveInAndExplore}
          onPress={onGetStartedPress}
        />
      </View>
    </ImageBackground>
  );
};

export default MembershipCongrats;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: Colors.whiteRGBA90,
    paddingHorizontal: wp(4),
  },
  iconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 150,
    height: 150,
    tintColor: Colors.color47,
  },
  buttonDescriptionSecion: {
    paddingBottom: hp(3),
    paddingTop: hp(3),
  },
  heading: {
    color: Colors.color47,
    fontFamily: Fonts.APPFONT_B,
    includeFontPadding: false,
    fontSize: Typography.large,
    alignSelf: 'center',
    textAlign: 'center',
  },
  description: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_R,
    includeFontPadding: false,
    fontSize: Typography.small2,
    alignSelf: 'center',
    textAlign: 'center',
    marginTop: 10,
  },
  expiryText: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_R,
    includeFontPadding: false,
    fontSize: Typography.small2,
    marginTop: 10,
    alignSelf: 'center',
    textAlign: 'center',
  },
});
