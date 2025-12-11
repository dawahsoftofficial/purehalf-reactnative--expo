import { View, StyleSheet } from 'react-native'
import React, { useState } from 'react'
import { Container, Header, ModalLoader, Text } from '../../components'
import { hp, Typography, wp } from '../../global'
import { Colors, Fonts } from '../../res'
import { ApiServices, flashSuccessMessage, useGlobalContext } from '../../services'
import { LanguageKeys, CheckRtl } from '../../languages'
import moment from 'moment'
import { StorageManager } from '../../services'
import { Switch } from 'react-native-switch'

const PrivacySettings = (props: any) => {
    const { setData, storageKeys } = StorageManager
    const [loader, setLoader] = useState({
        visible: false,
        message: 'Loading...'
    })
    const { currentUser, updateCurrentUser } = useGlobalContext()

    const Rtl = CheckRtl()
    const [searchVisibility, setSearchVisibility] = useState(currentUser?.search_visibility === 1 ? true : false);
    const [inAppNotification, setInAppNotification] = useState(currentUser?.in_app_notifications === 1 ? true : false)
    const [emailNotification, setEmailNotification] = useState(currentUser?.email_notification === 1 ? true : false)
    const [smsNotification, setSMSNotification] = useState(currentUser?.sms_notification === 1 ? true : false)

    const searchVisibilityToggle = () => {
        setSearchVisibility(!searchVisibility)
        const params = {
            search_visibility: !searchVisibility ? 1 : 0,
            in_app_notifications: inAppNotification ? 1 : 0
        }
        updateToggle(params)
    }

    const inAppNotificationToggle = () => {
        setInAppNotification(!inAppNotification)
        const params = {
            in_app_notifications: !inAppNotification ? 1 : 0,
            search_visibility: searchVisibility ? 1 : 0
        }
        updateToggle(params)
    }

    const emailNotificationToggle = () => {
        setEmailNotification(!emailNotification)
        const params = {
            in_app_notifications: inAppNotification ? 1 : 0,
            search_visibility: searchVisibility ? 1 : 0,
            email_notification: !emailNotification ? 1 : 0,
            sms_notification: smsNotification ? 1 : 0
        }
        updateToggle(params)
    }

    const smsNotificationToggle = () => {
        setSMSNotification(!smsNotification)
        const params = {
            in_app_notifications: inAppNotification ? 1 : 0,
            search_visibility: searchVisibility ? 1 : 0,
            email_notification: emailNotification ? 1 : 0,
            sms_notification: !smsNotification ? 1 : 0
        }
        updateToggle(params)
    }

    const hideLoader = () => setLoader({
        visible: false,
        message: ''
    })

    const updateToggle = (params: any) => {
        const { first_name, last_name, gender, date_of_birth, interface_language_id,
            country, city, latitude, longitude
        } = currentUser

        setLoader({
            visible: true,
            message: 'Updating...'
        })
        const dob = moment(date_of_birth, "DD MMM,YYYY").toDate()
        let newParams = {
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
        }
        ApiServices.updateUserInfo(newParams).then(async () => {
            currentUser.search_visibility = newParams.search_visibility
            currentUser.in_app_notifications = newParams.in_app_notifications
            currentUser.email_notification = newParams.email_notification
            currentUser.sms_notification = newParams.sms_notification
            updateCurrentUser(currentUser)
            await setData(storageKeys.USER, currentUser)
            flashSuccessMessage(LanguageKeys.updated)
            hideLoader()
        })
            .catch(hideLoader)
    }

    const RenderField = ({ heading, description, switchEnabled, onChangeSwitch }: any) => (
        <View style={{ ...Styles.fieldCon, flexDirection: Rtl ? 'row-reverse' : 'row' }}>
            <View style={Styles.fieldTxtCon}>
                <Text style={Styles.fieldTxt}>
                    {heading}
                </Text>
                {/* <Text style={{ ...Styles.fieldTxt, fontFamily: Fonts.APPFONT_R }}>
                    {description}
                </Text> */}
            </View>
            <Switch
                value={switchEnabled}
                onValueChange={onChangeSwitch}
                renderActiveText={false}
                renderInActiveText={false}
                circleSize={25}
                backgroundActive={Colors.color1}
                backgroundInactive={Colors.color18}
                innerCircleStyle={Styles.switchInner}
            />
        </View>
    )
    return (
        <Container>
            <Header
                title={LanguageKeys.privacySettings}
                navigation={props.navigation}
            />
            <ModalLoader
                visible={loader.visible}
                message={loader.message}
            />

            <View style={Styles.innerCon}>
                <RenderField
                    heading={LanguageKeys.searchVisibility}
                    // description={LanguageKeys.searchVisibilityDesc}
                    switchEnabled={searchVisibility}
                    onChangeSwitch={searchVisibilityToggle}
                />
                <RenderField
                    heading={LanguageKeys.inAppNotifications}
                    // description={LanguageKeys.inAppNotificationsDesc}
                    switchEnabled={inAppNotification}
                    onChangeSwitch={inAppNotificationToggle}
                />
                <RenderField
                    heading={"Email Notifications"}
                    // description={LanguageKeys.inAppNotificationsDesc}
                    switchEnabled={emailNotification}
                    onChangeSwitch={emailNotificationToggle}
                />
                <RenderField
                    heading={"SMS Notifications"}
                    // description={LanguageKeys.inAppNotificationsDesc}
                    switchEnabled={smsNotification}
                    onChangeSwitch={smsNotificationToggle}
                />
            </View>
        </Container>
    )
}

export default PrivacySettings

const Styles = StyleSheet.create({
    innerCon: {
        paddingTop: hp(8),
        paddingHorizontal: wp(4)
    },
    fieldCon: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: hp(3)
    },
    fieldTxtCon: {
        width: wp(70)
    },
    fieldTxt: {
        fontFamily: Fonts.APPFONT_B,
        fontSize: Typography.small2,
        // lineHeight: wp(4.8),
        color: Colors.color1,
    },
    switchInner: {
        borderWidth: 1.5,
        borderColor: Colors.color1,
    }
})