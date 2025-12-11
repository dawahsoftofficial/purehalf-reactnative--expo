import { View, StatusBar, StyleSheet, Dimensions, ScrollView, TextInput, Text, ActivityIndicator, Alert, TouchableOpacity, VirtualizedList, Image } from 'react-native'
import React, { useState, useReducer, useEffect, useRef } from 'react'
import Ripple from 'react-native-material-ripple'
import { useTranslation } from 'react-i18next'
import Ionicons from 'react-native-vector-icons/Ionicons'
import moment from 'moment'
import database from '@react-native-firebase/database';
import _ from 'lodash'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { Container, PremiumButton } from '../../components'
import SingleChatHeader from './SingleChatHeader'
import { Colors, Fonts, Images } from '../../res'
import { Typography, hp, wp } from '../../global'
import { Firebase, getTimeStamp, useGlobalContext, StorageManager, ApiServices, flashErrorMessage, flashInfoMessage, isIOS } from '../../services'
import { CheckRtl, LanguageKeys } from '../../languages'

const SingleChat = (props: any) => {
    const Rtl = CheckRtl()
    const { setData, storageKeys } = StorageManager
    const flatListRef: any = useRef(null);
    const inputRef: any = useRef(null);
    let chatOpenTimeStamp = getTimeStamp()
    const [, forceUpdate] = useReducer((x) => x + 1, 0);
    const { t }: any = useTranslation()
    const { currentUser, conversations, updateCurrentUser } = useGlobalContext()
    let fromNotification = props?.route?.params?.from === 'notification' ? true : false
    const fromMessages = props?.route?.params?.from === 'messages' ? true : false
    const guardian = currentUser?.guardian ? currentUser?.guardian : false
    const [otherUserData, setOtherUserData] = useState(props?.route?.params?.otherUserData)
    const [isBlockedByYou, setIsBlockedByYou] = useState(false)
    const [isBlockedYou, setIsBlockedYou] = useState<any>(false)
    const [listReachedStart, setListReachedStart] = useState(true)
    const [loader, setLoader] = useState(true)
    const [flastListFooterLoader, setFlastListFooterLoader] = useState(false)
    const [messagePressedId, setMessagePressedId] = useState(null)
    const [quote, setQuote] = useState('')

    const [messages, setMessages] = useState<any>([])
    const [messagesPage, setMessagesPage] = useState({ start: 0, end: 15 })
    const [lastDeletedByFound, setLastDeletedByFound] = useState(false)
    const [totalMessages, setTotalMessages] = useState([])
    const [conversationData, setConversationData] = useState<any>('')
    const [conversationId, setConversationId] = useState('')

    const [inputMessage, setInputMessage] = useState("")
    const messagesRef: any = useRef(messages);

    const onChangeInputMessage = (text: any) => {
        setInputMessage(text)
    }

    const handleLastDeletedBy = (messages: any, lastDeleted = lastDeletedByFound) => {
        return new Promise(async (resolve, reject) => {
            messages = await _.reject(messages, (message) =>
                _.get(message, `blockedParticipants.${otherUserData?.id}`) === true
            );
            const lastDeletedByIndex: any = _.findIndex(messages, (message: any) => {
                return (
                    message.deletedBy &&
                    message.deletedBy[currentUser?.id] &&
                    message.deletedBy[currentUser?.id] === true
                );
            });
            if (lastDeleted) {
                setFlastListFooterLoader(false)
                if (loader) {
                    setLoader(false)
                }
                resolve('ignore')
            }
            else if (lastDeletedByIndex !== -1) {
                setLastDeletedByFound(true)
                messages = _.take(messages, lastDeletedByIndex);
                resolve(messages)
            }
            else {
                resolve(messages)
            }
        })
    }

    const getOtherUserData = async () => {
        if (currentUser?.id === 'guardian') {
            const response = await ApiServices.getUserDetailGuardian(otherUserData?.id)
            const fcmToken = response?.fcm_token || []
            setOtherUserData((otherUserData: any) => {
                otherUserData.token = fcmToken?.map((item: any) => item?.fcm_token)
                    .filter((token: any) => token !== undefined && token !== null)
                return otherUserData
            })
        }
        else {
            ApiServices.getUserDetail(otherUserData?.id).then((res: any) => {
                if (res?.fcm_token) {
                    setOtherUserData((otherUserData: any) => {
                        otherUserData.token = res?.fcm_token?.map((item: any) => item?.fcm_token)
                            .filter((token: any) => token !== undefined && token !== null)
                        return otherUserData
                    })
                }
            })
        }
    }

    useEffect(() => {
        if (fromMessages) {
            getOtherUserData();
        } else if (fromNotification) {
            setLoader(false);
            const conversationId = props?.route?.params?.conversationId;
            const message = props?.route?.params?.message;

            const conversationData = conversations.filter((element: any) => {
                if (element?.convDetails?.id === conversationId) {
                    if (!element.messages[message?.id]) {
                        element.messages = {
                            [message?.id]: message,
                            ...element.messages,
                        };
                    }
                    return true;
                }
                return false;
            });

            if (conversationData && conversationData?.length !== 0) {
                setConversationId(conversationId);
                props.route.params.conversationData = conversationData[0];
            } else {
                setLoader(false);
            }
            getOtherUserData();
        }
    }, []);

    useEffect(() => {
        const conversationData = props?.route?.params?.conversationData;
        if (conversationData && Object.keys(conversationData?.convDetails).length !== 0) {
            const { convDetails, messages } = conversationData;
            setConversationData(convDetails);

            const messagesArray: any = messages ? _.orderBy(Object.values(messages), ['createdAt'], ['desc']) : [];
            setTotalMessages(messagesArray);

            if (messagesArray.length === 0) {
                setLoader(false);
            } else {
                const last15Messages = _.slice(messagesArray, 0, 15);
                handleLastDeletedBy(last15Messages)
                    .then((res: any) => {
                        if (res !== 'ignore') {
                            setMessages(res);
                            handleReadBy(convDetails, res);
                        }
                    })
                    .finally(() => setLoader(false));
            }

            setConversationId(convDetails?.id);
            setIsBlockedByYou(convDetails?.participantsBlockFlag[otherUserData?.id]?.blockStatus === true);
            setIsBlockedYou(convDetails?.participantsBlockFlag[currentUser?.id]?.blockStatus === true);
        } else if (!fromNotification) {
            setLoader(false);
        }
    }, [props?.route?.params?.conversationData]);


    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);


    const setOpenedConversation = async (conversationId: any) => {
        await setData(storageKeys.OPENED_CONVERSATION_ID, conversationId)
    }

    useEffect(() => {
        if (conversationId.length !== 0) {
            setOpenedConversation(conversationId)
            const onChildChanged = database()
                .ref(`/conversations/${conversationId}/messages`)
                .orderByChild('createdAt')
                .startAt(chatOpenTimeStamp)
                .on('child_changed', (snapshot: any) => {
                    const updatedMessage = snapshot.val();
                    const messageIndex = messagesRef?.current.findIndex((message: any) => message.id === updatedMessage.id);
                    if (messageIndex !== -1) {
                        messagesRef.current[messageIndex] = updatedMessage;
                    }
                    setMessages(messagesRef.current)
                    setConversationData(conversationData);
                    forceUpdate();
                });

            const onBlockChanged = database()
                .ref(`/conversations/${conversationId}/convDetails/participantsBlockFlag`)
                .on('child_changed', (snapshot: any) => {
                    setConversationData((prevConversationData: any) => {
                        const updatedConversationData = { ...prevConversationData };
                        updatedConversationData.participantsBlockFlag[snapshot.key] = snapshot.val();
                        if (updatedConversationData?.participantsBlockFlag[currentUser?.id]?.blockStatus === true) {
                            setIsBlockedYou(true);
                        } else {
                            setIsBlockedYou(false);
                            handleReadBy(updatedConversationData, messagesRef?.current);
                        }
                        updatedConversationData?.participantsBlockFlag[otherUserData?.id]?.blockStatus === true ?
                            setIsBlockedByYou(true) : setIsBlockedByYou(false);
                        return updatedConversationData;
                    });
                    forceUpdate();
                });

            const onChildAdd = database()
                .ref(`/conversations/${conversationId}/messages`)
                .orderByChild('createdAt')
                .startAt(chatOpenTimeStamp)
                .on('child_added', (snapshot: any) => {
                    const newMessage = snapshot.val();
                    if (newMessage?.sender !== currentUser?.id) {
                        if (newMessage?.blockedParticipants?.[otherUserData?.id] === true) { } else {
                            const lastMessage: any = _.first(messagesRef?.current);
                            if (!lastMessage || newMessage.createdAt > lastMessage.createdAt) {
                                newMessage.id = snapshot.key;
                                setMessages((prevMessages: any) => [newMessage, ...prevMessages]);
                                forceUpdate();
                                handleReadBy(conversationData, messagesRef?.current, true);
                            }
                        }
                    }
                })
            const clearOpenedConvId = async () => {
                await setData(storageKeys.OPENED_CONVERSATION_ID, null)
            }

            return () => {
                database().ref(`/conversations/${conversationId}/messages`).off('child_changed', onChildChanged);
                database().ref(`/conversations/${conversationId}/messages`).off('child_added', onChildAdd);
                database().ref(`/conversations/${conversationId}/convDetails/blocked`).off('child_changed', onBlockChanged);
                clearOpenedConvId()
            };
        }
    }, [conversationId]);

    useEffect(() => {
        let quotes = [
            t('adviceOneText'),
            t('adviceTwoText'),
            t('adviceThreeText'),
            t('adviceFourText'),
            t('adviceFiveText'),
            t('adviceSixText'),
            t('adviceSevenText'),
            t('adviceEightText'),
            t('adviceNineText'),
            t('adviceTenText'),
            t('adviceElevenText'),
            t('adviceTwelveText'),
            t('adviceThirteenText'),
        ]
        setQuote(([...quotes].sort(() => Math.random() - 0.5))[0]);
    }, []);

    const handleReadBy = (convDetails: any, messages: any, fromNewMessage = false) => {
        if (
            convDetails?.length !== 0 &&
            !convDetails?.participantsBlockFlag[otherUserData?.id]?.blockStatus
        ) {
            if (convDetails?.unReadCount[currentUser?.id] !== 0 || fromNewMessage) {
                Firebase.updateConvUnReadCount(convDetails?.id, currentUser?.id).then(() => {
                    const updatedUnReadCount = {
                        ...convDetails.unReadCount,
                        [currentUser?.id]: 0,
                    };

                    const updatedConvDetails = {
                        ...convDetails,
                        unReadCount: updatedUnReadCount,
                    };
                    setConversationData(updatedConvDetails);
                });
            }

            const filteredMessages = messages.reduce((acc: any, message: any) => {
                if (
                    message?.readBy[currentUser?.id]?.seen === false &&
                    message?.blockedParticipants?.[otherUserData?.id] !== true
                ) {
                    const updatedMessage = {
                        ...message,
                        readBy: {
                            ...message.readBy,
                            [currentUser?.id]: {
                                seen: true,
                                seenAt: getTimeStamp(),
                            },
                        },
                    };
                    acc.push(updatedMessage);
                } else {
                    acc.push(message);
                }
                return acc;
            }, []);

            if (filteredMessages?.length !== 0) {
                Firebase.updateMessagesReadBy(
                    filteredMessages,
                    currentUser?.id,
                    convDetails?.id
                );
            }
        }
    };

    const onMessageSendingFailed = (messages: any) => {
        messages[0].status = 'failed'
        setMessages(messages)
        forceUpdate()
    }

    const sendMessageToFirebase = (messageData: any, conversationData: any, messages: any) => {
        Firebase.sendMessage(messageData, conversationData)
            .then(() => {
                messages[0].status = 'sent'
                setMessages(messages)
                forceUpdate()
                const data = {
                    title: currentUser?.full_name,
                    body: messageData?.message,
                    pressAction: "openChat",
                    data: {
                        user: {
                            image: currentUser?.media?.primary_image,
                            name: currentUser?.full_name,
                            id: currentUser?.id
                        },
                        conversationId: conversationData?.id,
                        message: messageData
                    }

                }
                const token = otherUserData?.token

                Firebase.sendMessageNotification(token, data)
            })
            .catch(onMessageSendingFailed.bind(null, messages))
    }

    const isPremiumUser = () => {
        return new Promise((resolve, reject) => {
            const now = moment();
            const membershipExpiry = currentUser?.membership_expiry
            if (membershipExpiry !== null && moment(membershipExpiry).isAfter(now)) {
                resolve('premiumUser')
            }
            else if (membershipExpiry === null || moment(membershipExpiry).isBefore(now)) {
                ApiServices.getCurrentUserDetail().then((res: any) => {
                    const membershipExpiry = res?.membership_expiry
                    updateCurrentUser(res)
                    if (membershipExpiry === null || moment(membershipExpiry).isBefore(now)) {
                        props.navigation.navigate('ProFeaturesPromotion', { navigateTo: 'goBack' })
                    }
                    else {
                        resolve('premiumUser')
                    }
                })
                    .catch(() => {
                    })
            }
        })
    }

    const containsRestrictedWord = (message: string) => {
        const restrictedWords = ['bad', 'inappropriate', 'harmful'];
        return restrictedWords.some(word => message.includes(word));
    }

    const sendMessage = async () => {
        setInputMessage('')
        let messageData: any = {
            createdAt: getTimeStamp(),
            id: `id-${getTimeStamp()}`,
            sender: currentUser?.id,
            message: inputMessage,
            status: 'sending',
            readBy: {
                [currentUser?.id]: { seen: true, seenAt: getTimeStamp() },
                [otherUserData?.id]: { seen: false, seenAt: null }
            }
        }
        if (isBlockedYou) {
            messageData.blockedParticipants = {
                ...messageData?.blockedParticipants,
                [currentUser?.id]: true
            }
        }
        // if(messages.length === 0 && totalMessages.length === 0) {
        if (!currentUser?.is_chat_reported && containsRestrictedWord(inputMessage)) {
            ApiServices.updateUserInfo({ is_chat_reported: true })
                .then(async (res: any) => {
                    currentUser.is_chat_reported = res?.is_chat_reported;
                    await setData(storageKeys.USER, currentUser);
                    updateCurrentUser(currentUser);
                })
                .catch(err => { });
        }
        if (conversationData?.length === 0) {
            messages.push(messageData)
            setMessages(messages);

            const conversation = {
                participantsDeleteFlag: {
                    [currentUser?.id]: { deleteStatus: false },
                    [otherUserData?.id]: { deleteStatus: false }
                },
                deletedAt: [],
                createdBy: currentUser?.id,
                participantsBlockFlag: {
                    [currentUser?.id]: { blockStatus: false },
                    [otherUserData?.id]: { blockStatus: false }
                },
                unReadCount: {
                    [currentUser?.id]: 0,
                    [otherUserData?.id]: 1
                },
                participantsData: [
                    {
                        image: currentUser?.media?.primary_image,
                        name: currentUser?.full_name,
                        id: currentUser?.id
                    },
                    {
                        image: otherUserData?.image,
                        name: otherUserData?.name,
                        id: otherUserData?.id
                    }
                ],
                createdAt: getTimeStamp(),
                id: `id-${getTimeStamp()}`,
                latestMessage: inputMessage,
                latestMessageCreatedAt: messageData?.createdAt
            }
            setConversationId(conversation?.id)
            setConversationData(conversation)
            Firebase.createChat(conversation).then(() => {
                sendMessageToFirebase(messageData, conversation, messages)
            })
        }
        else {
            messages.unshift(messageData)
            setMessages(messages);

            const conversation = {
                ...conversationData,
                participantsDeleteFlag: {
                    ...(conversationData?.participantsDeleteFlag || {}),
                    ...(currentUser?.id !== 'guardian' && { [currentUser?.id]: { deleteStatus: false } }),
                    [otherUserData?.id]: { deleteStatus: false }
                },
                participantsData: [
                    ...(currentUser?.id !== 'guardian' && currentUser?.id
                        ? [{ image: currentUser?.media?.primary_image, name: currentUser?.full_name, id: currentUser?.id }]
                        : []),
                    ...(otherUserData?.id
                        ? [{ image: otherUserData?.image, name: otherUserData?.name, id: otherUserData?.id }]
                        : []),
                    ...(conversationData.participantsData || []).filter(
                        (participant: any) =>
                            participant.id !== currentUser?.id && participant.id !== otherUserData?.id
                    ),
                ],
                unReadCount: {
                    ...conversationData.unReadCount,
                    [currentUser?.id]: 0,
                    [otherUserData?.id]:
                        isBlockedYou ? conversationData?.unReadCount[otherUserData?.id] :
                            conversationData?.unReadCount[otherUserData?.id] + 1
                },
                latestMessage: isBlockedYou ? conversationData?.lastestMessage : inputMessage,
                latestMessageCreatedAt: isBlockedYou ? conversationData?.latestMessageCreatedAt : messageData?.createdAt
            }
            setConversationData(conversation)
            sendMessageToFirebase(messageData, conversation, messages)
        }

        try {
            // const lastMessageTimestamp = await AsyncStorage.getItem('lastMessageTimestamp');
            // const wordsArray = inputMessage.split(' ');
            // const firstFiveWords = wordsArray.slice(0, 5);
            // const resultWords = firstFiveWords.join(' ');
            // if (lastMessageTimestamp !== null) {
            //     const lastMessageTime = new Date(parseInt(lastMessageTimestamp, 10));
            //     const currentTime = new Date();
            //     const timeDifference = (currentTime.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60); // Convert to hours

            //     if (timeDifference > 8) {
            //         let res = await ApiServices.snedMessageNotification({
            //             other_user_id: otherUserData?.id,
            //             other_username: otherUserData?.name,
            //             country: "Pakistan",
            //             message_first_five_words: resultWords
            //         })
            //         await AsyncStorage.setItem("lastMessageTimestamp", new Date().getTime().toString())
            //     }
            // } else {
            //     let res = await ApiServices.snedMessageNotification({
            //         other_user_id: otherUserData?.id,
            //         other_username: otherUserData?.name,
            //         country: "Pakistan",
            //         message_first_five_words: resultWords
            //     })
            //     await AsyncStorage.setItem("lastMessageTimestamp", new Date().getTime().toString())
            // }
            const lastMessageTimestamp = await AsyncStorage.getItem('lastMessageTimestamp');
            const wordsArray = inputMessage.split(' ');
            const firstFiveWords = wordsArray.slice(0, 5);
            const resultWords = firstFiveWords.join(' ');

            if (lastMessageTimestamp !== null) {
                const lastMessageTime = new Date(parseInt(lastMessageTimestamp, 10));
                const currentTime = new Date();
                const timeDifference = (currentTime.getTime() - lastMessageTime.getTime()) / (1000 * 60); // Convert to minutes

                if (timeDifference > 1) { // Change from 8 hours to 1 minute
                    let res = await ApiServices.snedMessageNotification({
                        other_user_id: otherUserData?.id,
                        other_username: currentUser?.full_name,
                        country: "Pakistan",
                        message_first_five_words: resultWords
                    });
                    await AsyncStorage.setItem("lastMessageTimestamp", new Date().getTime().toString());
                }
            } else {
                let res = await ApiServices.snedMessageNotification({
                    other_user_id: otherUserData?.id,
                    other_username: otherUserData?.name,
                    country: "Pakistan",
                    message_first_five_words: resultWords
                });
                await AsyncStorage.setItem("lastMessageTimestamp", new Date().getTime().toString());
            }

        } catch (error) {
            console.error(error);
        }
    }

    const onSendPress = async () => {
        if (isBlockedByYou) {
            Alert.alert(`You have blocked ${otherUserData?.name} please unblock first to send message`)
        }
        else if (currentUser?.gender === 'male' && currentUser?.membership_status === 0 || currentUser?.membership_status === null) {
            isPremiumUser().then(() => {
                sendMessage()
            })
        }
        else {
            sendMessage()
        }
    }

    const onMessagePress = (messageId: any) => {
        if (messageId === messagePressedId) {
            setMessagePressedId(null)
            forceUpdate()
        }
        else {
            setMessagePressedId(messageId)
            forceUpdate()
        }
    }

    const renderMessages = ({ item }: any) => {

        const itemSender = item?.sender;
        const currentUserID = currentUser?.id;
        const guardianUserId = currentUser?.user?.id;
        const otherUserId = otherUserData?.id;
        const itemReadBy = item?.readBy;

        const isCurrentUser = itemSender === currentUserID;
        const otherUserReadBy = itemReadBy?.[otherUserId];

        const isGuardian = itemSender === 'guardian' || itemSender === guardianUserId;

        const backgroundColor = isCurrentUser
            ? Colors.theme
            : isGuardian
                ? Colors.color53
                : Colors.color31;

        const textColour = isGuardian || isCurrentUser
            ? Colors.color2
            : Colors.color1;

        return (
            <View
                key={item?.id}
                style={{
                    marginTop: hp(1),
                    alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
                }}
            >
                <TouchableOpacity
                    style={[Styles.messageCon, { backgroundColor: backgroundColor }]}
                    // disabled={!isCurrentUser}
                    onPress={onMessagePress.bind(null, item?.id)}
                    activeOpacity={0.9}
                >
                    <Text style={[Styles.messageTxt, { color: textColour }]}>
                        {item?.message}
                    </Text>
                    {
                        isCurrentUser && otherUserReadBy?.seen === true &&
                        <Ionicons
                            name='md-checkmark-done'
                            color={Colors.color2}
                            size={wp(5)}
                            style={Styles.seenIcon}
                        />
                    }
                </TouchableOpacity>
                {
                    isCurrentUser && (
                        <View>
                            {
                                item?.status == 'sending' &&
                                <View style={Styles.messageSendingCon}>
                                    <ActivityIndicator color={Colors.theme} size={wp(4)} style={{ marginHorizontal: wp(2) }} />
                                    <Text style={Styles.sendingText}>
                                        Sending
                                    </Text>
                                </View>
                            }
                        </View>
                    )
                }
                <View>
                    {
                        messagePressedId && messagePressedId === item?.id &&
                        <View style={Styles.messageTimeCon} >
                            <Text style={Styles.messageTime}>
                                Sent {getTimeAgo(item?.createdAt)}
                            </Text>
                            {
                                otherUserReadBy?.seen &&
                                <Text style={Styles.messageTime}>
                                    Seen {getTimeAgo(otherUserReadBy?.seenAt)}
                                </Text>
                            }
                        </View>
                    }
                </View>
            </View>
        )
    };

    const getTimeAgo = (timestamp: any) => {
        const now = moment();
        const time = moment(timestamp);
        const daysDiff = now.diff(time, 'days');

        if (daysDiff === 0) {
            return `at ${time.format('hh:mm A')}`;
        }

        if (daysDiff === 1) {
            return `Yesterday  at ${time.format('hh:mm A')}`;
        }

        if (daysDiff < 7) {
            return `${daysDiff} days ago at ${time.format('hh:mm A')}`;
        }

        return `${time.format('DD-MMM-YY')} at ${time.format('hh:mm A')}`;
    };

    const handleEndReached = () => {
        if (totalMessages.length >= 15) {
            if (listReachedStart) {
                setListReachedStart(false)
            }
            setFlastListFooterLoader(true)
            const newPage = {
                start: messagesPage.start + 15,
                end: messagesPage.end + 15
            }
            const filteredMessages = _.slice(totalMessages, newPage?.start, newPage?.end);
            if (filteredMessages.length !== 0) {
                setMessagesPage(newPage)
                handleLastDeletedBy(filteredMessages).then((res: any) => {
                    if (res !== 'ignore') {
                        setMessages((prevMsgs: any) => [...prevMsgs, ...res])
                        if (messages.length === totalMessages.length) {
                            setFlastListFooterLoader(false)
                        }
                    }
                    else {
                        setFlastListFooterLoader(false)
                    }
                })
            }
            else {
                setFlastListFooterLoader(false)
            }
        }
    }

    const FooterLoader = () => (
        flastListFooterLoader ?
            <ActivityIndicator color={Colors.theme} style={{ marginVertical: hp(2) }} /> : null
    )

    const onInputFocus = () => {
        if (flatListRef?.current) {
            flatListRef?.current?.scrollToOffset({ offset: 0, animated: true });
        }
        if (messages.length > 15) {
            const filteredMessages = _.slice(messages, 0, 15);
            setMessagesPage({
                start: 0,
                end: 15
            })
            setLastDeletedByFound(false)
            handleLastDeletedBy(filteredMessages, false).then((res: any) => {
                if (res !== 'ignore') {
                    setMessages(res)
                }
            })
        }
    }

    const onScrollBegin = () => {
        if (inputRef.current && inputRef.current.isFocused()) {
            inputRef.current.blur();
        }
    }

    const onDisabledInputPress = () => {
        flashInfoMessage(LanguageKeys.disabledChatDescription)
    }

    const onWaliPress = () => {
        props.navigation.navigate('AddWali', { fromSettings: true })
    }

    return (
        <Container>
            <StatusBar backgroundColor={Colors.color2} barStyle={'dark-content'} />
            {
                (currentUser?.membership_status === 0 || currentUser?.membership_status === null)
                && <PremiumButton
                    heading={LanguageKeys.goPremiumButtonHeadingOne}
                    description={LanguageKeys.goPremiumButtonHeadingTwo}
                />
            }

            <SingleChatHeader
                navigation={props?.navigation}
                otherUserData={otherUserData}
                messages={messages}
                conversationData={conversationData}
                currentUserId={currentUser?.id}
                isBlockedByYou={isBlockedByYou}
                isBlockedYou={isBlockedYou}
            />
            <ScrollView
                contentContainerStyle={Styles.innerContainer}
                automaticallyAdjustKeyboardInsets
                keyboardShouldPersistTaps={'handled'}
                scrollEnabled={false}
            >
                {guardian ?
                    <Ripple
                        style={Styles.guardianTextWrapper}
                        onPress={onWaliPress}
                    >
                        <Text style={Styles.guardianText}>{t('monitoredByWali')}</Text>
                    </Ripple> : currentUser?.gender === 'female' ? <Ripple
                        style={Styles.guardianTextWrapper}
                        onPress={onWaliPress}
                    >
                        <Text style={Styles.guardianText}>{t('addAWali')}</Text>
                    </Ripple> : null}
                <ScrollView
                    horizontal
                    scrollEnabled={false}
                    contentContainerStyle={{ flex: 1 }}
                >
                    {
                        loader ?
                            <ActivityIndicator color={Colors.theme} size={'small'} style={{ marginLeft: wp(46) }} />
                            :
                            messages?.length ?
                                <VirtualizedList
                                    onScrollBeginDrag={onScrollBegin}
                                    initialNumToRender={10}
                                    windowSize={15}
                                    ref={flatListRef}
                                    data={messages}
                                    inverted
                                    renderItem={renderMessages}
                                    contentContainerStyle={Styles.messagesListContainer}
                                    onEndReachedThreshold={0.1}
                                    onEndReached={handleEndReached}
                                    ListFooterComponent={FooterLoader}
                                    getItem={(data, index) => data[index]}
                                    getItemCount={data => data.length}
                                    keyExtractor={(item: any, index: any) => index}
                                /> :
                                <View style={Styles.textContainer}>
                                    <Image
                                        source={Images.quotesIcon}
                                        resizeMode="contain"
                                        style={Styles.logo}
                                    />
                                    <Text style={Styles.subText}>{quote?.split('|')[0]}</Text>
                                    <Text style={[Styles.subText, { fontWeight: 'bold' }]}>{quote?.split('|')[1]}</Text>
                                </View>
                    }
                </ScrollView>
                <View style={{ ...Styles.messageInputOuter, flexDirection: Rtl ? 'row-reverse' : 'row' }}>
                    <TextInput
                        ref={inputRef}
                        style={{ ...Styles.messageInput, textAlign: Rtl ? 'right' : 'left' }}
                        placeholder={t('message')}
                        placeholderTextColor={Colors.color15}
                        multiline
                        value={(messages?.length === 1 && messages[0]?.sender === currentUser?.id) ? '' : inputMessage}
                        onChangeText={onChangeInputMessage}
                        onFocus={onInputFocus}
                        editable={(messages?.length === 1 && messages[0]?.sender === currentUser?.id) ? false : true}
                        maxLength={350}
                    />
                    <TouchableOpacity
                        style={{ ...Styles.sendBtn, backgroundColor: inputMessage.trim().length === 0 ? Colors.themeRGBA50 : Colors.theme }}
                        onPress={onSendPress}
                        disabled={inputMessage.trim().length === 0 ? true : false}
                    >
                        {
                            Rtl ?
                                <Image
                                    source={Images.sendLeft}
                                    resizeMode='contain'
                                    style={[Styles.sendIcon, { marginRight: wp(0.5) }]}
                                />
                                :
                                <Image
                                    source={Images.sendRight}
                                    resizeMode='contain'
                                    style={[Styles.sendIcon, { marginLeft: wp(0.5) }]}
                                />
                        }
                    </TouchableOpacity>
                    {
                        messages?.length === 1 && messages[0]?.sender === currentUser?.id &&
                        <TouchableOpacity style={Styles.disabledInputCon}
                            onPress={onDisabledInputPress}
                        />
                    }
                </View>
            </ScrollView>
        </Container>
    )
}


