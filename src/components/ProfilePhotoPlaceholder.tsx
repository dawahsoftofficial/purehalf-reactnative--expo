import React from 'react';
import { type StyleProp, StyleSheet, Text, type ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { wp } from '../global';
import { Colors, Fonts } from '../res';

/**
 * Derive up to two initials from a display name.
 * "Arooj Rehman" -> "AR", "Arooj" -> "A". Falls back to "" for empty/
 * non-word names so the caller can render a neutral icon instead.
 */
const getInitials = (name?: string): string => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
};

interface Props {
  /** Display name used to build the monogram. */
  name?: string;
  /** Base size used to scale the monogram. Defaults to a full-card size. */
  size?: number;
  /** Round the outer fill (for grid/thumbnail cards). */
  rounded?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * On-brand fallback shown when a member has no profile photo (or it fails
 * to load). Minimal by design: a soft violet gradient with the member's
 * initials set in the display serif — no rings, no badge, just the letters.
 */
const ProfilePhotoPlaceholder = ({ name, size, rounded, style }: Props) => {
  const initials = getInitials(name);
  const base = size ?? wp(34);

  return (
    <LinearGradient
      colors={[Colors.primaryMid, Colors.primary, Colors.primaryPress]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[
        Styles.fill,
        // Lift the monogram slightly above true center so it sits in the
        // open space rather than colliding with the name/scrim below.
        { paddingBottom: base * 0.85 },
        rounded ? Styles.rounded : null,
        style,
      ]}
    >
      {initials ? (
        <Text style={[Styles.initials, { fontSize: base * 0.56 }]}>
          {initials}
        </Text>
      ) : (
        <Ionicons
          name="person-outline"
          size={base * 0.7}
          color={Colors.whiteRGBA90}
        />
      )}
    </LinearGradient>
  );
};

export default ProfilePhotoPlaceholder;

const Styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rounded: {
    borderRadius: 16,
  },
  initials: {
    color: Colors.color2,
    fontFamily: Fonts.DISPLAY,
    includeFontPadding: false,
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: Colors.blackRGBA25,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 14,
  },
});
