import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

import ChatCoinIcon from '../../assets/svgs/coins/chat-coin.svg';
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
      <View style={Styles.iconContainer}>
        <ChatCoinIcon width={wp(6)} height={wp(6)} />
      </View>
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
    borderRadius: wp(4),
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.theme,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: wp(4),
  },
  iconContainer: {
    marginRight: wp(1.5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  creditsText: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_B,
    fontSize: wp(4),
    includeFontPadding: false,
  },
});
