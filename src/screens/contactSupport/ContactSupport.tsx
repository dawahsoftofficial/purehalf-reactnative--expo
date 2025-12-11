import { View, StyleSheet, ScrollView, TextInput, Linking } from 'react-native'
import React, { useState } from 'react'
import Ripple from 'react-native-material-ripple'
import Entypo from 'react-native-vector-icons/Entypo'
import { t } from 'i18next'

import { Button, Container, Header, Picker, Text } from '../../components'
import { Typography, hp, wp } from '../../global'
import { Colors, Fonts } from '../../res'
import { Animation } from '../../animations'
import { CheckRtl, LanguageKeys } from '../../languages'
import { ApiServices, flashSuccessMessage } from '../../services'

const ContactSupport = ({ navigation }: any) => {
    const Rtl = CheckRtl()
    const [reasonsList, setReasonsList] = useState([
        { value: 'Membership issue', id: 'membershipIssue' },
        { value: 'Issue in chatting with others', id: 'issueInChatting' },
        { value: 'Found a bug', id: 'foundBug' },
        { value: 'Cant make payment', id: 'cantMakePayment' },
        { value: 'Others', id: 'others' },
    ])
    const [selectedReason, setSelectedReason] = useState({ id: '', value: '' })
    const [comment, setComment] = useState('')
    const [pickerVisible, setPickerVisible] = useState(false)
    const [loading, setLoading] = useState(false)

    const onClosePicker = () => setPickerVisible(false)
    const showPicker = () => setPickerVisible(true)

    const onPickerItemPress = (item: any) => {
        setPickerVisible(false)
        setSelectedReason(item)
    }

    const onSubmit = () => {
        setLoading(true)
        ApiServices.storeQuery({
            type: 1,
            description: comment,
            source: selectedReason?.id
        }).then(async res => {
            setComment('')
            setSelectedReason({ id: '', value: '' })
            flashSuccessMessage("Submitted successfully");
            setLoading(false)
        }).catch((error) => {
            setLoading(false)
        })
    }

    return (
        <Container>
            <Header
                title={LanguageKeys.contactSupport}
                navigation={navigation}
            />

            <ScrollView
                contentContainerStyle={Styles.container}
                showsVerticalScrollIndicator={false}
            >
                <Animation style={Styles.animationContainer}
                    animation={'zoomInUp'}
                    duration={500}
                >
                    <Text style={Styles.heading}>
                        {LanguageKeys.helpandsupport}
                    </Text>
                    <Text style={Styles.description}>
                        {LanguageKeys.contactSupportDescription}
                    </Text>
                    <Ripple style={Styles.reasonBtn}
                        onPress={showPicker}
                    >
                        <Text style={[Styles.reasonBtnTxt,
                        { color: selectedReason?.value?.length === 0 ? Colors.color28 : Colors.color32 }
                        ]}>
                            {selectedReason?.value?.length === 0 ? LanguageKeys.selectAReason :
                                selectedReason?.value
                            }
                        </Text>
                        <View style={Styles.arrowCon}>
                            <Entypo name='chevron-down' color={Colors.color1} size={25} />
                        </View>
                    </Ripple>
                </Animation>
                <Animation style={Styles.animationContainer}
                    animation={'fadeInDown'}
                    duration={700}
                >
                    <TextInput
                        style={[Styles.input, { textAlign: Rtl ? 'right' : 'left' }]}
                        multiline
                        placeholder={`${t(LanguageKeys.addYourComment)}`}
                        placeholderTextColor={Colors.color28}
                        value={comment}
                        onChangeText={(text) => setComment(text)}
                    />
                </Animation>
            </ScrollView>

            <Ripple
                onPress={() => Linking.openURL("https://purehalf.com/terms-conditions/")}
            >
                <Text style={Styles.underline}>{t('termsAndConditions')}</Text>
            </Ripple>

            <Ripple
                onPress={() => Linking.openURL("https://purehalf.com/privacy-policy/")}
            >
                <Text style={[Styles.underline, { marginTop: 10 }]}>
                    {t('privacyPolicy')}</Text>
            </Ripple>

            <Animation
                duration={500}
            >
                <Button
                    text={LanguageKeys.submit}
                    buttonStyle={Styles.button}
                    loading={loading}
                    disabled={!selectedReason?.value || !comment}
                    onPress={onSubmit}
                />
            </Animation>

            <Picker
                visible={pickerVisible}
                onClose={onClosePicker}
                onPress={onPickerItemPress}
                data={reasonsList}
                headerTitle={LanguageKeys.selectAReason}
            />
        </Container>
    )
}

export default ContactSupport

const Styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        paddingTop: hp(8),
        alignItems: 'center',
        paddingHorizontal: wp(4)
    },
    animationContainer: {
        alignItems: 'center'
    },
    heading: {
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_SB,
        fontSize: Typography.large,
        includeFontPadding: false,
        alignSelf: 'center'
    },
    description: {
        textAlign: 'center',
        marginHorizontal: wp(8),
        marginTop: hp(2),
        fontFamily: Fonts.APPFONT_R,
        includeFontPadding: false,
        fontSize: Typography.small2
    },
    reasonBtn: {
        borderWidth: 1,
        borderColor: Colors.color18,
        marginTop: hp(7),
        width: wp(85),
        borderRadius: 8,
        height: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: wp(4)
    },
    arrowCon: {
        backgroundColor: Colors.color51,
        width: 30,
        height: 30,
        borderRadius: 30 / 2,
        justifyContent: 'center',
        alignItems: 'center'
    },
    reasonBtnTxt: {
        color: Colors.color28,
        fontFamily: Fonts.APPFONT_M,
        fontSize: Typography.small2,
        includeFontPadding: false,
        alignSelf: 'center'
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.color18,
        color: Colors.color32,
        fontFamily: Fonts.APPFONT_M,
        fontSize: Typography.small2,
        marginTop: 15,
        width: wp(85),
        height: hp(25),
        borderRadius: 8,
        paddingHorizontal: wp(3),
        paddingTop: hp(1.8),
        textAlignVertical: 'top'
    },
    button: {
        marginHorizontal: wp(6),
        marginVertical: hp(4)
    },
    underline: {
        color: Colors.color32,
        fontFamily: Fonts.APPFONT_R,
        includeFontPadding: false,
        fontSize: Typography.small1,
        alignSelf: 'center',
        marginLeft: wp(1),
        textDecorationLine: 'underline',
    }
})