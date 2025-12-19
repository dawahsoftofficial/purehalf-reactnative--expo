import { CommonActions } from '@react-navigation/native';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  StyleSheet,
  Text as ReactText,
  View,
} from 'react-native';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';

import { Animation } from '../../animations';
import {
  Button,
  Header,
  ModalLoader,
  SlideShowContainer,
  Text,
} from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
import {
  flashErrorMessage,
  getConversationsOnce,
  isIOS,
  StorageManager,
  useGlobalContext,
} from '../../services';

const GuardianOtpInput = ({ navigation }: any) => {
  const { setData, storageKeys } = StorageManager;
  const [modalLoader, setModalLoader] = useState(false);
  const { updateCurrentUser, updateConversations, updateConversationLoading } =
    useGlobalContext();
  const [continueLoader, setContinueLoader] = useState(false);
  const CELL_COUNT = 6;
  const [value, setValue] = useState('');
  const ref = useBlurOnFulfill({ value, cellCount: CELL_COUNT });
  const [propsCell, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue,
  });

  const onContinuePress = async () => {
    setModalLoader(true);
    const currentUser = { id: 'guardian', role: 'guardian', user: { id: 5 } };
    updateCurrentUser(currentUser);
    await setData(storageKeys.USER, currentUser);
    await setData(storageKeys.IS_LOGGED_IN, true);

    getConversationsOnce(currentUser?.user?.id, async (snapshot: any) => {
      if (snapshot) {
        const conversationsData: any = snapshot.val()
          ? _.orderBy(
              Object.values(snapshot.val()),
              ['convDetails.latestMessageCreatedAt'],
              ['desc']
            )
          : [];
        updateConversations(conversationsData);
        updateConversationLoading(false);
        await setData(storageKeys.CONVERSATIONS, conversationsData)
          .then(() => {
            setModalLoader(false);
            navigation.dispatch(
              CommonActions.reset({
                index: 1,
                routes: [{ name: 'Messages' }],
              })
            );
          })
          .catch(() => {
            setModalLoader(false);
            flashErrorMessage();
          });
      } else {
        setModalLoader(false);
        flashErrorMessage();
      }
    });
  };

  useEffect(() => {
    if (value.length === 6) {
      onContinuePress();
    }
  }, [value]);

  return (
    <SlideShowContainer>
      <Header
        navigation={navigation}
        arrowColor={Colors.color2}
        containerStyle={Styles.header}
      />
      <KeyboardAvoidingView
        behavior={'position'}
        style={Styles.container}
        keyboardVerticalOffset={hp(2)}
      >
        <Animation>
          <View style={Styles.descriptionCon}>
            <Text style={Styles.description}>
              {LanguageKeys.guardianOtpDesription}
            </Text>
            <Text style={[Styles.description, { marginHorizontal: wp(1) }]}>
              Alina Raza's
            </Text>
            <Text style={Styles.description}>{LanguageKeys.number}</Text>
          </View>
          <Text style={Styles.description}>
            {LanguageKeys.enterVerification}
          </Text>
          <View style={Styles.otpInputCon}>
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
          </View>
          <Button
            loading={continueLoader}
            loadingMessage={LanguageKeys.verifying}
            text={LanguageKeys.continue}
            onPress={onContinuePress}
            disabled={value.length < 6}
            buttonStyle={{ marginBottom: hp(3) }}
          />
        </Animation>
        <ModalLoader
          visible={modalLoader}
          message={LanguageKeys.gettingConversations}
          useModalLayout={true}
        />
      </KeyboardAvoidingView>
    </SlideShowContainer>
  );
};

export default GuardianOtpInput;

const Styles = StyleSheet.create({
  header: {
    paddingTop: hp(6),
    borderBottomWidth: 0,
  },
  heading: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_SB,
    includeFontPadding: false,
    fontSize: Typography.medium2,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: wp(4),
  },
  descriptionCon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  description: {
    fontSize: Typography.small2,
    includeFontPadding: false,
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color2,
    lineHeight: wp(6.5),
  },
  otpInputCon: {
    marginVertical: hp(3),
  },
  codeFieldRoot: {},
  cell: {
    width: wp(13),
    height: hp(6.5),
    lineHeight: wp(13),
    fontSize: Typography.large,
    borderBottomWidth: 1,
    borderColor: Colors.color2,
    borderWidth: !isIOS ? 0 : 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: Colors.color2,
    includeFontPadding: false,
  },
  focusCell: {
    color: Colors.color2,
  },
});
