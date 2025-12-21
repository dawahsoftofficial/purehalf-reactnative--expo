import React from 'react';
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { hp, wp } from '../../../global';
import { Colors } from '../../../res';
import {
  getLastSeenMessageIndex,
  getMessageTime,
  getTimeAgo,
} from '../SingleChat.utils';
import MessageStatusIcon from './MessageStatusIcon';

type Props = {
  item: any;
  index: number;

  currentUserId: any;
  guardianUserId: any;
  otherUserId: any;

  otherUserImage?: string;

  isBlockedYou: boolean;

  messages: any[];

  messagePressedId: any;
  onMessagePress: (messageId: any) => void;

  Styles: any;
  forceUpdate?: () => void; // optional; not used here but kept for flexibility
};

const MessageBubble = ({
  item,
  index,
  currentUserId,
  guardianUserId,
  otherUserId,
  otherUserImage,
  isBlockedYou,
  messages,
  messagePressedId,
  onMessagePress,
  Styles,
}: Props) => {
  const itemSender = item?.sender;
  const itemReadBy = item?.readBy;

  const isCurrentUser = itemSender === currentUserId;
  const isGuardian = itemSender === 'guardian' || itemSender === guardianUserId;

  const otherUserReadBy = itemReadBy?.[otherUserId];

  const lastSeenMessageIndex = getLastSeenMessageIndex(
    messages,
    currentUserId,
    otherUserId
  );

  const isLastSeenMessage = isCurrentUser && index === lastSeenMessageIndex;

  const backgroundColor = isCurrentUser
    ? Colors.theme
    : isGuardian
      ? Colors.color53
      : Colors.color31;

  const textColour =
    isGuardian || isCurrentUser ? Colors.color2 : Colors.color1;

  return (
    <View
      key={item?.id}
      style={{
        marginTop: hp(1),
        alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
      }}
    >
      <TouchableOpacity
        style={[Styles.messageCon, { backgroundColor }]}
        onPress={() => onMessagePress(item?.id)}
        activeOpacity={0.9}
      >
        <Text style={[Styles.messageTxt, { color: textColour }]}>
          {item?.message}
        </Text>

        <View style={Styles.messageTimeAndStatusWrapper}>
          <Text
            style={[
              Styles.messageTimeInline,
              {
                color:
                  isCurrentUser || isGuardian ? Colors.color2 : Colors.color34,
              },
            ]}
          >
            {getMessageTime(item?.createdAt)}
          </Text>

          {isCurrentUser && (
            <MessageStatusIcon
              status={item?.status || 'sent'}
              isSeen={otherUserReadBy?.seen === true}
              isBlocked={isBlockedYou}
              wasSentWhileBlocked={
                item?.blockedParticipants?.[currentUserId] === true
              }
            />
          )}
        </View>
      </TouchableOpacity>

      {isCurrentUser && item?.status === 'sending' && (
        <View style={Styles.messageSendingCon}>
          <ActivityIndicator
            color={Colors.theme}
            size={wp(4)}
            style={{ marginHorizontal: wp(2) }}
          />
          <Text style={Styles.sendingText}>Sending</Text>
        </View>
      )}

      {isLastSeenMessage && otherUserImage ? (
        <View
          style={[
            Styles.seenProfileImageContainer,
            { alignSelf: isCurrentUser ? 'flex-end' : 'flex-start' },
          ]}
        >
          <Image
            source={{ uri: otherUserImage }}
            style={Styles.seenProfileImage}
            resizeMode="cover"
          />
        </View>
      ) : null}

      {messagePressedId && messagePressedId === item?.id ? (
        <View style={Styles.messageTimeCon}>
          <Text style={Styles.messageTime}>
            Sent {getTimeAgo(item?.createdAt)}
          </Text>

          {otherUserReadBy?.seen ? (
            <Text style={Styles.messageTime}>
              Seen {getTimeAgo(otherUserReadBy?.seenAt)}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

export default MessageBubble;
