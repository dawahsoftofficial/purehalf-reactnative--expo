import { View, StyleSheet, ScrollView } from 'react-native'
import React, { useState, useEffect } from 'react'
import { AnimatedLoader, Container, Header, LinearGradient, Text } from '../../components'
import { hp, Typography, wp } from '../../global'
import { Fonts, Colors } from '../../res'
import Ripple from 'react-native-material-ripple'
import { LanguageKeys } from '../../languages'
import Purchases from 'react-native-purchases'
import { ApiServices, StorageManager, useGlobalContext } from '../../services'
import moment from 'moment'
import { useIsFocused } from '@react-navigation/native'

const MembershipInfo = (props: any) => {
    const { setData, storageKeys } = StorageManager
    const { currentUser, updateCurrentUser } = useGlobalContext()
    const [user, setUser] = useState<any>(null)
    const [loader, setLoader] = useState(true)
    const [membershipInfo, setMembershipInfo] = useState<any>(null)
    const isFocused = useIsFocused()


    const RenderField = ({ heading, description }: any) => (
        <View style={Styles.fieldCon}>
            <Text style={Styles.heading}>
                {heading}
            </Text>
            <Text style={Styles.description}>
                {description}
            </Text>
        </View>
    )

    const onUpdateToProPress = () => {
        props.navigation.navigate('ProFeaturesPromotion', { from: 'Settings', navigateTo: 'MembershipCongrats' })
    }

    const getMembershipInfo = async () => {
        try {
            const user = await ApiServices.getCurrentUserDetail()
            if (user) {
                setUser(user)
                updateCurrentUser(user)
                await setData(storageKeys.USER, user)
            }
            const customerInfo: any = await Purchases.getCustomerInfo()
            if (customerInfo?.activeSubscriptions?.length !== 0) {
                setMembershipInfo(customerInfo)
            }
            setLoader(false)
        } catch (error) {
            setLoader(false)
        }
    }

    useEffect(() => {
        if (isFocused) {
            getMembershipInfo()
        }
    }, [isFocused])

    return (
        <Container>
            <Header
                title={LanguageKeys.membershipInformation}
                navigation={props.navigation}
            />
            {
                loader ?
                    <AnimatedLoader
                        visible={loader}
                        text={'Loading...'}
                        style={Styles.loader}
                    />
                    :
                    <View style={Styles.innerCon}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            style={Styles.fieldsOuterCon}
                        >
                            {
                                user?.membership_status === 0 || !user?.membership_status ?
                                    <Text style={Styles.noActiveMembership}>
                                        {LanguageKeys.noActiveMembership}
                                    </Text>
                                    :
                                    <View>
                                        <RenderField
                                            heading={LanguageKeys.premiumMembershipStatus}
                                            description={LanguageKeys.active}
                                        />
                                        <RenderField
                                            heading={LanguageKeys.proPackagePurchasedOn}
                                            description={moment(membershipInfo?.entitlements?.active['Premium bundles']?.latestPurchaseDate)?.format('DD MMM, YYYY hh:mm A')}
                                        />
                                        {currentUser.membership_status ? <RenderField
                                            heading={LanguageKeys.renewalDate}
                                            description={moment(currentUser?.membership_expiry)?.format('DD MMM, YYYY hh:mm A')}
                                        /> : <RenderField
                                            heading={LanguageKeys.renewalDate}
                                            description={moment(membershipInfo?.entitlements?.active['Premium bundles']?.expirationDate)?.format('DD MMM, YYYY hh:mm A')}
                                        />}
                                    </View>
                            }
                        </ScrollView>
                        {
                            user?.membership_status === 0 || !user?.membership_status ?
                                <LinearGradient
                                    colors={[Colors.color19, Colors.color20]}
                                    style={Styles.button}
                                >
                                    <Ripple
                                        onPress={onUpdateToProPress}
                                        style={Styles.buttonInner}
                                    >
                                        <Text style={Styles.btnTxt}>
                                            {LanguageKeys.upgradeToPro}
                                        </Text>
                                    </Ripple>
                                </LinearGradient>
                                : null
                        }
                    </View>
            }
        </Container>
    )
}

export default MembershipInfo

const Styles = StyleSheet.create({
    container: {

    },
    loader: {
        flex: 1
    },
    innerCon: {
        paddingHorizontal: wp(4),
        flex: 1,
        justifyContent: 'space-between',
    },
    fieldsOuterCon: {
        paddingTop: hp(8),
        paddingBottom: hp(3),
    },
    fieldCon: {
        marginBottom: hp(4),
    },
    heading: {
        fontFamily: Fonts.APPFONT_B,
        fontSize: Typography.medium,
        color: Colors.color1,
        lineHeight: wp(5),
    },
    description: {
        fontFamily: Fonts.APPFONT_R,
        fontSize: Typography.small3,
        color: Colors.color1,
        lineHeight: wp(5),
        marginTop: hp(0.4)
    },
    button: {
        marginVertical: hp(2),
        justifyContent: 'center',
        paddingHorizontal: wp(1),
        borderRadius: 30,
    },
    buttonInner: {
        paddingVertical: hp(1.5),
        borderRadius: 30
    },
    btnTxt: {
        fontFamily: Fonts.APPFONT_B,
        fontSize: Typography.medium,
        color: Colors.color1,
        alignSelf: 'center'
    },
    noActiveMembership: {
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_R,
        alignSelf: 'center',
        fontSize: Typography.medium,
        marginTop: hp(30)
    }
})