import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Keyboard,
  StyleSheet,
  Text as ReactText,
  View,
} from 'react-native';
import Ripple from 'react-native-material-ripple';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from 'react-native-popup-menu';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import { DeletePicker, ModalLoader } from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';
import {
  ApiServices,
  Firebase,
  flashSuccessMessage,
  StorageManager,
  useGlobalContext,
} from '../../services';

const SingleChatHeader = (props: any) => {
  const { setData, storageKeys } = StorageManager;
  const { currentUser, conversations, updateConversations } =
    useGlobalContext();

  const [isBlockedByYou, setIsBlockedByYou] = useState(props?.isBlockedByYou);
  const [isBlockedYou, setIsBlockedYou] = useState(props?.isBlockedYou);

  const setBlockedStatus = () => {
    setIsBlockedByYou(props?.isBlockedByYou);
    setIsBlockedYou(props?.isBlockedYou);
  };
  useEffect(() => {
    setTimeout(() => {
      setBlockedStatus();
    }, 0);
  }, []); // run once only

  const [isBlurred, setIsBlurred] = useState(true);

  const [deleteAlert, setDeleteAlert] = useState({
    visible: false,
    from: '',
  });
  const [modalLoader, setModalLoader] = useState({
    visible: false,
    message: 'Loading...',
  });

  const {
    navigation = {},
    messages = [],
    conversationData = {},
    otherUserData = {},
    currentUserId = '',
  } = props;

  const onBackPress = () => navigation.goBack();

  const hideModalLoader = () =>
    setModalLoader({
      visible: false,
      message: LanguageKeys.loading,
    });
  const fetchData = async () => {
    ApiServices.getUsers({ page: 1, type: 9 })
      .then((res: any) => {
        if (res?.length) {
          setIsBlurred(
            !!res?.find((user: any) => user?.id !== otherUserData?.id)
          );
        } else {
          setIsBlurred(true);
        }
      })
      .catch((err) => console.log({ err }));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onViewProfilePress = () => {
    navigation.navigate('UserProfile', { userData: otherUserData });
  };

  const onBlockUnBlockUserPress = () => {
    setModalLoader({
      visible: true,
      message: !isBlockedByYou
        ? LanguageKeys.blockingUser
        : LanguageKeys.unBlockingUser,
    });

    const params = {
      type: 7,
      action_user_id: otherUserData?.id,
      allow_photo_request: 0,
    };
    ApiServices.interactionAction(params)
      .then(() => {
        Firebase.blockUnBlockConv(
          conversationData?.id,
          otherUserData?.id,
          !isBlockedByYou
        )
          .then(() => {
            flashSuccessMessage(
              !isBlockedByYou ? LanguageKeys.blocked : LanguageKeys.unBlocked
            );
            hideModalLoader();
          })
          .catch(hideModalLoader);
        setIsBlockedByYou(!isBlockedByYou);
        hideModalLoader();
      })
      .catch(hideModalLoader);
  };

  const onBlockUnBlockAndReportUserPress = () => {
    setModalLoader({
      visible: true,
      message: !isBlockedByYou
        ? LanguageKeys.blockingUser
        : LanguageKeys.unBlockingUser,
    });

    const params = {
      type: 8,
      action_user_id: otherUserData?.id,
      allow_photo_request: 0,
    };

    ApiServices.interactionAction(params)
      .then(() => {
        Firebase.blockUnBlockConv(
          conversationData?.id,
          otherUserData?.id,
          !isBlockedByYou
        )
          .then(() => {
            flashSuccessMessage(
              !isBlockedByYou ? LanguageKeys.blocked : LanguageKeys.unBlocked
            );
            hideModalLoader();
          })
          .catch(hideModalLoader);
        setIsBlockedByYou(!isBlockedByYou);
        hideModalLoader();
      })
      .catch(hideModalLoader);
  };

  const conversationDeleteSuccess = () => {
    hideModalLoader();
    flashSuccessMessage(LanguageKeys.conversationDeleted);
    navigation.goBack();
  };

  const conversationClearSuccess = () => {
    hideModalLoader();
    flashSuccessMessage(LanguageKeys.chatCleared);
    navigation.goBack();
  };

  const onClearChatPress = () => {
    hideDeleteAlert();
    setModalLoader({
      visible: true,
      message: LanguageKeys.clearingChat,
    });
    if (messages?.length !== 0) {
      const lastMessage: any = _.first(messages);
      if (lastMessage) {
        Firebase.clearChat(conversationData?.id, lastMessage?.id, currentUserId)
          .then(async () => {
            const updatedConv = _.map(conversations, (conversation) => {
              if (conversation?.convDetails?.id === conversationData?.id) {
                return { ...conversation, messages: {} };
              } else {
                return conversation;
              }
            });
            updateConversations(updatedConv);
            await setData(storageKeys.CONVERSATIONS, updatedConv);
            conversationClearSuccess();
          })
          .catch(hideModalLoader);
      }
    } else {
      conversationClearSuccess();
    }
  };

  const hideDeleteAlert = () => {
    setDeleteAlert({
      visible: false,
      from: '',
    });
  };

  const onDeleteAlertDeletePress = () => {
    if (deleteAlert?.from === 'chat') {
      onDeleteChatPress();
    } else {
      onClearChatPress();
    }
  };

  const onDeleteChatPress = async () => {
    hideDeleteAlert();
    setModalLoader({
      visible: true,
      message: LanguageKeys.deleting,
    });

    const updatedConversations = await _.filter(
      conversations,
      (conversation) => conversation?.convDetails?.id !== conversationData?.id
    );
    updateConversations(updatedConversations);
    await setData(storageKeys.CONVERSATIONS, updatedConversations);

    if (messages?.length !== 0) {
      const lastMessage: any = _.first(messages);
      if (lastMessage) {
        Firebase.updateMessageDeletedBy(
          conversationData?.id,
          lastMessage?.id,
          currentUserId
        )
          .then(conversationDeleteSuccess)
          .catch(hideModalLoader);
      }
    } else {
      conversationDeleteSuccess();
    }
  };

  const showClearChatAlert = () => {
    Keyboard.dismiss();
    setDeleteAlert({
      visible: true,
      from: 'clear',
    });
  };

  const showDeleteChatAlert = () => {
    Keyboard.dismiss();
    setDeleteAlert({
      visible: true,
      from: 'chat',
    });
  };

  const onChangeBlur = () => {
    const newParams = {
      type: '9',
      action_user_id: otherUserData?.id,
    };

    ApiServices.interactionAction(newParams)
      .then(async (res) => {
        setModalLoader({
          visible: false,
          message: LanguageKeys.updating,
        });
        fetchData();
        flashSuccessMessage(
          isBlurred
            ? 'Photo Unblurred Successfully'
            : 'Photo Blurred Successfully'
        );
      })
      .catch(hideModalLoader);
  };

  let optionsArray = [];
  const blurText = isBlurred
    ? 'Unblur Profile Picture'
    : 'Blur Profile Picture';
  if (!conversationData || !Object.keys(conversationData).length) {
    if (isBlockedByYou) {
      optionsArray = [
        'View profile',
        'Unblock user',
        'Clear chat',
        blurText,
        'Cancel',
      ];
    } else {
      optionsArray = [
        'View profile',
        'Block user',
        'Report and block user',
        'Clear chat',
        blurText,
        'Cancel',
      ];
    }
  } else {
    if (isBlockedByYou) {
      optionsArray = [
        'View profile',
        'Unblock user',
        'Clear chat',
        'Delete conversation',
        blurText,
        'Cancel',
      ];
    } else {
      optionsArray = [
        'View profile',
        'Block user',
        'Report and block user',
        'Clear chat',
        'Delete conversation',
        blurText,
        'Cancel',
      ];
    }
  }

  let actionsArray = [];
  if (!conversationData || !Object.keys(conversationData).length) {
    if (isBlockedByYou) {
      actionsArray = [
        onViewProfilePress,
        onBlockUnBlockUserPress,
        showClearChatAlert,
        onChangeBlur,
      ];
    } else {
      actionsArray = [onViewProfilePress, showClearChatAlert, onChangeBlur];
    }
  } else {
    if (isBlockedByYou) {
      actionsArray = [
        onViewProfilePress,
        onBlockUnBlockUserPress,
        showClearChatAlert,
        showDeleteChatAlert,
        onChangeBlur,
      ];
    } else {
      actionsArray = [
        onViewProfilePress,
        onBlockUnBlockUserPress,
        onBlockUnBlockAndReportUserPress,
        showClearChatAlert,
        showDeleteChatAlert,
        onChangeBlur,
      ];
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
        <AntDesign
          name="arrowleft"
          color={Colors.color1}
          size={wp(6)}
          onPress={onBackPress}
        />
        <Ripple
          style={Styles.headerInnerCon}
          onPress={() =>
            props.navigation.navigate('UserProfile', {
              userData: otherUserData,
            })
          }
        >
          <View style={Styles.userImage}>
            {otherUserData?.image && !isBlockedYou ? (
              <Image
                source={{ uri: otherUserData.image }}
                resizeMode="cover"
                style={Styles.userImage}
              />
            ) : (
              <FontAwesome5
                name="user-alt"
                size={wp(4)}
                color={Colors.primaryLite}
              />
            )}
          </View>
          <ReactText style={Styles.userName}>{otherUserData?.name}</ReactText>
        </Ripple>
      </View>
      {currentUserId !== 'guardian' && (
        <Menu>
          <MenuTrigger>
            <Image
              source={Images.verticalDots}
              style={Styles.menuBtn}
              resizeMode="contain"
            />
          </MenuTrigger>
          <MenuOptions optionsContainerStyle={Styles.menuOptionsContainer}>
            {optionsArray.map((option, index) => {
              // Skip "Cancel" option (last item)
              if (option === 'Cancel') {
                return null;
              }

              // Get the corresponding action (actionsArray has same length as optionsArray minus Cancel)
              // Since Cancel is always last, the index matches for all other items
              const action = actionsArray[index];

              // Check if this is a destructive action
              const isDestructive =
                option === 'Delete conversation' || option === 'Clear chat';

              return (
                <MenuOption
                  key={`${option}-${index}`}
                  onSelect={() => {
                    if (action) {
                      action();
                    }
                  }}
                  text={option}
                  style={isDestructive ? Styles.destructiveOption : undefined}
                />
              );
            })}
          </MenuOptions>
        </Menu>
      )}
      <DeletePicker
        visible={deleteAlert?.visible}
        actionButtonLabel={
          deleteAlert?.from === 'chat'
            ? LanguageKeys.delete
            : LanguageKeys.clear
        }
        headerTitle={
          deleteAlert?.from === 'chat'
            ? LanguageKeys.deleteChatAlert
            : LanguageKeys.clearChatAlert
        }
        onClose={hideDeleteAlert}
        onDeletePress={onDeleteAlertDeletePress}
        onCancelPress={hideDeleteAlert}
        useCustomModal={true}
      />
    </View>
  );
};

export default SingleChatHeader;

const { width } = Dimensions.get('window');

const Styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.color2,
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderBottomWidth: 0.7,
    borderBottomColor: Colors.color27,
  },
  headerInnerCon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userImage: {
    width: width * 0.1,
    height: width * 0.1 * 1,
    borderRadius: (width * 0.1 * 1) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.color8,
    marginHorizontal: wp(2),
  },
  userName: {
    alignSelf: 'center',
    fontSize: Typography.medium,
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_M,
  },
  menuBtn: {
    width: wp(8),
    height: hp(3.5),
    resizeMode: 'contain',
  },
  menuOptionsContainer: {
    borderRadius: wp(2),
    paddingVertical: hp(0.5),
  },
  destructiveOption: {
    backgroundColor: Colors.color2,
  },
});
