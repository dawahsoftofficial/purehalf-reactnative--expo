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

const MessageStatusIcon = ({
  status,
  isSeen,
  isBlocked,
  wasSentWhileBlocked,
}: Props) => {
  // If seen, show double tick blue (preserve seen status even if blocked)
  if (isSeen) {
    return (
      <Ionicons
        name="checkmark-done"
        color="#0084FF"
        size={wp(4)}
        style={{ marginLeft: wp(0.5) }}
      />
    );
  }

  // If message was sent while blocked and not seen, show single tick only (gray)
  // This preserves the single tick even after unblocking
  if (wasSentWhileBlocked) {
    return (
      <Ionicons
        name="checkmark"
        color={Colors.color34}
        size={wp(4)}
        style={{ marginLeft: wp(0.5) }}
      />
    );
  }

  // If currently blocked and not seen, show single tick only (gray)
  if (isBlocked) {
    return (
      <Ionicons
        name="checkmark"
        color={Colors.color34}
        size={wp(4)}
        style={{ marginLeft: wp(0.5) }}
      />
    );
  }

  // If sent (delivered but not seen), show double tick gray
  if (status === 'sent') {
    return (
      <Ionicons
        name="checkmark-done"
        color={Colors.color34}
        size={wp(4)}
        style={{ marginLeft: wp(0.5) }}
      />
    );
  }

  // If sending, show single tick (gray)
  if (status === 'sending') {
    return (
      <Ionicons
        name="checkmark"
        color={Colors.color34}
        size={wp(4)}
        style={{ marginLeft: wp(0.5) }}
      />
    );
  }

  // Default: single tick (gray) - for failed or unknown status
  return (
    <Ionicons
      name="checkmark"
      color={Colors.color34}
      size={wp(4)}
      style={{ marginLeft: wp(0.5) }}
    />
  );
};

export default MessageStatusIcon;
