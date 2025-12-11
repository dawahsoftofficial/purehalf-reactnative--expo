import { View, StyleSheet, Dimensions, Image, Text as ReactText, ActivityIndicator, TouchableOpacity, StatusBar, Modal } from 'react-native'
import React, { useState, useReducer } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import moment from 'moment'
import Ripple from 'react-native-material-ripple'
import AntDesign from 'react-native-vector-icons/AntDesign'
import Entypo from 'react-native-vector-icons/Entypo'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'
import DeviceInfo from 'react-native-device-info'
import _ from 'lodash'

import { hp, Typography, wp } from '../../global'
import { Colors, Fonts, Images } from '../../res'
import Constants from '../../global/Constants'
import { Button, CheckMembershipStatus, LinearGradient, ModalLoader, Text } from '../../components'
import { LanguageKeys, CheckRtl } from '../../languages'
import { ApiServices, capitalize, Firebase, flashErrorMessage, isIOS, StorageManager, useGlobalContext } from '../../services'
import BlurView from '../../components/BlurView'


const Header = (props: any) => {
    const { setData, storageKeys } = StorageManager
    const { currentUser, conversations, updateCurrentUser } = useGlobalContext()
    const [userConversation, setUserConversation] = useState({ convDetails: {}, messages: [] })
    const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
    const [liked, setLiked] = useState(false)
    const [imageLoader, setImageLoader] = useState(false)
    const [profileImageLoader, setProfileImageLoader] = useState(false)
    const [profileImageError, setProfileImageError] = useState(false)
    const [coverImageError, setCoverImageError] = useState(false)
    const [userData, setUserData] = useState(props.userData)
    const [isPremiumMember, setIsPremiumMember] = useState<boolean>(false)
    const [modalLoader, setModalLoader] = useState(false)
    const [messageButtonLoader, setMessageButtonLoader] = useState(true)
    const [toolTipVisible, setToolTipVisible] = useState<boolean>(false);

    const chatUserData = {
        id: userData?.id,
        name: userData?.full_name,
        image: userData?.media?.primary_image,
        token: userData?.fcm_token?.map((item: any) => item?.fcm_token)
            .filter((token: any) => token !== undefined && token !== null)
    }

    const {
        navigation = {},
        fromUserProfile = false,
        onBlockPress = () => null,
        isBlockedYou = false,
    } = props


    useFocusEffect(
        React.useCallback(() => {
            setIsPremiumMember((currentUser?.membership_status === 0 || currentUser?.membership_status === null) ? false : true)
            setUserData(props?.userData)
            setLiked(props?.userData?.liked)
            forceUpdate()
        }, [props?.userData, currentUser])
    );


    const getUserConversation = () => {
        const conversationData = conversations.filter((element: any) => {
            const deleteFlag = element.convDetails.participantsDeleteFlag;
            return deleteFlag.hasOwnProperty(JSON.stringify(userData?.id))
        })
        if (conversationData && conversationData.length !== 0) {
            setUserConversation(conversationData[0])
            setMessageButtonLoader(false)
        }
        else {
            Firebase.getSingleConversation(currentUser?.id, userData?.id).then((data: any) => {
                if (data && data?.length !== 0) {
                    setUserConversation(data[0])
                    setMessageButtonLoader(false)
                }
                else {
                    setMessageButtonLoader(false)
                }
            })
                .catch(() => setMessageButtonLoader(false))
        }
    }

    useFocusEffect(
        React.useCallback(() => {
            if (fromUserProfile) {
                getUserConversation()
            }
        }, [conversations])
    );


    const navigateToChat = () => {
        props.navigation.navigate('SingleChat',
            {
                otherUserData: chatUserData,
                conversationData: userConversation,
                fromProfile: true
            })
    }

    const isPremiumUser = () => {
        return new Promise((resolve, reject) => {
            const now = moment();
            const membershipExpiry = currentUser?.membership_expiry
            if (membershipExpiry !== null && moment(membershipExpiry).isAfter(now)) {
                resolve('premiumUser')
            }
            else if (membershipExpiry === null || moment(membershipExpiry).isBefore(now)) {
                setModalLoader(true)
                ApiServices.getCurrentUserDetail().then((res: any) => {
                    const membershipExpiry = res?.membership_expiry
                    updateCurrentUser(res)
                    setModalLoader(false)
                    if (membershipExpiry === null || moment(membershipExpiry).isBefore(now)) {
                        props.navigation.navigate('ProFeaturesPromotion', { navigateTo: 'goBack' })
                    }
                    else {
                        resolve('premiumUser')
                    }
                })
                    .catch(() => {
                        setModalLoader(false)
                    })
            }
        })
    }

    const onMessagePress = () => {
        let userConversationDetail: any = userConversation
        if (
            // userConversation?.messages?.length === 0 && 
            currentUser?.gender === 'male'
            // && conversations?.length >= 3
        ) {
            isPremiumUser().then(() => {
                Firebase.getNoOfChats(currentUser?.id, userConversationDetail?.convDetails?.id).then((numberOfChats: any) => {
                    if (numberOfChats < 5) {
                        navigateToChat()
                    } else {
                        flashErrorMessage(LanguageKeys.conversationLimit)
                    }
                })
            })
        }
        else {
            Firebase.getNoOfChats(currentUser?.id, userConversationDetail?.convDetails?.id).then((numberOfChats: any) => {
                if (numberOfChats < 5) {
                    navigateToChat()
                } else {
                    flashErrorMessage(LanguageKeys.conversationLimit)
                }
            })
        }
    }

    const Rtl = CheckRtl()

    const RenderName = () => (
        <View style={{ ...Styles.nameCon, flexDirection: Rtl ? 'row-reverse' : 'row' }}>
            <ReactText style={{ ...Styles.name, }} >
                {capitalize(userData?.first_name) + " " + capitalize(userData?.last_name)}
            </ReactText>
            {
                fromUserProfile &&
                <View style={{
                    ...Styles.onlineStatus,
                    backgroundColor: lastOnlineFromCurrentTime === 1 ?
                        Colors.color10 : lastOnlineFromCurrentTime > 1 && lastOnlineFromCurrentTime <= 12 ?
                            Colors.color19 : Colors.color15

                }} />
            }
        </View>
    )

    const onEditPress = () => {
        navigation.navigate('PhotosAndVideos')
    }


    const onLikeUnlikePress = () => {
        setLiked(!liked)
        props.onLikeUnlikePress && props.onLikeUnlikePress(!liked)
    }

    const onChangeBlur = () => {
        // setModalLoader(true)
        // let newParams = {
        //     type: 9,
        //     action_user_id: currentUser?.id,
        // }

        // ApiServices.interactionAction(newParams).then(async (res) => {
        //     setIsBlurred(!isBlurred)

        //     // currentUser.isBlurred = newParams.isBlurred
        //     // updateCurrentUser(currentUser)
        //     // await setData(storageKeys.USER, currentUser)
        //     flashSuccessMessage(LanguageKeys.updated)
        //     setModalLoader(false)
        // })
        //     .catch(() => setModalLoader(false))
    }

    const RenderActionBtn = () => (
        <View style={{ ...Styles.actionBtnCon, flexDirection: Rtl ? 'row-reverse' : 'row' }}>
            <Ripple style={Styles.actionIcon}
                onPress={onBlockPress}
            >
                {
                    userData?.blocked === 1 || userData?.block_by_you === 1 ?
                        <Entypo
                            name='block'
                            color={Colors.theme}
                            size={wp(4.5)}
                        />
                        :
                        <Entypo
                            name='block'
                            color={Colors.color1}
                            size={wp(4.5)}
                        />
                }
            </Ripple>
            <Ripple style={[Styles.actionIcon, { backgroundColor: Colors.color47 }]}
                onPress={onMessagePress}
                disabled={messageButtonLoader}
            >
                {
                    messageButtonLoader ?
                        <ActivityIndicator color={Colors.theme} size={'small'} />
                        :
                        <AntDesign
                            name='mail'
                            color={Colors.color2}
                            size={wp(4.5)}
                        />
                }
            </Ripple>

            <Ripple style={Styles.actionIcon}
                onPress={onLikeUnlikePress}
            >
                {
                    liked ?
                        <AntDesign
                            name='heart'
                            color={Colors.theme}
                            size={wp(4.5)}
                        />
                        :
                        <AntDesign
                            name='hearto'
                            color={Colors.color1}
                            size={wp(4.5)}
                        />
                }
            </Ripple>
        </View>
    )

    const RenderLocation = () => (
        <ReactText style={Styles.location} numberOfLines={2}>
            {userData?.city}
            {userData?.city && ', '}
            {userData?.country}
        </ReactText>
    )

    const RenderAge = () => (
        <ReactText style={Styles.location} numberOfLines={2}>
            {`Age: ${userData?.age}`}
        </ReactText>
    )

    const RenderLastOnline = () => (
        <View style={{ alignItems: Rtl ? 'flex-end' : 'flex-start' }}>
            <Text style={Styles.lastOnlineAt}>
                {LanguageKeys.lastOnlineAt}
            </Text>
            <View style={Styles.lastOnlineAtInner}>
                {
                    !moment(userData?.last_online_at).isSame(new Date(), "day") &&
                    <ReactText style={{ ...Styles.lastOnlineAt, marginRight: wp(1) }}>
                        {moment(userData?.last_online_at).format('Do MMM, YYYY')}
                    </ReactText>
                }
                <ReactText style={{ ...Styles.lastOnlineAt }}>
                    {moment(userData?.last_online_at).format('(hh:mm a)')}
                </ReactText>
            </View>

        </View>
    )

    const onSeeAllPicPress = () => {
        if (!fromUserProfile) {
            navigation.navigate('PhotosAndVideos')
        }
        else {
            isPremiumUser().then(() => {
                navigation.navigate('ImageViewer', { userData: userData })
            })
        }
    }

    const RenderAllPicturesBtn = () => (
        fromUserProfile ?
            <>
                {(userData?.media?.public_gallery?.length || userData?.media?.private_photo_count) ? <Ripple style={{ ...Styles.allPhotosBtn, flexDirection: Rtl ? 'row-reverse' : 'row' }}
                    onPress={onSeeAllPicPress}
                >
                    <Image
                        source={Images.gallery}
                        resizeMode='contain'
                        style={[Styles.galleryIcon, { marginRight: Rtl ? 0 : wp(1.6), marginLeft: Rtl ? wp(1.6) : 0 }]}
                    />
                    <View style={{ ...Styles.allPhotosBtnInner, flexDirection: Rtl ? 'row-reverse' : 'row' }}>
                        <Text style={Styles.allPhotosTxt}>
                            {LanguageKeys.seeAllPictures}
                        </Text>
                    </View>
                </Ripple> : null}
            </>
            :
            <Ripple style={{ ...Styles.myPhotosBtn, flexDirection: Rtl ? 'row-reverse' : 'row' }}
                onPress={onEditPress}
            >
                <Entypo
                    style={{ marginRight: Rtl ? 0 : wp(1.6), marginLeft: Rtl ? wp(1.6) : 0 }}
                    name={'camera'} size={wp(5.5)} color={Colors.color2} />
                <View style={{ ...Styles.allPhotosBtnInner, flexDirection: Rtl ? 'row-reverse' : 'row' }}>
                    <Text style={Styles.allPhotosTxt}>
                        {LanguageKeys.myPhotos}
                    </Text>
                </View>
            </Ripple>
    )

    const onBackPress = () => navigation.goBack()

    const onImageLoadStart = () => setImageLoader(true)
    const onImageLoadEnd = () => setImageLoader(false)

    const onProfileImageLoadStart = () => setProfileImageLoader(true)
    const onProfileImageLoadEnd = () => setProfileImageLoader(false)

    const lastOnlineFromCurrentTime = parseInt(moment.duration(moment(new Date()).diff(moment(userData?.last_online_at))).asHours().toFixed())

    return (
        <View style={Styles.container}>
            {isPremiumMember &&
                <StatusBar backgroundColor={Colors.color47} />}
            {
                fromUserProfile &&
                <CheckMembershipStatus />
            }
            <ModalLoader
                visible={modalLoader}
                useModalLayout={true}
            />
            <TouchableOpacity style={Styles.imageCon}
                onPress={onEditPress}
                activeOpacity={0.8}
                disabled={fromUserProfile}
            >
                <TouchableOpacity
                    onPress={onEditPress}
                    activeOpacity={0.8}
                    disabled={fromUserProfile}
                >
                    {/* <BlurView /> */}
                    {
                        userData?.media?.cover_image && userData?.media?.cover_image?.length !== 0 && !coverImageError ?
                            <Image
                                source={{ uri: userData.media.cover_image }}
                                resizeMode='cover'
                                // onLoadStart={onImageLoadStart}
                                // onLoadEnd={onImageLoadEnd}
                                onError={() => setCoverImageError(true)}
                                style={Styles.image}
                            />
                            :
                            <Image
                                source={Images.coverImagePlaceholder}
                                resizeMode='cover'
                                // onLoadStart={onImageLoadStart}
                                // onLoadEnd={onImageLoadEnd}
                                style={Styles.image}
                            />
                    }
                </TouchableOpacity>
                {/* {
                    imageLoader &&
                    <ActivityIndicator
                        style={{ position: 'absolute' }}
                        color={Colors.theme}
                        size={wp(8)}
                    />
                } */}
            </TouchableOpacity>
            {
                fromUserProfile &&
                <Ripple
                    style={[Styles.header, {
                        right: Rtl ? wp(1) : 'auto',
                        top: hasNotch && !isPremiumMember ? 20 :
                            !hasNotch && !isPremiumMember ? 17 :
                                hasNotch && isPremiumMember ? 45 :
                                    35,
                    }]}
                    onPress={onBackPress}
                >
                    <AntDesign
                        name={Rtl ? 'arrowright' : 'arrowleft'}
                        color={Colors.color1}
                        size={wp(8)}
                    />
                </Ripple>
            }
            <TouchableOpacity
                style={Styles.gradientView}
                activeOpacity={0.8}
                onPress={onEditPress}
                disabled={fromUserProfile}
            >
                <LinearGradient
                    style={Styles.gradientView}
                    colors={[Colors.blackRGBA0, Colors.blackRGBA70]}
                />
            </TouchableOpacity>

            <View>
                <View style={{ position: 'relative' }}>
                    {currentUser?.id === userData?.id ?
                        <Ripple
                            style={Styles.tooltipWrapper}
                            onPress={() => setToolTipVisible(true)}
                        >
                            <Image source={Images.infoIcon} style={Styles.infoIcon} />
                        </Ripple> : null}

                    <TouchableOpacity style={{ ...Styles.rowCon, flexDirection: Rtl ? 'row-reverse' : 'row', }}
                        activeOpacity={1}
                        disabled={fromUserProfile}
                        onPress={onEditPress}
                    >
                        <View style={{ ...Styles.profileImageCon, ...Styles.shadow }}>
                            {!userData?.blur_allowed_you && userData?.is_blur ? <BlurView /> : null}
                            {
                                userData?.media?.primary_image && userData?.media?.primary_image?.length !== 0 && !profileImageError ?
                                    <Image
                                        source={{ uri: userData.media.primary_image }}
                                        resizeMode='cover'
                                        onLoadStart={onProfileImageLoadStart}
                                        onLoadEnd={onProfileImageLoadEnd}
                                        onError={() => setProfileImageError(true)}
                                        style={Styles.profileImage}
                                    />
                                    :
                                    <View style={Styles.profileImage} >
                                        <FontAwesome5
                                            name='user-alt'
                                            color={Colors.color8}
                                            size={wp(24)}
                                            style={Styles.userIcon}
                                        />
                                    </View>
                            }
                            {
                                profileImageLoader && !profileImageError &&
                                <ActivityIndicator
                                    style={{ position: 'absolute' }}
                                    color={Colors.theme}
                                    size={wp(8)}
                                />
                            }
                            {
                                (!userData?.media?.primary_image || userData?.media?.primary_image?.length === 0 || profileImageError) &&
                                !fromUserProfile &&
                                <Ripple style={Styles.profileCameraIcon}
                                    onPress={onEditPress}
                                >
                                    <Entypo name={'camera'} size={wp(5.5)} color={Colors.color1} />
                                </Ripple>
                            }
                            {
                                userData?.membership_expiry !== null
                                && moment(userData?.membership_expiry).isAfter(moment())
                                &&
                                <View style={Styles.premiumBadge}>
                                    <Image
                                        source={Images.membershipWhite}
                                        resizeMode='contain'
                                        style={Styles.premiumBadgeIcon}
                                    />
                                </View>
                            }
                        </View>
                        {/* {
                        (!userData?.media?.cover_image || userData?.media?.cover_image?.length === 0) &&
                        fromUserProfile &&
                        <Ripple style={{ ...Styles.coverCameraIcon, right: userData?.media?.youtube_url ? wp(17) : wp(4) }}
                            onPress={onEditPress}
                        >
                            <Entypo name={'camera'} size={wp(5.5)} color={Colors.color1} />
                        </Ripple>
                    } */}
                    </TouchableOpacity>
                </View>
                {/* <View style={{ ...Styles.videoVoiceContainer, flexDirection: Rtl ? 'row-reverse' : 'row' }}>
                    <Ripple style={Styles.videoVoiceIconWrapper} onPress={onEditPress}>
                        <Ionicons name='play-outline' size={wp(7)} color={Colors.color2} />
                    </Ripple>
                    <Ripple style={{ ...Styles.videoVoiceIconWrapper, marginLeft: wp(4) }} onPress={onEditPress}>
                        <AntDesign name='sound' size={wp(7)} color={Colors.color2} />
                    </Ripple>
                </View> */}
                {/* <View style={{ ...Styles.contentContainer, paddingVertical: 0, flexDirection: Rtl ? 'row-reverse' : 'row' }}>
                    <View style={{ ...Styles.contentContainerInner, alignItems: Rtl ? 'flex-end' : 'flex-start' }} >
                    </View>
                </View> */}
                <View style={{ ...Styles.contentContainer, flexDirection: Rtl ? 'row-reverse' : 'row' }}>
                    <View style={{ ...Styles.contentContainerInner, alignItems: Rtl ? 'flex-end' : 'flex-start' }} >
                        {/* {!fromUserProfile ? <View style={{ flexDirection: 'row', marginBottom: 5 }}>
                            <Switch
                                value={isBlurred}
                                onValueChange={onChangeBlur}
                                renderActiveText={false}
                                renderInActiveText={false}
                                circleSize={20}
                                backgroundActive={Colors.color2}
                                backgroundInactive={Colors.color2}
                                innerCircleStyle={{
                                    borderWidth: 0
                                }}
                                circleActiveColor={Colors.color47}
                                circleInActiveColor={Colors.color4}
                            />
                            <View style={Styles.blurContainer}>
                                <Text style={Styles.blurText}>
                                    {isBlurred ? 'turnOffBlur' : 'turnOnBlur'}
                                </Text>
                            </View>
                        </View> : null} */}
                        <RenderName />
                        <RenderAge />
                        <RenderLocation />
                        {!isBlockedYou && fromUserProfile && <RenderLastOnline />}
                    </View>
                    <View style={{ ...Styles.contentContainerInner, width: wp(42), alignItems: Rtl ? 'flex-start' : 'flex-end' }} >
                        {!isBlockedYou && fromUserProfile && <RenderActionBtn />}
                        {!isBlockedYou && <RenderAllPicturesBtn />}
                    </View>
                </View>
            </View>


            <Modal transparent={true} visible={toolTipVisible}>
                <View style={Styles.modalWrapper}>
                    <Ripple style={Styles.closeWrapper} onPress={() => setToolTipVisible(false)}>
                        <AntDesign name="close" size={wp(6)} color={Colors.color1} />
                    </Ripple>
                    <View style={Styles.tootltipTextWrapper}>
                        <Image source={Images.quotesIcon} style={Styles.quotesIcon} />
                        <ReactText style={Styles.tootltipTitle}>Honoring Islamic Values</ReactText>
                        <ReactText style={Styles.description}>We request you to uphold modesty, inviting blessings and mercy from Allah. Female profile pictures are blurred by default. They can decide who gets to see their images.</ReactText>
                        <ReactText style={Styles.tootltipTitle}>Quranic Verse:</ReactText>
                        <ReactText style={Styles.tootltipText}>"And tell the believing women to lower their gaze and guard their private parts and not expose their adornment except that which (necessarily)..." <ReactText>(Surah An-Nur, 24:31)</ReactText></ReactText>
                        <ReactText style={[Styles.tootltipTitle, { marginTop: 30 }]}>Hadith:</ReactText>
                        <ReactText style={Styles.tootltipText}>"Modesty is part of faith and faith is in Paradise, but obscenity is a part of hardness of the heart and hardness of the heart is in Hell." <ReactText>(Sahih Muslim)</ReactText></ReactText>
                    </View>

                    <Button
                        onPress={() => setToolTipVisible(false)}
                        buttonStyle={Styles.closeBtn}
                        text={"Close"}
                        textStyle={Styles.closeBtnText}
                    />
                </View>
            </Modal>
        </View >
    )
}

