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
  getMessageParticipantStatus,
  getMessageTime,
  getTimeAgo,
  hasDeliveredOrReadAt,
  hasReadAt,
} from '../SingleChat.utils';
import AudioMessageBubble, {
  type AudioBubblePlayback,
} from './AudioMessageBubble';
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
  getAudioPlayback: (messageId: number) => AudioBubblePlayback;
  onToggleAudioPlayback: (item: any) => void;

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
  getAudioPlayback,
  onToggleAudioPlayback,
  Styles,
}: Props) => {
  // Use sender_id from API response (new structure)
  // Convert to string for comparison as currentUserId might be string
  const itemSender = item?.sender_id != null ? String(item.sender_id) : null;
  const currentUserIdStr = currentUserId != null ? String(currentUserId) : null;

  // Get status for the other user (recipient) from statuses array
  const otherUserStatus = getMessageParticipantStatus(item, otherUserId);

  const isCurrentUser = itemSender === currentUserIdStr;
  const isGuardian = itemSender === 'guardian' || itemSender === guardianUserId;

  // Determine message status based on delivered_at and read_at
  // Priority: read_at > delivered_at > sending
  // Note: MessageStatusIcon uses isSeen prop for read status (blue double tick)
  const getMessageStatus = (): 'sending' | 'sent' => {
    // For messages from current user, check the other user's status
    if (isCurrentUser && otherUserStatus) {
      // If delivered or read, show as 'sent' (MessageStatusIcon will show appropriate icon based on isSeen)
      if (hasDeliveredOrReadAt(otherUserStatus)) {
        return 'sent';
      }
      // If status exists but both delivered_at and read_at are null, show as 'sending' (single tick)
      return 'sending';
    }
    // For messages being sent or if status is not available
    return item?.status === 'sending' ? 'sending' : 'sent';
  };

  const messageStatus = getMessageStatus();
  // isRead should only be true if read_at is explicitly not null
  const isRead = hasReadAt(otherUserStatus);

  const otherUserReadBy = otherUserStatus
    ? {
        seen: isRead,
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
    ? Colors.primary
    : isGuardian
      ? Colors.primaryMid
      : Colors.lavender;

  const textColour = isGuardian || isCurrentUser ? Colors.color2 : Colors.ink;

  // Asymmetric "tail" corner on the side the bubble is aligned to.
  const tailStyle = isCurrentUser
    ? { borderBottomRightRadius: 6 }
    : { borderBottomLeftRadius: 6 };

  return (
    <View
      key={item?.id}
      style={{
        marginTop: hp(1),
        alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
      }}
    >
      <TouchableOpacity
        style={[Styles.messageCon, tailStyle, { backgroundColor }]}
        onPress={() => onMessagePress(item?.id)}
        activeOpacity={0.9}
      >
        {item?.type === 'audio' ? (
          <AudioMessageBubble
            item={item}
            isCurrentUser={isCurrentUser}
            textColour={textColour}
            isRead={isRead}
            messageStatus={messageStatus}
            isBlockedYou={isBlockedYou}
            playback={getAudioPlayback(item.id)}
            onTogglePlayback={onToggleAudioPlayback}
            Styles={Styles}
          />
        ) : (
          <>
            <Text style={[Styles.messageTxt, { color: textColour }]}>
              {item?.body}
            </Text>

            <View style={Styles.messageTimeAndStatusWrapper}>
              <Text
                style={[
                  Styles.messageTimeInline,
                  {
                    color:
                      isCurrentUser || isGuardian
                        ? Colors.whiteRGBA90
                        : Colors.muted,
                  },
                ]}
              >
                {getMessageTime(item?.created_at)}
              </Text>

              {isCurrentUser && (
                <MessageStatusIcon
                  status={messageStatus}
                  isSeen={isRead}
                  isBlocked={isBlockedYou}
                  wasSentWhileBlocked={false}
                />
              )}
            </View>
          </>
        )}
      </TouchableOpacity>

      {isCurrentUser && item?.status === 'sending' && (
        <View style={Styles.messageSendingCon}>
          <ActivityIndicator
            color={Colors.primary}
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
