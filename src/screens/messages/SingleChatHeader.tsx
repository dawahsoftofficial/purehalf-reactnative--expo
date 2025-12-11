import { View, StyleSheet, Image, Dimensions, Text as ReactText, Keyboard } from 'react-native'
import React, { useState, useEffect } from 'react'
import AntDesign from 'react-native-vector-icons/AntDesign';
import { Colors, Fonts, Images } from '../../res';
import { hp, Typography, wp } from '../../global';
import OptionsMenu from "react-native-option-menu";
import _ from 'lodash';
import { Firebase, flashSuccessMessage, useGlobalContext, StorageManager, ApiServices } from '../../services';
import { DeletePicker, ModalLoader } from '../../components';
import { LanguageKeys } from '../../languages';
import Ripple from 'react-native-material-ripple';

const SingleChatHeader = (props: any) => {
    const { setData, storageKeys } = StorageManager
    const { currentUser, conversations, updateConversations } = useGlobalContext()
    const [isBlockedByYou, setIsBlockedByYou] = useState(false)
    const [isBlockedYou, setIsBlockedYou] = useState(false)
    const [isBlurred, setIsBlurred] = useState(true)

    const [deleteAlert, setDeleteAlert] = useState({
        visible: false,
        from: '',
    })
    const [modalLoader, setModalLoader] = useState({
        visible: false,
        message: 'Loading...'
    })

    const {
        navigation = {},
        messages = [],
        conversationData = {},
        otherUserData = {},
        currentUserId = '',
    } = props

    const onBackPress = () => navigation.goBack()

    const hideModalLoader = () => setModalLoader({
        visible: false,
        message: LanguageKeys.loading
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        ApiServices.getUsers({ page: 1, type: 9 }).then((res: any) => {
            if (res?.length) {
                setIsBlurred(!!res?.find(user => user?.id !== otherUserData?.id))
            } else {
                setIsBlurred(true)
            }
        })
            .catch(err => console.log({ err }))
    }

    const onViewProfilePress = () => {
        navigation.navigate('UserProfile', { userData: otherUserData })
    }

    const onBlockUnBlockUserPress = () => {
        setModalLoader({
            visible: true,
            message: !isBlockedByYou ? LanguageKeys.blockingUser : LanguageKeys.unBlockingUser
        })

        const params = {
            type: 7,
            action_user_id: otherUserData?.id,
            allow_photo_request: 0
        }
        ApiServices.interactionAction(params).then(() => {
            Firebase.blockUnBlockConv(conversationData?.id, otherUserData?.id, !isBlockedByYou).then(() => {
                flashSuccessMessage(!isBlockedByYou ? LanguageKeys.blocked : LanguageKeys.unBlocked)
                hideModalLoader()
            })
                .catch(hideModalLoader)
            setIsBlockedByYou(!isBlockedByYou)
            hideModalLoader()
        })
            .catch(hideModalLoader)
    }

    const onBlockUnBlockAndReportUserPress = () => {
        setModalLoader({
            visible: true,
            message: !isBlockedByYou ? LanguageKeys.blockingUser : LanguageKeys.unBlockingUser
        })

        const params = {
            type: 8,
            action_user_id: otherUserData?.id,
            allow_photo_request: 0
        }

        ApiServices.interactionAction(params).then(() => {
            Firebase.blockUnBlockConv(conversationData?.id, otherUserData?.id, !isBlockedByYou).then(() => {
                flashSuccessMessage(!isBlockedByYou ? LanguageKeys.blocked : LanguageKeys.unBlocked)
                hideModalLoader()
            })
                .catch(hideModalLoader)
            setIsBlockedByYou(!isBlockedByYou)
            hideModalLoader()
        })
            .catch(hideModalLoader)
    }

    const conversationDeleteSuccess = () => {
        hideModalLoader()
        flashSuccessMessage(LanguageKeys.conversationDeleted)
        navigation.goBack()
    }

    const conversationClearSuccess = () => {
        hideModalLoader()
        flashSuccessMessage(LanguageKeys.chatCleared)
        navigation.goBack()
    }

    const onClearChatPress = () => {
        hideDeleteAlert()
        setModalLoader({
            visible: true,
            message: LanguageKeys.clearingChat
        })
        if (messages?.length !== 0) {
            const lastMessage: any = _.first(messages)
            if (lastMessage) {
                Firebase.clearChat(conversationData?.id, lastMessage?.id, currentUserId)
                    .then(async () => {
                        const updatedConv = _.map(conversations, conversation => {
                            if (conversation?.convDetails?.id === conversationData?.id) {
                                return { ...conversation, messages: {} };
                            } else {
                                return conversation;
                            }
                        })
                        updateConversations(updatedConv)
                        await setData(storageKeys.CONVERSATIONS, updatedConv)
                        conversationClearSuccess()
                    })
                    .catch(hideModalLoader)
            }
        }
        else { conversationClearSuccess() }
    }

    const hideDeleteAlert = () => {
        setDeleteAlert({
            visible: false,
            from: '',
        })
    }

    const onDeleteAlertDeletePress = () => {
        if (deleteAlert?.from === 'chat') {
            onDeleteChatPress()
        }
        else {
            onClearChatPress()
        }
    }

    const onDeleteChatPress = async () => {
        hideDeleteAlert()
        setModalLoader({
            visible: true,
            message: LanguageKeys.deleting
        })

        const updatedConversations = await _.filter(conversations,
            conversation => conversation?.convDetails?.id !== conversationData?.id);
        updateConversations(updatedConversations)
        await setData(storageKeys.CONVERSATIONS, updatedConversations)

        if (messages?.length !== 0) {
            const lastMessage: any = _.first(messages)
            if (lastMessage) {
                Firebase.updateMessageDeletedBy(conversationData?.id, lastMessage?.id, currentUserId)
                    .then(conversationDeleteSuccess)
                    .catch(hideModalLoader)
            }
        }
        else { conversationDeleteSuccess() }
    }

    const showClearChatAlert = () => {
        Keyboard.dismiss()
        setDeleteAlert({
            visible: true,
            from: 'clear'
        })
    }

    const showDeleteChatAlert = () => {
        Keyboard.dismiss()
        setDeleteAlert({
            visible: true,
            from: 'chat'
        })
    }

    useEffect(() => {
        setIsBlockedByYou(props?.isBlockedByYou)
        setIsBlockedYou(props?.isBlockedYou)
    }, [props?.isBlockedByYou, props?.isBlockedYou])

    const onChangeBlur = () => {
        let newParams = {
            type: "9",
            action_user_id: otherUserData?.id,
        }

        ApiServices.interactionAction(newParams).then(async (res) => {
            setModalLoader({
                visible: false,
                message: LanguageKeys.updating
            })
            fetchData()
            flashSuccessMessage(isBlurred ? "Photo Unblurred Successfully" : "Photo Blurred Successfully")
        })
            .catch(hideModalLoader)
    }

    let optionsArray = [];
    let blurText = isBlurred ? "Unblur Profile Picture" : "Blur Profile Picture";
    if (!Object.keys(conversationData).length) {
        if (isBlockedByYou) {
            optionsArray = ['View profile', 'Unblock user', 'Clear chat', blurText, 'Cancel']
        } else {
            optionsArray = ['View profile', 'Block user', 'Report and block user', 'Clear chat', blurText, 'Cancel']
        }
    } else {
        if (isBlockedByYou) {
            optionsArray = ['View profile', 'Unblock user', 'Clear chat', 'Delete conversation', blurText, 'Cancel']
        } else {
            optionsArray = ['View profile', 'Block user', 'Report and block user', 'Clear chat',
                'Delete conversation', blurText, 'Cancel']
        }
    }

    let actionsArray = []
    if (!Object.keys(conversationData).length) {
        if (isBlockedByYou) {
            actionsArray = [onViewProfilePress, onBlockUnBlockUserPress, showClearChatAlert, onChangeBlur]
        }
        else {
            actionsArray = [onViewProfilePress, showClearChatAlert, onChangeBlur]
        }
    } else {
        if (isBlockedByYou) {
            actionsArray = [onViewProfilePress, onBlockUnBlockUserPress, showClearChatAlert, showDeleteChatAlert, onChangeBlur]
        }
        else {
            actionsArray = [onViewProfilePress, onBlockUnBlockUserPress, onBlockUnBlockAndReportUserPress,
                showClearChatAlert, showDeleteChatAlert, onChangeBlur]
        }
    }

    return (
        <View style={Styles.headerContainer}>
            <ModalLoader
                visible={modalLoader.visible}
                useModalLayout={true}
                message={modalLoader.message}
            />
            <View style={Styles.headerInnerCon}>
                <AntDesign name='arrowleft' color={Colors.color1} size={wp(6)}
                    onPress={onBackPress}
                />
                <Ripple style={Styles.headerInnerCon} onPress={() => props.navigation.navigate('UserProfile', {
                    userData: otherUserData
                })}>
                    <View style={Styles.userImage}>
                        {
                            otherUserData?.image && !isBlockedYou ?
                                <Image
                                    source={{ uri: otherUserData.image }}
                                    resizeMode='cover'
                                    style={Styles.userImage}
                                />
                                :
                                <Image
                                    source={Images.user}
                                    resizeMode='cover'
                                    style={Styles.userIcon}
                                />
                        }
                    </View>
                    <ReactText style={Styles.userName}>
                        {otherUserData?.name}
                    </ReactText>
                </Ripple>
            </View>
            {
                currentUserId !== 'guardian' &&
                <OptionsMenu
                    button={Images.verticalDots}
                    buttonStyle={Styles.menuBtn}
                    destructiveIndex={3}
                    options={optionsArray}
                    actions={actionsArray}
                />
            }
            <DeletePicker
                visible={deleteAlert?.visible}
                actionButtonLabel={deleteAlert?.from === 'chat' ? LanguageKeys.delete : LanguageKeys.clear}
                headerTitle={deleteAlert?.from === 'chat' ? LanguageKeys.deleteChatAlert : LanguageKeys.clearChatAlert}
                onClose={hideDeleteAlert}
                onDeletePress={onDeleteAlertDeletePress}
                onCancelPress={hideDeleteAlert}
                useCustomModal={true}
            />
        </View>
    )
}

export default SingleChatHeader

const { width } = Dimensions.get('window')

const Styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.color2,
        paddingVertical: hp(1),
        paddingHorizontal: wp(3),
        borderBottomWidth: 0.7,
        borderBottomColor: Colors.color27
    },
    headerInnerCon: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    userIcon: {
        width: width * 0.05,
        height: width * 0.05 * 1,
    },
    userImage: {
        width: width * 0.1,
        height: width * 0.1 * 1,
        borderRadius: width * 0.1 * 1 / 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.color8,
        marginHorizontal: wp(2),
    },
    userName: {
        alignSelf: 'center',
        fontSize: Typography.medium,
        color: Colors.color1,
        fontFamily: Fonts.APPFONT_M
    },
    menuBtn: {
        width: wp(8),
        height: hp(3.5),
        resizeMode: "contain"
    },
})