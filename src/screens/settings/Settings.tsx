import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp } from '@react-native-firebase/app';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { CommonActions } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Ripple from 'react-native-material-ripple';
import Rate from 'react-native-rate';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { Container, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';
import {
  ApiServices,
  stopConversationsListener,
  StorageManager,
  useGlobalContext,
} from '../../services';

const firebaseApp = getApp();
const auth = getAuth(firebaseApp);

const Settings = (props: any) => {
  const [loading, setLoading] = useState<any>({
    visible: false,
    id: null,
  });
  const { setData, deleteAll, storageKeys, getData } = StorageManager;
  const { updateCurrentUser, language, currentUser } = useGlobalContext();
  const Rtl = CheckRtl();

  const hideLoader = () => {
    setLoading({
      visible: false,
      id: null,
    });
  };

  const onBasicInfoPress = () => {
    props.navigation.navigate('UserInput', { fromSettings: true });
  };

  const onLocationPress = () => {
    props.navigation.navigate('UserLocation');
  };

  const onBlockListPress = () => {
    props.navigation.navigate('BlockedList');
  };

  const onPrivacyPress = () => {
    props.navigation.navigate('PrivacySettings');
  };

  const onPrivatePhotoAccessPress = () => {
    props.navigation.navigate('PrivatePhotoRequest');
  };

  const onMembershipPress = () => {
    if (
      currentUser?.membership_status === 0 ||
      currentUser?.membership_status === null
    ) {
      props.navigation.navigate('ProFeaturesPromotion');
    } else {
      props.navigation.navigate('MembershipInfo');
    }
  };

  const onAddWaliPress = () => {
    props.navigation.navigate('AddWali', { fromSettings: true });
  };

  const onRateAppPress = () => {
    const options = {
      AppleAppID: '6450672518',
      GooglePackageName: 'com.zojayn',
      preferInApp: false,
      openAppStoreIfInAppFails: true,
    };

    Rate.rate(options, (success, errorMessage) => {
      if (success) {
        // this technically only tells us if the user successfully went to the Review Page. Whether they actually did anything, we do not know.
      }
      if (errorMessage) {
        console.log(errorMessage);
        // errorMessage comes from the native code. Useful for debugging, but probably not for users to view
      }
    });
  };

  const onLogoutPress = async () => {
    setLoading({
      visible: true,
      id: LanguageKeys.logOut,
    });
    const verificationId = await getData(storageKeys.FIREBASE_VERIFICATION_ID);
    await AsyncStorage.setItem('isRecommended', 'false');
    await ApiServices.logout().catch(hideLoader);
    await signOut(auth).catch(hideLoader);
    await deleteAll()
      .then(async () => {
        updateCurrentUser(null);
        await setData(storageKeys.LANGUAGE, language);
        await setData(storageKeys.FIREBASE_VERIFICATION_ID, verificationId);
        await stopConversationsListener();
        hideLoader();
        props.navigation.dispatch(
          CommonActions.reset({
            index: 1,
            routes: [{ name: 'AuthWelcome' }],
          })
        );
      })
      .catch(hideLoader);
  };

  const onHelpAndSupportPress = () => {
    Linking.openURL('https://purehalf.com/support');
  };

  const onNeedHelpPress = () => {
    // Linking.openURL("https://purehalf.com/support");
    props.navigation.navigate('ContactSupport');
  };

  const RenderBtnIcon = ({ icon, style = {} }: any) => (
    <Image source={icon} resizeMode="contain" style={[Styles.btnIcon, style]} />
  );
  const RenderBtnName = ({ name }: any) => (
    <Text style={Styles.btnTxt} numberOfLines={1}>
      {name}
    </Text>
  );

  const RenderArrow = ({ name }: any) => {
    return <AntDesign name={name} color={Colors.color1} size={wp(6)} />;
  };

  const RenderCommonBtn = ({
    icon,
    iconStyle,
    name,
    onPress,
    loading,
  }: any) => {
    return Rtl ? (
      <Ripple style={Styles.btnCon} onPress={onPress}>
        <RenderArrow name="arrowleft" />
        <View
          style={{
            ...Styles.btnConInner,
            justifyContent: Rtl ? 'flex-end' : 'flex-start',
          }}
        >
          <RenderBtnName name={name} />
          <RenderBtnIcon icon={icon} style={iconStyle} />
        </View>
      </Ripple>
    ) : (
      <Ripple style={Styles.btnCon} onPress={onPress}>
        <View
          style={{
            ...Styles.btnConInner,
            justifyContent: Rtl ? 'flex-end' : 'flex-start',
          }}
        >
          <RenderBtnIcon icon={icon} style={iconStyle} />
          <RenderBtnName name={name} />
        </View>
        {loading ? <ActivityIndicator /> : <RenderArrow name="arrowright" />}
      </Ripple>
    );
  };

  const onDeleteAccountPress = () => {
    props.navigation.navigate('AccountDeletion');
  };

  const onLanguagePress = () => {
    props.navigation.navigate('Languages');
  };

  return (
    <Container style={Styles.container}>
      <View style={Styles.headerCon}>
        <Text style={Styles.headerTitle}>{LanguageKeys.generalSettings}</Text>
      </View>
      <ScrollView
        contentContainerStyle={Styles.innerCon}
        showsVerticalScrollIndicator={false}
      >
        <RenderCommonBtn
          icon={Images.user}
          name={LanguageKeys.basicSettings}
          onPress={onBasicInfoPress}
        />
        <RenderCommonBtn
          icon={Images.mapIcon}
          name={LanguageKeys.updateLocation}
          onPress={onLocationPress}
        />
        <RenderCommonBtn
          icon={Images.block}
          name={LanguageKeys.blockedListControl}
          onPress={onBlockListPress}
        />
        <RenderCommonBtn
          icon={Images.privacy}
          name={LanguageKeys.privacySettings}
          onPress={onPrivacyPress}
        />
        <RenderCommonBtn
          icon={Images.privatePhotoRequest}
          name={LanguageKeys.privatePhotoBtnDes}
          onPress={onPrivatePhotoAccessPress}
        />
        {currentUser?.gender !== 'male' && (
          <RenderCommonBtn
            icon={Images.guardian}
            name={LanguageKeys.addWali}
            onPress={onAddWaliPress}
          />
        )}
        <RenderCommonBtn
          icon={Images.membership}
          name={LanguageKeys.membershipInformation}
          onPress={onMembershipPress}
        />
        {/* <RenderCommonBtn
          icon={Images.world}
          name={LanguageKeys.language}
          onPress={onLanguagePress}
        /> */}
        <RenderCommonBtn
          icon={Images.starBlack}
          name={LanguageKeys.rateApp}
          onPress={onRateAppPress}
        />
        <RenderCommonBtn
          icon={Images.questionIcon}
          name={LanguageKeys.helpAndSupport}
          onPress={onHelpAndSupportPress}
        />
        <RenderCommonBtn
          icon={Images.needHelp}
          name={LanguageKeys.needHelp}
          onPress={onNeedHelpPress}
        />
        {/* <RenderCommonBtn
          icon={Images.delete}
          name={LanguageKeys.deleteAccount}
          onPress={onDeleteAccountPress}
          iconStyle={Styles.deleteIcon}
        /> */}
        {/* <RenderCommonBtn
          icon={Images.logout}
          name={LanguageKeys.logOut}
          onPress={onLogoutPress}
          loading={loading.visible && loading.id === LanguageKeys.logOut}
        /> */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'flex-end',
            gap: 10,
            marginBottom: 10,
            paddingTop: 30,
            flex: 1,
          }}
        >
          <Ripple
            onPress={() =>
              Linking.openURL('https://www.facebook.com/purehalfofficial')
            }
          >
            <RenderBtnIcon
              icon={Images.facebookIcon}
              style={Styles.socialIcon}
            />
          </Ripple>
          <Ripple
            onPress={() =>
              Linking.openURL('https://www.instagram.com/purehalfofficial')
            }
          >
            <RenderBtnIcon
              icon={Images.instagramIcon}
              style={Styles.socialIcon}
            />
          </Ripple>
          <Ripple
            onPress={() =>
              Linking.openURL('https://www.tiktok.com/@purehalfofficial')
            }
          >
            <RenderBtnIcon icon={Images.tiktokIcon} style={Styles.socialIcon} />
          </Ripple>
          <Ripple
            onPress={() =>
              Linking.openURL('https://www.youtube.com/@purehalfofficial')
            }
          >
            <RenderBtnIcon
              icon={Images.youtubeIcon}
              style={Styles.socialIcon}
            />
          </Ripple>
          <Ripple onPress={() => Linking.openURL('https://purehalf.com/')}>
            <RenderBtnIcon
              icon={Images.websiteIcon}
              style={Styles.socialIcon}
            />
          </Ripple>
          <Ripple
            onPress={() =>
              Linking.openURL(
                'https://whatsapp.com/channel/0029Va8AMdt8vd1MeOSlPH25'
              )
            }
          >
            <RenderBtnIcon
              icon={Images.whatsappIcon}
              style={Styles.socialIcon}
            />
          </Ripple>
        </View>
      </ScrollView>
    </Container>
  );
};

export default Settings;

const { width } = Dimensions.get('window');
const Styles = StyleSheet.create({
  container: {
    paddingHorizontal: wp(4),
  },
  headerCon: {
    paddingTop: hp(1.5),
    paddingBottom: hp(0.5),
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_B,
    color: Colors.color1,
  },
  innerCon: {
    paddingBottom: hp(1),
    flex: 1,
  },
  btnCon: {
    borderRadius: 8,
    backgroundColor: Colors.color16,
    paddingVertical: width * 0.04 * 1,
    paddingHorizontal: wp(4),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: width * 0.04 * 1,
  },
  btnConInner: {
    width: wp(75),
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnIcon: {
    width: width * 0.05,
    height: width * 0.05 * 1,
  },
  deleteIcon: {
    width: width * 0.06,
    height: width * 0.06 * 1,
    marginLeft: wp(-0.8),
  },
  btnTxt: {
    fontSize: Typography.small2,
    alignSelf: 'center',
    fontFamily: Fonts.APPFONT_M,
    marginHorizontal: wp(3),
    color: Colors.color1,
    includeFontPadding: false,
  },
  socialIcon: {
    width: 35,
    height: 35,
  },
});
