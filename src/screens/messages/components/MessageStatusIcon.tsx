import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { wp } from '../../../global';
import { Colors } from '../../../res';

type Props = {
  status: string;
  isSeen: boolean;
  isBlocked: boolean;
  wasSentWhileBlocked: boolean;
};

const ICON_STYLE = { marginLeft: wp(0.5) };

// Ticks always sit on the outgoing (violet) bubble, so the resting colour is a
// translucent white; a "read" receipt pops in a bright legible blue.
const SENT_COLOR = Colors.whiteRGBA90;
const READ_COLOR = Colors.color25;

const MessageStatusIcon = ({
  status,
  isSeen,
  isBlocked,
  wasSentWhileBlocked,
}: Props) => {
  // Read → blue double tick (preserved even if later blocked)
  if (isSeen) {
    return (
      <Ionicons
        name="checkmark-done"
        color={READ_COLOR}
        size={wp(4)}
        style={ICON_STYLE}
      />
    );
  }

  // Sent while blocked, or currently blocked, and not seen → single tick
  if (wasSentWhileBlocked || isBlocked) {
    return (
      <Ionicons
        name="checkmark"
        color={SENT_COLOR}
        size={wp(4)}
        style={ICON_STYLE}
      />
    );
  }

  // Delivered but not seen → double tick
  if (status === 'sent') {
    return (
      <Ionicons
        name="checkmark-done"
        color={SENT_COLOR}
        size={wp(4)}
        style={ICON_STYLE}
      />
    );
  }

  // Sending / unknown → single tick
  return (
    <Ionicons
      name="checkmark"
      color={SENT_COLOR}
      size={wp(4)}
      style={ICON_STYLE}
    />
  );
};

export default MessageStatusIcon;