export default Header


const hasNotch = DeviceInfo.hasNotch()
const { width } = Dimensions.get('window')
const containerHeight = !isIOS ? hp(52) : hp(50)
const Styles = StyleSheet.create({
    imageCon: {
        height: containerHeight,
        width: wp(100),
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.color2,
    },
    image: {
        width: wp(100),
        height: containerHeight
    },
    container: {
        height: containerHeight,
        justifyContent: 'flex-end',
        width: wp(100),
    },
    header: {
        paddingHorizontal: wp(4),
        paddingVertical: !isIOS ? hp(1) : hp(1),
        position: 'absolute',
    },
    onlineStatus: {
        width: width * 0.04,
        height: width * 0.04 * 1,
        borderRadius: width * 0.04 * 1 / 2,
        marginTop: hp(0.1),
        marginHorizontal: wp(1)
    },
    videoVoiceContainer: {
        width: '100%',
        paddingHorizontal: wp(4),
        paddingTop: hp(2),
    },
    videoVoiceIconWrapper: {
        backgroundColor: Colors.color47,
        padding: wp(1),
        borderRadius: 50,
        alignItems: 'center',
    },
    contentContainer: {
        width: '100%',
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    contentContainerInner: {
        width: wp(50),
        justifyContent: 'flex-end'
    },
    rowCon: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    blurContainer: {
        justifyContent: 'center',
        marginLeft: 10
    },
    blurText: {
        color: Colors.color2,
        fontFamily: Fonts.APPFONT_R,
        includeFontPadding: false,
        fontSize: Typography.small2
    },
    nameCon: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    name: {
        color: Colors.color2,
        fontFamily: Fonts.APPFONT_B,
        fontSize: Typography.medium1,
        includeFontPadding: false,
    },
    location: {
        color: Colors.color2,
        fontFamily: Fonts.APPFONT_R,
        includeFontPadding: false,
        fontSize: Typography.small2,
    },
    allPhotosBtn: {
        justifyContent: 'space-between',
        borderRadius: 30,
        paddingVertical: 5,
        flexDirection: "row",
        alignItems: 'center',
        paddingHorizontal: wp(2.5),
        backgroundColor: Colors.color47,
    },
    myPhotosBtn: {
        justifyContent: 'space-between',
        borderRadius: 30,
        paddingVertical: 5,
        flexDirection: "row",
        alignItems: 'center',
        paddingHorizontal: wp(2.5),
        backgroundColor: Colors.color1,
    },
    allPhotosBtnInner: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    galleryIcon: {
        width: wp(4),
        height: hp(3),
    },
    allPhotosTxt: {
        color: Colors.color2,
        fontFamily: Fonts.APPFONT_R,
        fontSize: Typography.small,
        marginBottom: Constants.fontFamilyMarginBottom,
        marginHorizontal: wp(0.4)
    },
    actionBtnCon: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(2)
    },
    actionIcon: {
        width: width * 0.1,
        height: width * 0.1 * 1,
        borderRadius: width * 0.08 * 1 / 2,
        backgroundColor: Colors.color2,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: wp(0.5)
    },
    actionIconInner: {
        width: width * 0.1,
        height: width * 0.1 * 1,
        borderRadius: width * 0.08 * 1 / 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    shadow: {
        shadowColor: Colors.color1,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
        elevation: 2,
    },
    profileImageCon: {
        alignSelf: 'flex-start',
        width: width * 0.3,
        height: width * 0.3 * 1,
        borderRadius: width * 0.3 * 1 / 6,
        marginHorizontal: wp(3),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.color2,
    },
    profileImage: {
        width: width * 0.3,
        height: width * 0.3 * 1,
        borderRadius: width * 0.3 * 1 / 6,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    youtubeIcon: {
        alignSelf: 'flex-end',
        marginHorizontal: wp(5),
        marginBottom: hp(-0.6)
    },
    lastOnlineAt: {
        color: Colors.color2,
        fontFamily: Fonts.APPFONT_R,
        includeFontPadding: false,
        fontSize: Typography.small,
    },
    lastOnlineAtInner: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    gradientView: {
        position: 'absolute',
        bottom: 0,
        width: wp(100),
        height: hp(30),
    },
    modalWrapper: {
        flex: 1,
        padding: 10,
        backgroundColor: Colors.color2,
    },
    tooltipWrapper: {
        position: 'absolute',
        left: 125,
        top: -10,
        zIndex: 9,
        backgroundColor: Colors.color2,
        borderRadius: 25,
        // padding: 7,
    },
    infoIcon: {
        width: 30,
        height: 30,
    },
    quotesIcon: {
        width: 80,
        height: 80,
        opacity: .3
    },
    tootltipTextWrapper: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    closeWrapper: {
        alignSelf: 'flex-end',
        paddingRight: 10,
        marginTop: isIOS ? 40 : 2
    },
    tootltipTitle: {
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_B,
        fontSize: Typography.medium,
        marginTop: 20,
    },
    description: {
        fontFamily: Fonts.APPFONT_R,
        fontSize: Typography.small2,
        color: Colors.color1
    },
    tootltipText: {
        fontFamily: Fonts.APPFONT_R,
        fontSize: Typography.small2,
        color: Colors.color1,
    },
    closeBtn: {
        backgroundColor: Colors.color2,
        borderWidth: 1,
        borderColor: Colors.greyRGBA61,
        marginBottom: hp(2),
        marginHorizontal: wp(5)
    },
    closeBtnText: {
        color: Colors.blackRGBA70
    },
    italic: { fontStyle: 'italic' },
    userIcon: {
        marginTop: hp(3)
    },
    profileCameraIcon: {
        position: 'absolute',
        bottom: hp(-0.2),
        backgroundColor: '#D9DADF',
        width: width * 0.1,
        height: width * 0.1 * 1,
        borderRadius: width * 0.1 * 1 / 2,
        justifyContent: 'center',
        alignItems: 'center',
        right: wp(-3),
    },
    coverCameraIcon: {
        position: 'absolute',
        bottom: hp(-0.5),
        right: wp(4),
        backgroundColor: '#D9DADF',
        width: width * 0.1,
        height: width * 0.1 * 1,
        borderRadius: width * 0.1 * 1 / 2,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1
    },
    premiumBadge: {
        width: width * 0.07,
        height: width * 0.07,
        borderRadius: 50,
        backgroundColor: Colors.color47,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: -7,
        left: 100,
    },
    premiumBadgeIcon: {
        width: 14,
        height: 14,
    },
})