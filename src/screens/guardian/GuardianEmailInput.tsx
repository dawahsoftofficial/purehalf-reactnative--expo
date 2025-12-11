import { View, StyleSheet, KeyboardAvoidingView, TextInput, Image, StatusBar } from 'react-native'
import React, { useState } from 'react'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import LinearGradient from 'react-native-linear-gradient'
import { Button, Header, SlideShowContainer, Text } from '../../components'
import { Colors, Fonts, Images } from '../../res'
import { Typography, hp, wp } from '../../global'
import { Animation } from '../../animations'
import { CheckRtl, LanguageKeys } from '../../languages'
import { checkEmpty, emailValidation, flashErrorMessage } from '../../services'

const GuardianEmailInput = ({ navigation }: any) => {
  const Rtl = CheckRtl()
  const [email, setEmail] = useState('')

  const onChangeEmail = (text: string) => setEmail(text)
  const onContinuePress = () => {
    if (!emailValidation(email)) {
      flashErrorMessage('Invalid email')
    }
    else {
      navigation.navigate('GuardianPasswordInput', { email })
    }
  }

  return (
    <SlideShowContainer disabled>
      <StatusBar
        translucent
        backgroundColor={'transparent'}
        barStyle="light-content"
      />
      <View>
        <Image source={Images.slide1} resizeMode="cover" style={Styles.image} />
        <LinearGradient
          style={Styles.imageOuterView}
          colors={[Colors.blackRGBA25, Colors.blackRGBA38]}
        />
      </View>
      <View style={Styles.container}>
        <Header
          navigation={navigation}
          arrowColor={Colors.color2}
          containerStyle={Styles.header}
        />
        <KeyboardAvoidingView
          behavior={"height"}
          style={{ flex: 1 }}
        >
          <Animation style={Styles.contentContainer}>
            <Text style={Styles.heading}>
              {LanguageKeys.enterYourEmailLabel}
            </Text>
            <Text style={Styles.text}>
              {LanguageKeys.enterYourEmailBelowLabel}
            </Text>
            <TextInput
              style={[Styles.emailInput, { textAlign: Rtl ? 'right' : 'left' }]}
              keyboardType='email-address'
              value={email}
              onChangeText={onChangeEmail}
            />
            <Button
              text={LanguageKeys.continue}
              onPress={onContinuePress}
              disabled={checkEmpty(email)}
              icon={<MaterialCommunityIcons name={'logout-variant'} size={wp(5)} color={Colors.color2} />}
            />
          </Animation>
        </KeyboardAvoidingView>
      </View>
    </SlideShowContainer>
  )
}

export default GuardianEmailInput

const Styles = StyleSheet.create({
  header: {
    paddingTop: hp(6),
    borderBottomWidth: 0
  },
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
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    paddingBottom: hp(4),
    width: wp(100),
    zIndex: 1,
    paddingHorizontal: wp(4)
  },
  heading: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_SB,
    includeFontPadding: false,
    fontSize: Typography.medium2,
  },
  text: {
    color: Colors.color2,
    paddingTop: 5,
    includeFontPadding: false,
    fontSize: Typography.small,
  },
  emailInput: {
    color: Colors.color2,
    height: wp(11),
    paddingVertical: hp(1),
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_R,
    paddingHorizontal: wp(2),
    borderBottomColor: Colors.color2,
    borderBottomWidth: 1,
    marginVertical: hp(3)
  }
})