import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { wp } from '../../../global';
import { Colors } from '../../../res';
import Styles from '../SingleChat.styles';

type Props = {
  elapsedSeconds: number;
  isSending: boolean;
  onCancel: () => void;
  onSend: () => void;
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const VoiceRecorderBar = ({
  elapsedSeconds,
  isSending,
  onCancel,
  onSend,
}: Props) => {
  return (
    <View style={Styles.voiceRecorderOuter}>
      <TouchableOpacity
        style={Styles.voiceCancelBtn}
        onPress={onCancel}
        disabled={isSending}
      >
        <Ionicons name="close" size={wp(4.6)} color={Colors.color2} />
      </TouchableOpacity>
      <Text style={Styles.voiceTimer}>{formatDuration(elapsedSeconds)}</Text>
      <View style={Styles.voiceWaveTrack}>
        {Array.from({ length: 16 }).map((_, index) => (
          <View
            key={index}
            style={[
              Styles.voiceWaveBar,
              { height: wp(1.2 + (index % 5) * 0.8) },
            ]}
          />
        ))}
      </View>
      <TouchableOpacity
        style={Styles.voiceSendBtn}
        onPress={onSend}
        disabled={isSending}
      >
        {isSending ? (
          <ActivityIndicator color={Colors.primary} size="small" />
        ) : (
          <Ionicons name="send" size={wp(4.6)} color={Colors.primary} />
        )}
      </TouchableOpacity>
    </View>
  );
};

export default VoiceRecorderBar;
