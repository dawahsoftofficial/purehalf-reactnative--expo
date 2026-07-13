import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Button, Text } from '../../../components';
import { hp, Typography, wp } from '../../../global';
import { Colors, Fonts } from '../../../res';

type PermissionBlockedModalProps = {
  // Opens the OS app-settings page so the user can flip the permission on.
  onOpenSettings: () => void;
  // Dismisses the guidance without leaving the app.
  onDismiss: () => void;
};

// Shown when location permission is hard-blocked (Android "Don't allow" /
// never_ask_again). The OS won't prompt again, so we can't silently recover —
// this card tells the user exactly where to go and gives them a one-tap route.
function PermissionBlockedModal({
  onOpenSettings,
  onDismiss,
}: PermissionBlockedModalProps) {
  return (
    <View style={Styles.overlay}>
      <View style={Styles.card}>
        <View style={Styles.iconChip}>
          <Ionicons
            name="location-outline"
            color={Colors.primary}
            size={wp(8)}
          />
        </View>

        <Text style={Styles.title}>Location permission is off</Text>

        <Text style={Styles.body}>
          You previously blocked location access, so we can’t find matches near
          you. Open Settings, allow the Location permission, then return and tap
          Try Again.
        </Text>

        <Button
          buttonStyle={Styles.primaryBtn}
          text="Open Settings"
          onPress={onOpenSettings}
        />

        <Ripple style={Styles.dismissBtn} onPress={onDismiss}>
          <Text style={Styles.dismissText}>Not now</Text>
        </Ripple>
      </View>
    </View>
  );
}

export default memo(PermissionBlockedModal);

const Styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.hairline,
    paddingHorizontal: wp(6),
    paddingTop: hp(3),
    paddingBottom: hp(2.5),
    alignItems: 'center',
  },
  iconChip: {
    width: wp(16),
    height: wp(16),
    borderRadius: wp(8),
    backgroundColor: Colors.primaryRGBA12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2),
  },
  title: {
    color: Colors.ink,
    textAlign: 'center',
    alignSelf: 'center',
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.medium,
    marginBottom: hp(1),
  },
  body: {
    color: Colors.muted,
    textAlign: 'center',
    alignSelf: 'center',
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    lineHeight: hp(2.6),
    marginBottom: hp(3),
  },
  primaryBtn: {
    width: '100%',
  },
  dismissBtn: {
    marginTop: hp(1.5),
    paddingVertical: hp(1),
    paddingHorizontal: wp(6),
    alignSelf: 'center',
  },
  dismissText: {
    color: Colors.muted,
    alignSelf: 'center',
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small2,
  },
});
