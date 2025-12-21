import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text as ReactText,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';

import { Button, Container, Header, ModalLoader, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
import {
  ApiServices,
  flashSuccessMessage,
  isIOS,
  StorageManager,
  useGlobalContext,
} from '../../services';

const VerifyWaliCode = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const { setData, storageKeys, getData } = StorageManager;
  const guardian = currentUser?.guardian;
  const CELL_COUNT = 6;
  const [value, setValue] = useState('');
  const ref = useBlurOnFulfill({ value, cellCount: CELL_COUNT });
  const [propsCell, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue,
  });
  const [loader, setLoader] = useState(false);
  const [verificationCodeTimer, setVerificationCodeTimer] = useState<any>(0);
  const [timerLoaded, setTimerLoaded] = useState(false);
  const [modalOverlay, setModalOverlay] = useState({
    visible: false,
    message: '',
  });

  const verifyCode = async (value: any) => {
    try {
      setLoader(true);
      await ApiServices.verifyWaliCode(value);
      await ApiServices.getCurrentUserDetail().then(async (res) => {
        updateCurrentUser(res);
        await setData(storageKeys.USER, res);
      });
      flashSuccessMessage(LanguageKeys.verified);
      navigation.goBack();
    } catch (error) {
      setLoader(false);
    }
  };

  useEffect(() => {
    if (value.length === 6) {
      setTimeout(() => {
        verifyCode(value);
      }, 0);
    }
  }, [value]);

  const calculateRemainingTime = async () => {
    const startTimeString: any = await getData(
      storageKeys.VERIFICATION_CODE_TIMER
    );
    if (startTimeString) {
      const startTime = parseInt(startTimeString, 10);
      const currentTime = new Date().getTime();
      const elapsedTime = currentTime - startTime;
      const initialDuration = 5 * 60 * 1000;
      const remainingTime = Math.max(initialDuration - elapsedTime, 0);
      setVerificationCodeTimer(remainingTime);
      setTimerLoaded(true);
    } else {
      setTimerLoaded(true);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      calculateRemainingTime();
    }, 0);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (verificationCodeTimer > 0) {
        setVerificationCodeTimer(verificationCodeTimer - 1000);
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [verificationCodeTimer]);

  const formatVerificationCodeTimer = () => {
    const minutes = Math.floor(verificationCodeTimer / 60000);
    const seconds = Math.ceil((verificationCodeTimer % 60000) / 1000);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
  };

  const hideOverlayModal = () => {
    setModalOverlay({
      visible: false,
      message: '',
    });
  };

  const onResendCode = () => {
    setModalOverlay({
      visible: true,
      message: t(LanguageKeys.resendingCode),
    });
    ApiServices.resendWaliVerificationCode()
      .then(async () => {
        hideOverlayModal();
        const startTime = new Date().getTime();
        await setData(
          storageKeys.VERIFICATION_CODE_TIMER,
          startTime.toString()
        );
        calculateRemainingTime();
        flashSuccessMessage(LanguageKeys.verificationCodeSent);
      })
      .catch(hideOverlayModal);
  };

  return (
    <Container>
      <Header navigation={navigation} title={LanguageKeys.verifyCode} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          behavior={!isIOS ? 'height' : 'position'}
          style={Styles.container}
          keyboardVerticalOffset={hp(10)}
          contentContainerStyle={{ justifyContent: 'space-between', flex: 1 }}
        >
          <View style={Styles.descriptionCon}>
            <ReactText style={Styles.description}>
              {t(LanguageKeys.verificationCodeSendDes1)}
            </ReactText>
            <ReactText
              style={[
                Styles.description,
                { fontFamily: Fonts.APPFONT_SB, color: Colors.color1 },
              ]}
            >
              {guardian?.email}
            </ReactText>
            <ReactText style={Styles.description}>
              {t(LanguageKeys.verificationCodeSendDes2)}
            </ReactText>
          </View>
          <View style={Styles.timerContainer}>
            {timerLoaded && (
              <>
                {verificationCodeTimer < 100 ? (
                  <TouchableOpacity onPress={onResendCode} activeOpacity={0.5}>
                    <Text style={Styles.resendCodeText}>
                      {LanguageKeys.resendVerificationCode}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <Text style={Styles.description}>
                      {LanguageKeys.verificationCodeExpiredDes}
                    </Text>
                    <ReactText style={Styles.timer}>
                      {formatVerificationCodeTimer()}
                    </ReactText>
                  </>
                )}
              </>
            )}
          </View>
          <View>
            <CodeField
              ref={ref}
              {...propsCell}
              caretHidden={false}
              value={value}
              onChangeText={setValue}
              cellCount={CELL_COUNT}
              rootStyle={Styles.codeFieldRoot}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              renderCell={({ index, symbol, isFocused }) => (
                <ReactText
                  key={index}
                  style={[Styles.cell, isFocused && Styles.focusCell]}
                  onLayout={getCellOnLayoutHandler(index)}
                >
                  {symbol || (isFocused ? <Cursor /> : null)}
                </ReactText>
              )}
            />
            <Button
              text={LanguageKeys.verifyCode}
              onPress={verifyCode.bind(null, value)}
              loading={loader}
              loadingMessage={LanguageKeys.verifying}
            />
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
      <ModalLoader
        visible={modalOverlay?.visible}
        message={modalOverlay?.message}
      />
    </Container>
  );
};

export default VerifyWaliCode;

const Styles = StyleSheet.create({
  codeFieldRoot: {
    marginBottom: 15,
  },
  cell: {
    width: 50,
    height: 50,
    lineHeight: 47,
    fontSize: Typography.large,
    borderBottomWidth: 1,
    borderColor: Colors.color1,
    borderWidth: !isIOS ? 0 : 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: Colors.color1,
  },
  focusCell: {
    color: Colors.color1,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingBottom: 20,
  },
  descriptionCon: {
    paddingTop: hp(5),
  },
  description: {
    color: Colors.color32,
    fontFamily: Fonts.APPFONT_R,
    textAlign: 'center',
    fontSize: Typography.small3,
    alignSelf: 'center',
    marginHorizontal: wp(6),
  },
  resendCodeText: {
    alignSelf: 'center',
    fontFamily: Fonts.APPFONT_SB,
    color: Colors.theme,
    fontSize: Typography.small2,
    marginTop: 50,
  },
  timerContainer: {
    flex: 1,
    paddingTop: hp(6),
    alignItems: 'center',
  },
  timer: {
    color: Colors.color32,
    textAlign: 'center',
    fontFamily: Fonts.APPFONT_B,
    fontSize: 60,
    marginVertical: 25,
  },
});