export default SingleChat


const { width } = Dimensions.get('window')
const Styles = StyleSheet.create({
    innerContainer: {
        flex: 1,
        justifyContent: 'space-between',
    },
    guardianTextWrapper: {
        backgroundColor: Colors.color55,
        alignItems: 'center',
        justifyContent: 'center'
    },
    guardianText: {
        fontSize: Typography.small2,
        fontFamily: Fonts.APPFONT_R,
        color: Colors.color2
    },
    messagesListContainer: {
        paddingTop: hp(3),
        paddingHorizontal: wp(3),
    },
    textContainer: {
        width: wp(100),
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 100,
        height: 100,
    },
    mainText: {
        fontSize: Typography.medium,
        fontFamily: Fonts.APPFONT_B,
        color: Colors.color1,
    },
    subText: {
        width: wp(80),
        textAlign: 'center',
        fontSize: Typography.small1,
        fontFamily: Fonts.APPFONT_R,
        color: Colors.color4,
        marginTop: 10
    },
    smilyIconBtn: {
        width: wp(10),
        height: hp(5),
        marginLeft: wp(2),
        borderRadius: hp(5) / 2,
        marginVertical: hp(1),
        justifyContent: 'center',
        alignItems: 'center'
    },
    smilyIcon: {
        width: wp(10),
        height: hp(5),
    },
    messageInputOuter: {
        flexDirection: 'row',
        backgroundColor: Colors.color13,
        marginTop: hp(1),
        marginBottom: hp(2),
        marginHorizontal: wp(4),
        borderRadius: 30,
        alignItems: 'center',
        maxHeight: hp(20),
    },
    messageInput: {
        width: wp(79),
        fontSize: Typography.medium,
        fontFamily: Fonts.APPFONT_R,
        color: Colors.color1,
        paddingHorizontal: wp(4),
        textAlignVertical: 'top',
        paddingTop: !isIOS ? hp(1.9) : hp(0.8),
        maxHeight: hp(20),
        minHeight: hp(4.5),
    },
    sendBtn: {
        width: width * 0.12,
        height: width * 0.12 * 1,
        borderRadius: width * 0.12 * 1 / 2,
        backgroundColor: Colors.theme,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageCon: {
        paddingHorizontal: wp(3),
        paddingVertical: hp(1),
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
    },
    messageTxt: {
        fontSize: Typography.small2,
        fontFamily: Fonts.APPFONT_R,
        includeFontPadding: false,
        maxWidth: wp(70)
    },
    messageTime: {
        fontSize: Typography.tiny1,
        fontFamily: Fonts.APPFONT_R,
        color: Colors.color34,
        includeFontPadding: false
    },
    messageSendingCon: {
        flexDirection: 'row',
        marginVertical: hp(0.5),
        paddingHorizontal: wp(1),
        alignSelf: 'flex-end'
    },
    sendingText: {
        alignSelf: 'center',
        fontFamily: Fonts.APPFONT_L,
        fontSize: Typography.tiny2,
        includeFontPadding: false,
        color: Colors.color1
    },
    seenIcon: {
        marginRight: wp(-1),
        marginLeft: wp(1.5)
    },
    messageTimeCon: {
        paddingVertical: hp(0.5),
        alignItems: 'flex-end',
        paddingRight: wp(2)
    },
    sendIcon: {
        width: wp(7),
        height: hp(4),
    },
    disabledInputCon: {
        position: 'absolute',
        width: wp(91),
        height: hp(6.9),
        borderRadius: 30
    }
})