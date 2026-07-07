import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { wp } from '../../../global';
import { Colors } from '../../../res';
import messageServices from '../../../services/api/message-services';
import chatAudioService from '../../../services/audio/chat-audio-service';
import { getMessageTime } from '../SingleChat.utils';
import MessageStatusIcon from './MessageStatusIcon';

type Props = {
  item: any;
  isCurrentUser: boolean;
  textColour: string;
  isRead: boolean;
  messageStatus: 'sending' | 'sent';
  isBlockedYou: boolean;
  Styles: any;
};

const formatDuration = (seconds?: number) => {
  const safeSeconds = Math.max(0, seconds || 0);
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const AudioMessageBubble = ({
  item,
  isCurrentUser,
  textColour,
  isRead,
  messageStatus,
  isBlockedYou,
  Styles,
}: Props) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const onPlayPress = async () => {
    try {
      if (isPlaying) {
        await chatAudioService.stopPlayback();
        setIsPlaying(false);
        return;
      }

      const sourceUrl =
        item.local_uri ||
        (await messageServices.getMessageAudioUrl(item.id)).url;
      setIsPlaying(true);
      await chatAudioService.play(sourceUrl, () => setIsPlaying(false));
    } catch (error) {
      // Reset UI if fetching the URL or starting playback fails.
      setIsPlaying(false);
    }
  };

  return (
    <>
      <View style={Styles.audioBubbleContent}>
        <TouchableOpacity style={Styles.audioPlayButton} onPress={onPlayPress}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={wp(4)}
            color={Colors.primary}
          />
        </TouchableOpacity>
        <View style={Styles.audioWaveTrack}>
          {Array.from({ length: 12 }).map((_, index) => (
            <View
              key={index}
              style={[
                Styles.audioWaveBar,
                {
                  height: wp(1.4 + (index % 4) * 0.9),
                  backgroundColor: textColour,
                },
              ]}
            />
          ))}
        </View>
        <Text style={[Styles.audioDuration, { color: textColour }]}>
          {formatDuration(
            item.audio?.duration_seconds || item.duration_seconds
          )}
        </Text>
      </View>

      <View style={Styles.messageTimeAndStatusWrapper}>
        <Text style={[Styles.messageTimeInline, { color: textColour }]}>
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
  );
};

export default AudioMessageBubble;
