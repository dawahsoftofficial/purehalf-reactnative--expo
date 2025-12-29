import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';

import PremiumPaywallScreen from '@/screens/proFeaturesPromotion/PremiumPaywallScreen';

import { CustomModal, ImageViewer } from '../components';
import { CheckRtl } from '../languages';
import DisplayForegroundNotificaton from '../notifications/DisplayForegroundNotificaton';
import {
  AccountDeleted,
  AccountDeletion,
  AccountSuspended,
  AddWali,
  AuthWelcome,
  BankTransfer,
  BlockedList,
  ChooseLanguage,
  ContactSupport,
  DiscountProFeaturesPromotion,
  GiftMembershipCongrats,
  GuardianChangePassword,
  GuardianEmailInput,
  GuardianOtpInput,
  GuardianPasswordInput,
  Languages,
  Location,
  Map,
  MembershipCongrats,
  MembershipInfo,
  Messages,
  MyVideo,
  Otp,
  PaymentOptions,
  PhoneNumber,
  PhotosAndVideos,
  PrivacySettings,
  PrivatePhotoRequest,
  Profile,
  ProfilePicture,
  PurposeOfLeaving,
  SearchProfiles,
  SearchResults,
  Settings,
  SignupStepInput,
  SignupStepRadio,
  SingleChat,
  UserInput,
  UserProfile,
  VerifyWaliCode,
  Welcome,
  WelcomeUser,
} from '../screens';
import {
  ApiServices,
  setRevenueCat,
  StorageManager,
  useGlobalContext,
} from '../services';
import BottomTab from './BottomTab';

const Stack = createNativeStackNavigator();

export const navigationRef = createNavigationContainerRef();

function App() {
  const Rtl = CheckRtl();
  const { updateCurrentUser } = useGlobalContext();
  const [loader, setLoader] = useState(true);
  const [initialRouteName, setInitialRouteName] = useState('AuthWelcome');
  const { getData, storageKeys } = StorageManager;

  const hideLoader = () => setLoader(false);

  const getUserData = () => {
    getData(storageKeys.IS_LOGGED_IN)
      .then((res: any) => {
        if (res) {
          getData(storageKeys.USER)
            .then(async (res: any) => {
              updateCurrentUser(res);
              if (res?.id === 'guardian') {
                setInitialRouteName('Messages');
              } else if (!res?.latitude || !res?.longitude) {
                setInitialRouteName('Location');
              } else if (
                !res?.first_name ||
                !res?.last_name ||
                !res?.gender ||
                !res?.date_of_birth
              ) {
                setInitialRouteName('UserInput');
              } else if (
                (!res?.media ||
                  !res?.media?.primary_image_to_show ||
                  res?.media?.primary_image_to_show?.length === 0) &&
                res?.gender === 'male'
              ) {
                setInitialRouteName('ProfilePicture');
              } else {
                const user = await ApiServices.getCurrentUserDetail();
                // console.log("UPdated Userrr", user)
                updateCurrentUser({
                  ...(user as Record<string, unknown>),
                  ...(res as Record<string, unknown>),
                });
                setRevenueCat(res?.id);
                setInitialRouteName('BottomTab');
              }
              setLoader(false);
            })
            .catch(hideLoader);
        } else {
          setLoader(false);
        }
      })
      .catch(hideLoader);
  };

  useEffect(() => {
    getUserData();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <DisplayForegroundNotificaton />
      <CustomModal />
      {!loader && (
        <Stack.Navigator
          screenOptions={() => ({
            presentation: 'card',
            animation: Rtl ? 'slide_from_left' : 'slide_from_right',
            headerShown: false,
            gestureEnabled: true,
          })}
          initialRouteName={initialRouteName}
        >
          <Stack.Screen name="BottomTab" component={BottomTab} />
          <Stack.Screen name="ChooseLanguage" component={ChooseLanguage} />
          <Stack.Screen name="Languages" component={Languages} />
          <Stack.Screen name="AuthWelcome" component={AuthWelcome} />
          <Stack.Screen name="PhoneNumber" component={PhoneNumber} />
          <Stack.Screen name="Otp" component={Otp} />
          <Stack.Screen name="UserInput" component={UserInput} />
          <Stack.Screen name="Location" component={Location} />
          <Stack.Screen
            name="ProFeaturesPromotion"
            component={PremiumPaywallScreen}
            options={
              {
                // presentation: 'fullScreenModal',
              }
            }
          />
          <Stack.Screen
            name="DiscountProFeaturesPromotion"
            component={DiscountProFeaturesPromotion}
          />
          <Stack.Screen
            name="MembershipCongrats"
            component={MembershipCongrats}
          />
          <Stack.Screen
            name="GiftMembershipCongrats"
            component={GiftMembershipCongrats}
          />
          <Stack.Screen name="WelcomeUser" component={WelcomeUser} />
          <Stack.Screen name="PaymentOptions" component={PaymentOptions} />
          <Stack.Screen name="Welcome" component={Welcome} />
          <Stack.Screen name="BankTransfer" component={BankTransfer} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="Messages" component={Messages} />
          <Stack.Screen name="SingleChat" component={SingleChat} />
          <Stack.Screen name="Settings" component={Settings} />
          <Stack.Screen name="BlockedList" component={BlockedList} />
          <Stack.Screen name="PrivacySettings" component={PrivacySettings} />
          <Stack.Screen name="MembershipInfo" component={MembershipInfo} />
          <Stack.Screen name="SearchProfiles" component={SearchProfiles} />
          <Stack.Screen name="SearchResults" component={SearchResults} />
          <Stack.Screen name="ImageViewer" component={ImageViewer} />
          <Stack.Screen name="PhotosAndVideos" component={PhotosAndVideos} />
          <Stack.Screen name="MyVideo" component={MyVideo} />
          <Stack.Screen name="AccountDeletion" component={AccountDeletion} />
          <Stack.Screen name="PurposeOfLeaving" component={PurposeOfLeaving} />
          <Stack.Screen name="AccountDeleted" component={AccountDeleted} />
          <Stack.Screen
            name="PrivatePhotoRequest"
            component={PrivatePhotoRequest}
          />
          <Stack.Screen name="UserProfile" component={UserProfile} />
          <Stack.Screen name="ContactSupport" component={ContactSupport} />
          <Stack.Screen
            name="GuardianEmailInput"
            component={GuardianEmailInput}
          />
          <Stack.Screen name="GuardianOtpInput" component={GuardianOtpInput} />
          <Stack.Screen name="AddWali" component={AddWali} />
          <Stack.Screen name="VerifyWaliCode" component={VerifyWaliCode} />
          <Stack.Screen
            name="GuardianPasswordInput"
            component={GuardianPasswordInput}
          />
          <Stack.Screen
            name="GuardianChangePassword"
            component={GuardianChangePassword}
          />
          <Stack.Screen name="ProfilePicture" component={ProfilePicture} />
          <Stack.Screen name="UserLocation" component={Map} />
          <Stack.Screen name="AccountSuspended" component={AccountSuspended} />
          <Stack.Screen name="SignupStepInput" component={SignupStepInput} />
          <Stack.Screen name="SignupStepRadio" component={SignupStepRadio} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default App;
