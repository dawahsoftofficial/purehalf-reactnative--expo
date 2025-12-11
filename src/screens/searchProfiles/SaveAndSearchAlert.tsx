import { View, StyleSheet, TextInput } from 'react-native'
import React, { useState } from 'react'
import { AlertContainer, Button, Text } from '../../components'
import { hp, Typography, wp } from '../../global'
import { Colors, Fonts } from '../../res'
import { LanguageKeys, CheckRtl } from '../../languages'
import Feather from 'react-native-vector-icons/Feather'
import { useTranslation } from 'react-i18next'

const SaveAndSearchAlert = (props: any) => {
  const Rtl = CheckRtl()
  const { t }: any = useTranslation()
  const [input, setInput] = useState('')
  const {
    visible = false,
  } = props

  const onChangeText = (text: any) => {
    setInput(text)
  }

  const onClose = () => {
    setInput('')
    props.onClose()
  }

  const onPress = () => {
    setInput('')
    props?.onPress && props?.onPress(input)
  }

  return (
    <AlertContainer
      visible={visible}
      onClose={onClose}
    >
      <View style={Styles.inputContainer}>
        <Text style={Styles.inputOuterLabel}>
          {LanguageKeys.nameYourSearch}
        </Text>
        <View style={Styles.inputOuterContainer}>
          <TextInput
            style={{ ...Styles.input, textAlign: Rtl ? 'right' : 'left', }}
            placeholder={t(LanguageKeys.nameYourSearch)}
            placeholderTextColor={Colors.color1}
            value={input}
            onChangeText={onChangeText}
          />
        </View>

      </View>
      <Button
        text={LanguageKeys.saveAndSearch}
        icon={<Feather name='search' color={Colors.color2} size={wp(5)} />}
        buttonStyle={Styles.searchBtn}
        onPress={onPress}
      />
    </AlertContainer>
  )
}

export default SaveAndSearchAlert

const Styles = StyleSheet.create({
  inputContainer: {
    paddingHorizontal: wp(4),
    marginBottom: hp(2),
  },
  inputOuterLabel: {
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium,
    color: Colors.color1,
    lineHeight: wp(5),
  },
  searchBtn: {
    marginHorizontal: wp(4),
    marginTop: hp(1),
    marginBottom: hp(2)
  },
  inputOuterContainer: {
    borderBottomWidth: 1,
    marginTop: hp(2),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.color3,
    paddingHorizontal: wp(2)
  },
  input: {
    height: hp(6.3),
    paddingHorizontal: wp(3),
    fontSize: Typography.small3,
    width: wp(80),
    color: Colors.color1
  },
})