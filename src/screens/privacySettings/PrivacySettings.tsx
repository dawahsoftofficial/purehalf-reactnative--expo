import moment from 'moment';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Switch } from 'react-native-switch';

import { Container, Header, ModalLoader, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
import {
  ApiServices,
  flashSuccessMessage,
  useGlobalContext,
} from '../../services';
import { StorageManager } from '../../services';

const PrivacySettings = (props: any) => {
  const { setData, storageKeys } = StorageManager;
  const [loader, setLoader] = useState({
    visible: false,
    message: 'Loading...',
  });
  const { currentUser, updateCurrentUser } = useGlobalContext();

  const Rtl = CheckRtl();
  const [searchVisibility, setSearchVisibility] = useState(
    currentUser?.search_visibility === 1 ? true : false
  );
  const [inAppNotification, setInAppNotification] = useState(
    currentUser?.in_app_notifications === 1 ? true : false
  );
  const [emailNotification, setEmailNotification] = useState(
    currentUser?.email_notification === 1 ? true : false
  );
  const [smsNotification, setSMSNotification] = useState(
    currentUser?.sms_notification === 1 ? true : false
  );

  const searchVisibilityToggle = () => {
    setSearchVisibility(!searchVisibility);
    const params = {
      search_visibility: !searchVisibility ? 1 : 0,
      in_app_notifications: inAppNotification ? 1 : 0,
    };
    updateToggle(params);
  };

  const inAppNotificationToggle = () => {
    setInAppNotification(!inAppNotification);
    const params = {
      in_app_notifications: !inAppNotification ? 1 : 0,
      search_visibility: searchVisibility ? 1 : 0,
    };
    updateToggle(params);
  };

  const emailNotificationToggle = () => {
    setEmailNotification(!emailNotification);
    const params = {
      in_app_notifications: inAppNotification ? 1 : 0,
      search_visibility: searchVisibility ? 1 : 0,
      email_notification: !emailNotification ? 1 : 0,
      sms_notification: smsNotification ? 1 : 0,
    };
    updateToggle(params);
  };

  const smsNotificationToggle = () => {
    setSMSNotification(!smsNotification);
    const params = {
      in_app_notifications: inAppNotification ? 1 : 0,
      search_visibility: searchVisibility ? 1 : 0,
      email_notification: emailNotification ? 1 : 0,
      sms_notification: !smsNotification ? 1 : 0,
    };
    updateToggle(params);
  };

  const hideLoader = () =>
    setLoader({
      visible: false,
      message: '',
    });

  const updateToggle = (params: any) => {
    const {
      first_name,
      last_name,
      gender,
      date_of_birth,
      interface_language_id,
      country,
      city,
      latitude,
      longitude,
    } = currentUser;

    setLoader({
      visible: true,
      message: 'Updating...',
    });
    const dob = moment(date_of_birth, 'DD MMM,YYYY').toDate();
    const newParams = {
      ...params,
      first_name: first_name,
      last_name: last_name,
      gender: gender,
      date_of_birth: moment(dob).format('YYYY-MM-DD'),
      interface_language_id: interface_language_id,
      country: country,
      city: city,
      longitude: longitude,
      latitude: latitude,
    };
    ApiServices.updateUserInfo(newParams)
      .then(async () => {
        const updatedUser = {
          ...currentUser,
          search_visibility: newParams.search_visibility,
          in_app_notifications: newParams.in_app_notifications,
          email_notification: newParams.email_notification,
          sms_notification: newParams.sms_notification,
        };
        updateCurrentUser(updatedUser);
        await setData(storageKeys.USER, updatedUser);
        flashSuccessMessage(LanguageKeys.updated);
        hideLoader();
      })
      .catch(hideLoader);
  };

  const RenderField = ({
    heading,
    description,
    switchEnabled,
    onChangeSwitch,
    showDivider = false,
  }: any) => (
    <View
      style={[
        Styles.fieldCon,
        showDivider && Styles.divider,
        { flexDirection: Rtl ? 'row-reverse' : 'row' },
      ]}
    >
      <View
        style={[
          Styles.fieldTxtCon,
          { alignItems: Rtl ? 'flex-end' : 'flex-start' },
        ]}
      >
        <Text style={Styles.fieldTxt}>{heading}</Text>
        {description ? (
          <Text style={Styles.fieldDesc}>{description}</Text>
        ) : null}
      </View>
      <Switch
        value={switchEnabled}
        onValueChange={onChangeSwitch}
        renderActiveText={false}
        renderInActiveText={false}
        circleSize={25}
        backgroundActive={Colors.primary}
        backgroundInactive={Colors.color18}
        innerCircleStyle={Styles.switchInner}
      />
    </View>
  );
  return (
    <Container style={Styles.screen}>
      <Header
        title={LanguageKeys.privacySettings}
        navigation={props.navigation}
        titleVariant="display"
      />
      <ModalLoader visible={loader.visible} message={loader.message} />

      <ScrollView
        contentContainerStyle={Styles.innerCon}
        showsVerticalScrollIndicator={false}
      >
        <Text style={Styles.sectionLabel}>{LanguageKeys.discoverySection}</Text>
        <View style={Styles.groupCard}>
          <RenderField
            heading={LanguageKeys.searchVisibility}
            description={LanguageKeys.searchVisibilityDesc}
            switchEnabled={searchVisibility}
            onChangeSwitch={searchVisibilityToggle}
          />
        </View>

        <Text style={[Styles.sectionLabel, Styles.sectionLabelSpaced]}>
          {LanguageKeys.notificationsSection}
        </Text>
        <View style={Styles.groupCard}>
          <RenderField
            heading={LanguageKeys.inAppNotifications}
            description={LanguageKeys.inAppNotificationsDesc}
            switchEnabled={inAppNotification}
            onChangeSwitch={inAppNotificationToggle}
            showDivider
          />
          <RenderField
            heading={LanguageKeys.emailNotifications}
            description={LanguageKeys.emailNotificationsDesc}
            switchEnabled={emailNotification}
            onChangeSwitch={emailNotificationToggle}
            showDivider
          />
          <RenderField
            heading={LanguageKeys.smsNotifications}
            description={LanguageKeys.smsNotificationsDesc}
            switchEnabled={smsNotification}
            onChangeSwitch={smsNotificationToggle}
          />
        </View>
      </ScrollView>
    </Container>
  );
};

export default PrivacySettings;

const Styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.appBg,
  },
  innerCon: {
    paddingTop: hp(2),
    paddingHorizontal: wp(4),
    paddingBottom: hp(3),
  },
  sectionLabel: {
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.tiny1,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: hp(1),
    marginLeft: wp(1),
  },
  sectionLabelSpaced: {
    marginTop: hp(3),
  },
  groupCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.hairline,
    overflow: 'hidden',
  },
  fieldCon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(4),
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  fieldTxtCon: {
    flex: 1,
    paddingRight: wp(3),
  },
  fieldTxt: {
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small2,
    color: Colors.ink,
  },
  fieldDesc: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.tiny2,
    color: Colors.muted,
    marginTop: hp(0.3),
  },
  switchInner: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
});
