import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, Keyboard, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from 'react-native-popup-menu';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { DeletePicker, ModalLoader, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';
import {
  ApiServices,
  flashErrorMessage,
  flashSuccessMessage,
} from '../../services';
import messageServices from '../../services/api/message-services';
import type { Message } from '../../services/api/types/message-types';

type SingleChatHeaderProps = {
  navigation: any;
  otherUserData: any;
  messages: Message[];
  conversationData: any;
  conversationId: string;
  currentUserId: string | number;
  isBlockedByYou: boolean;
  isBlockedYou: boolean;
  setMessages: (messages: Message[]) => void;
};

const SingleChatHeader = (props: SingleChatHeaderProps) => {
  const {
    navigation,
    conversationData,
    conversationId,
    otherUserData,
    currentUserId,
    isBlockedByYou: propsIsBlockedByYou,
    isBlockedYou: propsIsBlockedYou,
    setMessages,
  } = props;

  const [isBlockedByYou, setIsBlockedByYou] = useState(propsIsBlockedByYou);
  const [isBlockedYou, setIsBlockedYou] = useState(propsIsBlockedYou);

  useEffect(() => {
    setIsBlockedByYou(propsIsBlockedByYou);
    setIsBlockedYou(propsIsBlockedYou);
  }, [propsIsBlockedByYou, propsIsBlockedYou]);

  const [isBlurred, setIsBlurred] = useState(true);
  const menuRef = useRef<any>(null);

  const [deleteAlert, setDeleteAlert] = useState({
    visible: false,
    from: '',
  });
  const [modalLoader, setModalLoader] = useState({
    visible: false,
    message: 'Loading...',
  });

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
    menuRef.current?.close();
    navigation.navigate('UserProfile', { userData: otherUserData });
  };

  const onBlockUnBlockUserPress = async () => {
    menuRef.current?.close();
    if (!conversationId || !conversationData?.id) {
      flashErrorMessage('Conversation ID is missing');
      return;
    }

    setModalLoader({
      visible: true,
      message: !isBlockedByYou
        ? LanguageKeys.blockingUser
        : LanguageKeys.unBlockingUser,
    });

    try {
      const params = {
        type: 7,
        action_user_id: otherUserData?.id,
        allow_photo_request: 0,
      };
      await ApiServices.interactionAction(params);

      const conversationIdNum = parseInt(conversationId, 10);
      if (isNaN(conversationIdNum)) {
        throw new Error('Invalid conversation ID');
      }

      await messageServices.blockConversationParticipant(
        conversationIdNum,
        otherUserData?.id
      );

      flashSuccessMessage(
        !isBlockedByYou ? LanguageKeys.blocked : LanguageKeys.unBlocked
      );
      setIsBlockedByYou(!isBlockedByYou);
      hideModalLoader();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to block/unblock user';
      flashErrorMessage(errorMessage);
      hideModalLoader();
    }
  };

  const onBlockUnBlockAndReportUserPress = async () => {
    menuRef.current?.close();
    if (!conversationId || !conversationData?.id) {
      flashErrorMessage('Conversation ID is missing');
      return;
    }

    setModalLoader({
      visible: true,
      message: !isBlockedByYou
        ? LanguageKeys.blockingUser
        : LanguageKeys.unBlockingUser,
    });

    try {
      const params = {
        type: 8,
        action_user_id: otherUserData?.id,
        allow_photo_request: 0,
      };
      await ApiServices.interactionAction(params);

      const conversationIdNum = parseInt(conversationId, 10);
      if (isNaN(conversationIdNum)) {
        throw new Error('Invalid conversation ID');
      }

      await messageServices.blockConversationParticipant(
        conversationIdNum,
        otherUserData?.id
      );

      flashSuccessMessage(
        !isBlockedByYou ? LanguageKeys.blocked : LanguageKeys.unBlocked
      );
      setIsBlockedByYou(!isBlockedByYou);
      hideModalLoader();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to block and report user';
      flashErrorMessage(errorMessage);
      hideModalLoader();
    }
  };

  const conversationDeleteSuccess = () => {
    hideModalLoader();
    flashSuccessMessage(LanguageKeys.conversationDeleted);
    navigation.goBack();
  };

  const conversationClearSuccess = () => {
    hideModalLoader();
    flashSuccessMessage(LanguageKeys.chatCleared);
    // Clear messages in the parent component
    setMessages([]);
  };

  const onClearChatPress = async () => {
    hideDeleteAlert();

    if (!conversationId || !conversationData?.id) {
      flashErrorMessage('Conversation ID is missing');
      return;
    }

    setModalLoader({
      visible: true,
      message: LanguageKeys.clearingChat,
    });

    try {
      const conversationIdNum = parseInt(conversationId, 10);
      if (isNaN(conversationIdNum)) {
        throw new Error('Invalid conversation ID');
      }

      await messageServices.clearConversation(conversationIdNum);
      conversationClearSuccess();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to clear conversation';
      flashErrorMessage(errorMessage);
      hideModalLoader();
    }
  };

  const hideDeleteAlert = () => {
    setDeleteAlert({
      visible: false,
      from: '',
    });
  };

  const onDeleteAlertDeletePress = () => {
    // Capture the alert type before closing modal
    const alertType = deleteAlert?.from;

    // Close modal immediately
    hideDeleteAlert();

    // Execute action after modal closes
    if (alertType === 'chat') {
      onDeleteChatPress();
    } else {
      onClearChatPress();
    }
  };

  const onDeleteChatPress = async () => {
    hideDeleteAlert();

    if (!conversationId || !conversationData?.id) {
      flashErrorMessage('Conversation ID is missing');
      return;
    }

    setModalLoader({
      visible: true,
      message: LanguageKeys.deleting,
    });

    try {
      const conversationIdNum = parseInt(conversationId, 10);
      if (isNaN(conversationIdNum)) {
        throw new Error('Invalid conversation ID');
      }

      await messageServices.deleteConversation(conversationIdNum);
      conversationDeleteSuccess();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to delete conversation';
      flashErrorMessage(errorMessage);
      hideModalLoader();
    }
  };

  const showClearChatAlert = () => {
    menuRef.current?.close();
    Keyboard.dismiss();
    setDeleteAlert({
      visible: true,
      from: 'clear',
    });
  };

  const showDeleteChatAlert = () => {
    menuRef.current?.close();
    Keyboard.dismiss();
    setDeleteAlert({
      visible: true,
      from: 'chat',
    });
  };

  const onChangeBlur = () => {
    menuRef.current?.close();
    const newParams = {
      type: '9',
      action_user_id: otherUserData?.id,
    };

    ApiServices.interactionAction(newParams)
      .then(async () => {
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
        // 'Unblock user',
        'Clear chat',
        // blurText,
        'Cancel',
      ];
    } else {
      optionsArray = [
        'View profile',
        // 'Block user',
        // 'Report and block user',
        'Clear chat',
        // blurText,
        'Cancel',
      ];
    }
  } else {
    if (isBlockedByYou) {
      optionsArray = [
        'View profile',
        // 'Unblock user',
        'Clear chat',
        'Delete conversation',
        // blurText,
        'Cancel',
      ];
    } else {
      optionsArray = [
        'View profile',
        // 'Block user',
        // 'Report and block user',
        'Clear chat',
        'Delete conversation',
        // blurText,
        'Cancel',
      ];
    }
  }

  let actionsArray = [];
  if (!conversationData || !Object.keys(conversationData).length) {
    if (isBlockedByYou) {
      actionsArray = [
        onViewProfilePress,
        // onBlockUnBlockUserPress,
        showClearChatAlert,
        // onChangeBlur,
      ];
    } else {
      actionsArray = [onViewProfilePress, showClearChatAlert];
    }
  } else {
    if (isBlockedByYou) {
      actionsArray = [
        onViewProfilePress,
        // onBlockUnBlockUserPress,
        showClearChatAlert,
        showDeleteChatAlert,
        // onChangeBlur,
      ];
    } else {
      actionsArray = [
        onViewProfilePress,
        // onBlockUnBlockUserPress,
        // onBlockUnBlockAndReportUserPress,
        showClearChatAlert,
        showDeleteChatAlert,
        // onChangeBlur,
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
          color={Colors.ink}
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
              <Image
                source={Images.user}
                resizeMode="cover"
                style={Styles.userIcon}
              />
            )}
          </View>
          <Text variant="display" style={Styles.userName} numberOfLines={1}>
            {otherUserData?.name}
          </Text>
        </Ripple>
      </View>
      {currentUserId !== 'guardian' && (
        <Menu ref={menuRef}>
          <MenuTrigger>
            <View style={Styles.menuBtn}>
              <Ionicons
                name="ellipsis-vertical"
                size={wp(5)}
                color={Colors.ink}
              />
            </View>
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
                    menuRef.current?.close();
                    if (action) {
                      action();
                    }
                  }}
                  text={option}
                  customStyles={{
                    optionText: isDestructive
                      ? Styles.menuTextDestructive
                      : Styles.menuText,
                  }}
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
        useCustomModal={false}
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
    backgroundColor: Colors.surface,
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  headerInnerCon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIcon: {
    width: width * 0.05,
    height: width * 0.05 * 1,
    opacity: 0.6,
  },
  userImage: {
    width: width * 0.1,
    height: width * 0.1 * 1,
    borderRadius: (width * 0.1 * 1) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.lavender,
    marginHorizontal: wp(2),
    overflow: 'hidden',
  },
  userName: {
    alignSelf: 'center',
    fontSize: Typography.medium,
    color: Colors.ink,
    maxWidth: wp(52),
  },
  menuBtn: {
    width: wp(9),
    height: wp(9),
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuOptionsContainer: {
    borderRadius: 14,
    paddingVertical: hp(0.6),
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.hairline,
    marginTop: hp(1),
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  menuText: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small2,
  },
  menuTextDestructive: {
    color: Colors.color24,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small2,
  },
});
