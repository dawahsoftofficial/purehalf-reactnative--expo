import React from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';

import { Container, Header, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
import { useGlobalContext } from '../../services';
import Email from './Email';
import PhoneNumber from './PhoneNumber';

const AccountDeletion = (props: any) => {
  const { currentUser } = useGlobalContext();
  const Rtl = CheckRtl();
  const RenderField = ({ heading, description }: any) => (
    <View style={Styles.fieldCon}>
      <Text style={Styles.heading}>{heading}</Text>
      <Text style={Styles.description}>{description}</Text>
    </View>
  );

  const RenderBullet = ({ description }: any) => (
    <View
      style={{
        ...Styles.bulletsCon,
        flexDirection: Rtl ? 'row-reverse' : 'row',
        justifyContent: Rtl ? 'flex-end' : 'flex-start',
      }}
    >
      <View style={Styles.dot} />
      <Text style={Styles.bulletTxt}>{description}</Text>
    </View>
  );

  return (
    <Container>
      <Header
        title={LanguageKeys.accountDeletion}
        navigation={props.navigation}
      />
      <ScrollView
        contentContainerStyle={Styles.innerContainer}
        automaticallyAdjustKeyboardInsets
      >
        <View style={Styles.firstInnerCon}>
          <RenderField
            heading={LanguageKeys.accountDeletionHeading1}
            description={LanguageKeys.accountDeletionDes1}
          />
          <View style={Styles.fieldCon}>
            <Text style={Styles.heading}>
              {LanguageKeys.accountDeletionHeading2}
            </Text>
            <RenderBullet description={LanguageKeys.accountDeletionDes2} />
            <RenderBullet description={LanguageKeys.accountDeletionDes3} />
            <RenderBullet description={LanguageKeys.accountDeletionDes4} />
          </View>
          <RenderField
            heading={LanguageKeys.accountDeletionHeading3}
            description={LanguageKeys.accountDeletionDes5}
          />
        </View>
        <View style={Styles.secondInnerCon}>
          {currentUser?.phone_number ? <PhoneNumber /> : <Email />}
        </View>
      </ScrollView>
    </Container>
  );
};

export default AccountDeletion;

const { width } = Dimensions.get('window');
const Styles = StyleSheet.create({
  innerContainer: {
    paddingHorizontal: wp(4),
    justifyContent: 'space-between',
  },
  firstInnerCon: {
    paddingTop: hp(7),
    height: hp(56),
  },
  secondInnerCon: {
    height: hp(32),
    justifyContent: 'flex-end',
  },
  heading: {
    color: Colors.color1,
    fontSize: Typography.medium1,
    fontFamily: Fonts.APPFONT_B,
    lineHeight: wp(5),
  },
  description: {
    color: Colors.color22,
    fontSize: Typography.small2,
    fontFamily: Fonts.APPFONT_R,
    lineHeight: wp(5),
    marginTop: hp(0.5),
  },
  fieldCon: {
    marginBottom: hp(4),
  },
  bulletsCon: {
    marginTop: hp(0.5),
    paddingHorizontal: wp(2),
  },
  dot: {
    width: width * 0.025,
    height: width * 1 * 0.025,
    borderRadius: (width * 1 * 0.025) / 2,
    backgroundColor: Colors.color1,
    marginTop: hp(1.1),
  },
  bulletTxt: {
    color: Colors.color22,
    fontSize: Typography.small2,
    fontFamily: Fonts.APPFONT_R,
    lineHeight: wp(5),
    marginTop: hp(0.5),
    alignSelf: 'center',
    marginHorizontal: wp(1.5),
  },
});
