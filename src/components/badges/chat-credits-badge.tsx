import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { hp, wp } from '../../global';
import { Colors, Fonts } from '../../res';
import Text from '../Text';

type ChatCreditsBadgeProps = {
  credits: number | null | undefined;
  onPress?: () => void;
  disabled?: boolean;
};

function ChatCreditsBadge({
  credits,
  onPress,
  disabled = false,
}: ChatCreditsBadgeProps) {
  if (credits === undefined || credits === null) {
    return null;
  }

  const badgeContent = (
    <View style={Styles.container}>
      <Ionicons name="sparkles" size={wp(4)} color={Colors.primary} />
      <Text style={Styles.creditsText}>{credits?.toString()}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Ripple
        style={Styles.rippleContainer}
        onPress={onPress}
        disabled={disabled}
      >
        {badgeContent}
      </Ripple>
    );
  }

  return <View style={Styles.rippleContainer}>{badgeContent}</View>;
}

export default ChatCreditsBadge;

const Styles = StyleSheet.create({
  rippleContainer: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.2),
    backgroundColor: Colors.lavender,
    paddingHorizontal: wp(2.8),
    paddingVertical: hp(0.5),
    borderRadius: 999,
  },
  creditsText: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_B,
    fontSize: wp(3.6),
    includeFontPadding: false,
    alignSelf: 'center',
  },
});
