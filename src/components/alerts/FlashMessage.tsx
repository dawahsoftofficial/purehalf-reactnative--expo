import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  type FlashMessageProps,
  showMessage,
} from 'react-native-flash-message';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { hp, Typography, wp } from '../../global';
import { Colors, Fonts } from '../../res';

interface FlashMsgProps extends FlashMessageProps {
  top?: number;
}

type ToastKind = 'success' | 'danger' | 'info';

const TYPE_CONFIG: Record<
  ToastKind,
  { accent: string; soft: string; icon: string }
> = {
  success: {
    accent: Colors.verified,
    soft: 'rgba(46,158,91,0.12)',
    icon: 'checkmark-circle',
  },
  danger: {
    accent: '#D64545',
    soft: 'rgba(214,69,69,0.12)',
    icon: 'alert-circle',
  },
  info: {
    accent: Colors.primary,
    soft: Colors.primaryRGBA12,
    icon: 'information-circle',
  },
};

const resolveKind = (type?: string): ToastKind => {
  if (type === 'success') return 'success';
  if (type === 'danger') return 'danger';
  return 'info';
};

// react-native-flash-message renders a function passed as `icon.icon` directly,
// which lets us drop in a fully branded icon chip instead of the library default.
const makeIcon = (kind: ToastKind) => {
  const conf = TYPE_CONFIG[kind];
  const ToastIcon = () => (
    <View style={[Styles.iconChip, { backgroundColor: conf.soft }]}>
      <Ionicons name={conf.icon} color={conf.accent} size={wp(5)} />
    </View>
  );
  ToastIcon.displayName = 'ToastIcon';
  return ToastIcon;
};

const FlashMessageFun = (props: FlashMsgProps) => {
  const { top, type, message, ...rest } = props;
  const kind = resolveKind(type as string);
  const conf = TYPE_CONFIG[kind];

  return showMessage({
    message: (message as string) ?? '',
    duration: kind === 'danger' ? 4000 : 3000,
    ...rest,
    // Neutralise the library's built-in type colouring so our card styling wins.
    type: 'default',
    floating: true,
    position: 'top',
    backgroundColor: Colors.surface,
    color: Colors.ink,
    // Passing a function component as `icon` is wrapped into a left-positioned
    // icon by the library's parseIcon() — this is our branded icon chip.
    icon: makeIcon(kind),
    style: {
      ...Styles.card,
      borderLeftColor: conf.accent,
      marginTop: hp(top ?? 0.5),
    },
    titleStyle: Styles.title,
    textStyle: Styles.description,
    hideStatusBar: false,
  });
};

export default FlashMessageFun;

const Styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginHorizontal: wp(4),
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3.5),
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderLeftWidth: 4,
    alignItems: 'center',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 8,
  },
  iconChip: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  title: {
    color: Colors.ink,
    includeFontPadding: false,
    fontSize: Typography.small2,
    fontFamily: Fonts.APPFONT_SB,
    lineHeight: hp(2.5),
    flexShrink: 1,
  },
  description: {
    color: Colors.muted,
    includeFontPadding: false,
    fontSize: Typography.small,
    fontFamily: Fonts.APPFONT_R,
  },
});
