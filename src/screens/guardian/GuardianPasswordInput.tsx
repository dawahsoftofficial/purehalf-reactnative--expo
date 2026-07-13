import { CommonActions } from '@react-navigation/native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  KeyboardAvoidingView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { Animation } from '../../animations';
import {
  Button,
  Header,
  ModalLoader,
  SlideShowContainer,
  Text,
} from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';
import {
  ApiServices,
  checkEmpty,
  flashErrorMessage,
  flashSuccessMessage,
  StorageManager,
  useGlobalContext,
} from '../../services';

const GuardianPasswordInput = ({ navigation, route }: any) => {
  const { t } = useTranslation();
  const { getData, storageKeys, setData } = StorageManager;
  const { updateCurrentUser } = useGlobalContext();
  const Rtl = CheckRtl();
  const email = route?.params?.email;
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [modalLoader, setModalLoader] = useState({
    visible: false,
    message: '',
  });

  const onChangePassword = (text: string) => setPassword(text);

  const hideModalLoader = () => {
    setModalLoader({
      visible: false,
      message: '',
    });
  };

  // Guardian sessions no longer hydrate a Firebase RTDB conversation list on
  // login (RTDB removed). Persist the session and route to Messages, which
  // loads conversations from the REST API. Guardian mobile code is slated for
  // removal — this is left as a safe no-op path, not rebuilt.
  const persistGuardianSession = async (currentUser: any) => {
    setModalLoader({
      visible: true,
      message: t(LanguageKeys.loggingIn),
    });
    try {
      await setData(storageKeys.USER, currentUser);
      await setData(storageKeys.IS_LOGGED_IN, true);
      updateCurrentUser(currentUser);
      hideModalLoader();
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [{ name: 'Messages' }],
        })
      );
    } catch (error) {
      hideModalLoader();
      flashErrorMessage();
    }
  };

  const onLoginPress = async () => {
    if (password?.length < 8) {
      flashErrorMessage(LanguageKeys.passwordLengthError);
    } else {
      setLoading(true);
      try {
        const fcm_token = await getData(storageKeys.FCM_TOKEN);
        const response = await ApiServices.authenticateGuardian({
          email: email?.toLowerCase().trim(),
          password: password.trim(),
          fcm_token,
        });
        response.user_id = response.id;
        response.id = 'guardian';
        response.role = 'guardian';
        flashSuccessMessage(LanguageKeys.loggedInSuccessfully);
        setLoading(false);
        persistGuardianSession(response);
      } catch (error) {
        setLoading(false);
      }
    }
  };
  const handleSecureTextEntry = () => setSecureTextEntry(!secureTextEntry);

  return (
    <SlideShowContainer disabled>
      <View>
        <Image source={Images.slide1} resizeMode="cover" style={Styles.image} />
        <LinearGradient
          style={Styles.imageOuterView}
          colors={[Colors.blackRGBA25, Colors.blackRGBA38]}
        />
      </View>
      <ModalLoader
        visible={modalLoader.visible}
        message={modalLoader.message}
      />
      <View style={Styles.container}>
        <Header
          navigation={navigation}
          arrowColor={Colors.color2}
          containerStyle={Styles.header}
        />
        <KeyboardAvoidingView behavior={'height'} style={{ flex: 1 }}>
          <Animation style={Styles.contentContainer}>
            <Text style={Styles.heading}>{LanguageKeys.enterYourPassword}</Text>
            <View style={Styles.passwordInputCon}>
              <TextInput
                style={[
                  Styles.passwordInput,
                  { textAlign: Rtl ? 'right' : 'left' },
                ]}
                value={password}
                onChangeText={onChangePassword}
                placeholder="＊＊＊＊＊＊"
                placeholderTextColor={Colors.color15}
                secureTextEntry={secureTextEntry}
              />
              {!secureTextEntry ? (
                <TouchableOpacity
                  onPress={handleSecureTextEntry}
                  activeOpacity={0.7}
                  style={Styles.eyeBtn}
                >
                  <Ionicons name="eye" color={Colors.color2} size={25} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleSecureTextEntry}
                  activeOpacity={0.7}
                  style={Styles.eyeBtn}
                >
                  <Ionicons name="eye-off" color={Colors.color2} size={25} />
                </TouchableOpacity>
              )}
            </View>

            <Button
              text={LanguageKeys.login}
              onPress={onLoginPress}
              loading={loading}
              loadingMessage={LanguageKeys.loggingIn}
              disabled={checkEmpty(password) || loading}
              icon={
                <MaterialCommunityIcons
                  name={'logout-variant'}
                  size={wp(5)}
                  color={Colors.color2}
                />
              }
            />
          </Animation>
        </KeyboardAvoidingView>
      </View>
    </SlideShowContainer>
  );
};

export default GuardianPasswordInput;

const Styles = StyleSheet.create({
  imageOuterView: {
    height: '100%',
    width: wp(100),
    position: 'absolute',
    zIndex: 1,
  },
  image: {
    width: wp(100),
    height: '100%',
  },
  container: {
    position: 'absolute',
    height: hp(100),
    width: wp(100),
    zIndex: 1,
  },
  header: {
    paddingTop: hp(6),
    borderBottomWidth: 0,
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    paddingBottom: hp(4),
    width: wp(100),
    zIndex: 1,
    paddingHorizontal: wp(4),
  },
  heading: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_SB,
    includeFontPadding: false,
    fontSize: Typography.medium2,
  },
  passwordInputCon: {
    height: 48,
    marginVertical: hp(3),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomColor: Colors.color2,
    borderBottomWidth: 1,
  },
  passwordInput: {
    color: Colors.color2,
    paddingVertical: 10,
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_R,
    paddingHorizontal: wp(2),
    width: wp(78),
  },
  eyeBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    flex: 1,
  },
});
