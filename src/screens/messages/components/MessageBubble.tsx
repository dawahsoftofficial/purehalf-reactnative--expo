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
  // Use sender_id from API response (new structure)
  // Convert to string for comparison as currentUserId might be string
  const itemSender = item?.sender_id != null ? String(item.sender_id) : null;
  const currentUserIdStr = currentUserId != null ? String(currentUserId) : null;

  // Convert statuses array to readBy format for backward compatibility
  const statuses = item?.statuses || [];
  const otherUserStatus = statuses.find(
    (status: any) => status.participant_id === otherUserId
  );

  const isCurrentUser = itemSender === currentUserIdStr;
  const isGuardian = itemSender === 'guardian' || itemSender === guardianUserId;

  const otherUserReadBy = otherUserStatus
    ? {
        seen: otherUserStatus.read_at !== null,
        seenAt: otherUserStatus.read_at,
      }
    : null;

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
          {item?.body}
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
            {getMessageTime(item?.created_at)}
          </Text>

          {isCurrentUser && (
            <MessageStatusIcon
              status={item?.status || 'sent'}
              isSeen={otherUserReadBy?.seen === true}
              isBlocked={isBlockedYou}
              wasSentWhileBlocked={false}
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
            Sent {getTimeAgo(item?.created_at)}
          </Text>

          {otherUserReadBy?.seen && otherUserReadBy?.seenAt ? (
            <Text style={Styles.messageTime}>
              Seen {getTimeAgo(otherUserReadBy.seenAt)}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

export default MessageBubble;
