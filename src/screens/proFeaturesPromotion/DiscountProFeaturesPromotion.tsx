import { View, StatusBar, FlatList, Image, LogBox, ActivityIndicator, ImageBackground, TouchableOpacity, Linking, Text as RText, StyleSheet } from 'react-native'
import React, { useState, useEffect } from 'react'
import AntDesign from 'react-native-vector-icons/AntDesign'
import Ripple from 'react-native-material-ripple';
import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';

import PaymentMethodList from './PaymentMethodList';
import { ModalLoader, Text, LinearGradient } from '../../components'
import { LanguageKeys, CheckRtl } from '../../languages';
import { Constants, hp, Typography, wp } from "../../global";
import { Colors, Fonts, Images } from "../../res";
import { StorageManager, flashErrorMessage, flashSuccessMessage, useGlobalContext } from '../../services';


const DiscountProFeaturesPromotion = (props: any) => {
    LogBox.ignoreAllLogs(true)
    const Rtl = CheckRtl()
    const { currentUser, updateCurrentUser } = useGlobalContext()
    const { setData, storageKeys } = StorageManager
    const [paymentMethodListVisible, setPaymentMethodListVisible] = useState(false)
    const [loading, setLoading] = useState(true)
    const [loaderModal, setLoaderModal] = useState({
        visible: false,
        message: ''
    })
    const [packagesList, setPackagesList] = useState([])
    const [selectedPackage, setSelectedPackage] = useState<any>('')
    const [seconds, setSeconds] = useState(3600);
    const [timerActive, setTimerActive] = useState(true)
    const [isActive, setIsActive] = useState<any>(true)

    const hideLoading = () => setLoading(false)
    const hideLoaderModal = () => setLoaderModal({
        visible: false,
        message: ''
    })

    const [proFeatures,] = useState([
        {
            title: LanguageKeys.proFeature1,
            id: '1'
        },
        {
            title: LanguageKeys.proFeature2,
            id: '2'
        },
        {
            title: LanguageKeys.proFeature3,
            id: '3'
        },
        {
            title: LanguageKeys.proFeature4,
            id: '4'
        },
    ])

    useEffect(() => {
        const getTime = async () => {
            let membershipTime = await AsyncStorage.getItem("membership_discount");
            if (membershipTime) {
                const storedTime = parseInt(membershipTime, 10);
                const currentTime = Date.now();
                const elapsedTime = Math.floor((currentTime - storedTime) / 1000);

                if (elapsedTime < 3600) {
                    setSeconds(3600 - elapsedTime);
                    setTimerActive(true);
                    setIsActive(true)
                } else {
                    console.log("The hour has finished..");
                    setIsActive(false)
                }
            }
        };

        getTime();
    }, []);

    useEffect(() => {
        let interval: any = null;
        if (timerActive) {
            interval = setInterval(() => {
                setSeconds(prevSeconds => {
                    if (prevSeconds > 0) {
                        return prevSeconds - 1;
                    } else {
                        setTimerActive(false);
                        console.log("The hour has finished.");
                        setIsActive(false)
                        return prevSeconds;
                    }
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerActive, seconds]);


    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return { hours, minutes, secs };
    };

    const { hours, minutes, secs } = formatTime(seconds);

    const renderProFeatures = ({ item }: any) => {
        return (
            <View style={{ ...Styles.listItemCon, flexDirection: Rtl ? 'row-reverse' : 'row' }}>
                <Image
                    source={Images.logoWithoutText}
                    resizeMode='contain'
                    style={Styles.itemIcon}
                />
                <Text style={Styles.itemTitle}>
                    {item.title}
                </Text>
            </View>
        )
    }

    const onPlayOrAppStorePress = async (fromRestore = false) => {
        setPaymentMethodListVisible(false)
        setLoaderModal({
            visible: true,
            message: LanguageKeys.loading
        })
        try {
            // const userID = JSON.stringify(currentUser?.id)
            // await Purchases.logIn(userID)

            let customerInfo: any = null
            if (fromRestore) {
                customerInfo = await Purchases.restorePurchases()
            }
            else {
                customerInfo = await Purchases.purchasePackage(selectedPackage)
            }

            if (customerInfo?.activeSubscriptions?.length !== 0 && (customerInfo?.latestExpirationDate || customerInfo?.customerInfo?.latestExpirationDate)) {
                currentUser.membership_expiry = customerInfo?.latestExpirationDate || customerInfo?.customerInfo?.latestExpirationDate
                currentUser.membership_status = 1
                updateCurrentUser(currentUser)
                await setData(storageKeys.USER, currentUser)
                hideLoaderModal()
                flashSuccessMessage(LanguageKeys.upgradedSuccessfully)
                const navigateTo = props?.route?.params?.navigateTo
                console.log("navigateTo", navigateTo)
                if (navigateTo && navigateTo === 'goBack') {
                    props.navigation.goBack()
                }
                else {
                    props.navigation.reset({
                        index: 0,
                        routes: [{
                            name: "MembershipCongrats", params: {
                                amount: selectedPackage?.product?.price,
                                title: selectedPackage?.product?.title
                            }
                        }],
                    });
                }
            }
            else {
                if (fromRestore) {
                    flashErrorMessage('restoreSubscriptionErrorMessage')
                }
                hideLoaderModal()
            }
        } catch (e: any) {
            hideLoaderModal()
            console.log('error while purchasing package =>', e)
        }
    }

    const onClosePress = () => {
        if (props?.route?.params?.from === 'SignUp') {
            props.navigation.reset({
                index: 0,
                routes: [{ name: 'BottomTab' }],
            });
        }
        else {
            props.navigation.goBack()
        }
    }

    const onBuyNowPress = async () => {
        if (!isActive) return
        if (selectedPackage?.title === 'free') onClosePress()
        else setPaymentMethodListVisible(true)
    }

    const getPackages = async () => {
        Purchases.getOfferings().then((res) => {
            if (res) {
                // const availablePackages: any = res?.current?.availablePackages
                // console.log(availablePackages);

                // setPackagesList(availablePackages)
                // setSelectedPackage(availablePackages[1])
                setLoading(false)
            }
            else {
                setLoading(false)
            }
        })
            .catch((error) => {
                console.log('error while getting packages =>', error)
                hideLoading()
            })
    }

    useEffect(() => {
        getPackages()
    }, [])

    const onPackageSelection = (item: any) => {
        setSelectedPackage(item)
    }

    const hidePaymentMethodList = () => {
        setPaymentMethodListVisible(false)
    }

    return (
        <ImageBackground style={Styles.container}
            source={Images.slide4}
        >
            <StatusBar translucent backgroundColor={'transparent'} barStyle={'light-content'} />
            <ModalLoader
                visible={loaderModal.visible}
                message={loaderModal.message}
            />
            <LinearGradient colors={[Colors.blackRGBA70, Colors.color36]}
                style={Styles.linearContainer}
            >
                <View style={{ ...Styles.headerContainer, alignItems: Rtl ? 'flex-start' : 'flex-end' }}>
                    <Ripple
                        onPress={onClosePress}
                    >
                        <AntDesign name="close" size={wp(10)} color={Colors.color2} />
                    </Ripple>
                </View>
                <View>
                    <Text style={Styles.heading}>{LanguageKeys.goProWithPurehalf}</Text>
                    <FlatList
                        data={proFeatures}
                        renderItem={renderProFeatures}
                        keyExtractor={(item) => item.id}
                        scrollEnabled={false}
                    />
                </View>
                {
                    loading ?
                        <ActivityIndicator
                            color={Colors.color2}
                            size={wp(5)}
                            style={{ marginTop: hp(10) }}
                        />
                        :
                        <View style={Styles.listOuterCon}>
                            {/* <PackagesList
                                data={packagesList}
                                onPackageSelection={onPackageSelection}
                                navigation={props.navigation}
                            /> */}
                            <View style={Styles.circleWrapper}>
                                <View>
                                    <RText style={Styles.circleText1}>20% OFF</RText>
                                    <RText style={Styles.circleText2}>Then <RText style={{ textDecorationLine: 'line-through', fontFamily: Fonts.APPFONT_SB }}>Rs 4500</RText></RText>
                                </View>
                                <View>
                                    <RText style={Styles.circleText1}>Now</RText>
                                    <RText style={Styles.circleText2}>Rs 4000</RText>
                                </View>
                            </View>
                            <View>
                                <RText style={Styles.circleText1}>Limited Time Offer</RText>

                                <View style={Styles.tryAgainCon}>
                                    <Text style={Styles.tryAgainTxt}>
                                        {/* {LanguageKeys.resendOtp} */}
                                        {hours}h {minutes}m {secs}s
                                    </Text>
                                    {/* <AntDesign
                                            name='clockcircleo'
                                            color={Colors.color2}
                                            size={wp(5)}
                                        /> */}
                                </View>
                                {/* } */}
                                <Ripple style={Styles.subscribeNowBtn}
                                    onPress={onBuyNowPress}
                                    disabled={!isActive}
                                >
                                    {
                                        selectedPackage?.title === 'free' ?
                                            <Text style={Styles.subscribeBtnTxt}>
                                                {props?.route?.params?.from === "SignUp" ? "continue" : "goBack"}
                                            </Text>
                                            :
                                            <Text style={Styles.subscribeBtnTxt}>
                                                Avail 20% Off now
                                            </Text>
                                    }
                                </Ripple>
                                <View style={{ ...Styles.termsCon, flexDirection: Rtl ? 'row-reverse' : 'row' }}>
                                    <Text style={Styles.termsDes} >
                                        bySubscribingDes
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => Linking.openURL("https://purehalf.com/terms-conditions/")}
                                        activeOpacity={0.7}>
                                        <Text style={{ ...Styles.termsDes, marginHorizontal: wp(1), textDecorationLine: 'underline' }}>
                                            termsAndConditions
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                {/* <View style={{ ...Styles.termsCon, flexDirection: Rtl ? 'row-reverse' : 'row', marginTop: 0 }}>
                                    <Text style={Styles.termsDes} >
                                        alsoRefund
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => Linking.openURL("https://purehalf.com/refund-policy/")}
                                        activeOpacity={0.7}>
                                        <Text style={{ ...Styles.termsDes, marginHorizontal: wp(1), textDecorationLine: 'underline' }}>
                                            refundPolicyText
                                        </Text>

                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity style={Styles.restoreBtn}
                                    onPress={onPlayOrAppStorePress.bind(null, true)}
                                >
                                    <Text style={Styles.restoreTxt} >
                                        restoreSubscription
                                    </Text>
                                </TouchableOpacity> */}
                            </View>
                        </View>
                }
                <PaymentMethodList
                    visible={paymentMethodListVisible}
                    onClose={hidePaymentMethodList}
                    selectedPackage={selectedPackage}
                    onPlayOrAppStorePress={onPlayOrAppStorePress}
                />
            </LinearGradient>
        </ImageBackground>
    )
}

export default DiscountProFeaturesPromotion

const Styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    linearContainer: {
        flex: 1,
        paddingHorizontal: wp(4),
    },
    headerContainer: {
        paddingTop: hp(5),
        paddingBottom: hp(2),
    },
    heading: {
        fontSize: Typography.large3,
        fontFamily: Fonts.APPFONT_B,
        includeFontPadding: false,
        color: Colors.color2,
        marginBottom: hp(1.5)
    },
    listItemCon: {
        marginTop: hp(1),
        flexDirection: 'row',
        alignItems: 'center',
    },
    listOuterCon: {
        flex: 1,
        justifyContent: 'space-between',
        paddingBottom: hp(2)
    },
    listContainer: {
        marginTop: hp(4)
    },
    circleWrapper: {
        justifyContent: 'space-between',
        alignItems: 'center',
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: Colors.color2,
        borderRadius: 200,
        width: wp(70),
        height: wp(70),
        marginTop: 20,
        paddingVertical: 50
    },
    circleText1: {
        fontFamily: Fonts.APPFONT_B,
        includeFontPadding: false,
        color: Colors.color2,
        fontSize: Typography.large3,
        alignSelf: 'center'
    },
    circleText2: {
        fontFamily: Fonts.APPFONT_R,
        color: Colors.color2,
        fontSize: Typography.medium,
        alignSelf: 'center'
    },
    itemIcon: {
        width: wp(6),
        height: hp(4),
    },
    itemTitle: {
        fontFamily: Fonts.APPFONT_R,
        includeFontPadding: false,
        color: Colors.color2,
        marginHorizontal: wp(3),
        alignSelf: 'center',
        fontSize: Typography.small3
    },
    tryAgainCon: {
        // marginBottom: hp(3),
        // alignItems: 'center',
        alignSelf: 'center',
        flexDirection: 'row',
    },
    tryAgainTxt: {
        fontSize: Typography.medium2,
        marginBottom: Constants.fontFamilyMarginBottom,
        fontFamily: Fonts.APPFONT_R,
        color: Colors.color2
    },
    subscribeNowBtn: {
        width: '100%',
        backgroundColor: Colors.color40,
        borderRadius: 8,
        height: wp(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: hp(1)
    },
    subscribeBtnTxt: {
        color: Colors.color2,
        fontFamily: Fonts.APPFONT_B,
        textAlign: 'center',
        alignSelf: 'center',
        includeFontPadding: false,
        fontSize: Typography.small3
    },
    termsCon: {
        flexDirection: 'row',
        alignItems: "center",
        justifyContent: "center",
        marginTop: hp(1)
    },
    termsDes: {
        fontSize: Typography.tiny1,
        alignSelf: 'center',
        textAlign: 'center',
        fontFamily: Fonts.APPFONT_R,
        includeFontPadding: false,
        color: Colors.color2
    },
    restoreTxt: {
        fontSize: Typography.small,
        alignSelf: 'center',
        textAlign: 'center',
        fontFamily: Fonts.APPFONT_R,
        includeFontPadding: false,
        color: Colors.color2
    },
    restoreBtn: {
        marginVertical: 5,
        paddingVertical: 5,
        alignSelf: 'center'
    }
})