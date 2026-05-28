import React, { memo, useCallback, useMemo } from 'react';
import { Image, Linking, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

import { Images } from '../../res';
import { useSettingsStore } from '../../stores/settings-store';

type SocialLink = {
  url: string;
  icon: number;
  label: string;
};

// Map icon string from API to actual Images object
const getIconFromString = (iconString: string): number | null => {
  // Remove "Images." prefix if present
  const iconKey = iconString.replace('Images.', '');

  // Map icon key to Images object
  const iconMap: Record<string, number> = {
    facebookIcon: Images.facebookIcon,
    instagramIcon: Images.instagramIcon,
    tiktokIcon: Images.tiktokIcon,
    youtubeIcon: Images.youtubeIcon,
    websiteIcon: Images.websiteIcon,
    whatsappIcon: Images.whatsappIcon,
    PrivacyPolicy: Images.privacy,
    TermsAndConditions: Images.document,
    DeleteAccount: Images.delete,
    HelpAndSupport: Images.needHelp,
    ContactUs: Images.email,
  };

  return iconMap[iconKey] || null;
};

function SocialLinks() {
  const appLinks = useSettingsStore((state) => state.getAppLinks());

  // Filter to only show social media links (exclude settings pages)
  const socialLinks = useMemo(() => {
    if (!appLinks || appLinks.length === 0) {
      // Fallback to default links if settings not loaded
      return [
        {
          url: 'https://www.facebook.com/purehalfofficial',
          icon: Images.facebookIcon,
          label: 'Facebook',
        },
        {
          url: 'https://www.instagram.com/purehalfofficial',
          icon: Images.instagramIcon,
          label: 'Instagram',
        },
        {
          url: 'https://www.tiktok.com/@purehalfofficial',
          icon: Images.tiktokIcon,
          label: 'TikTok',
        },
        {
          url: 'https://www.youtube.com/@purehalfofficial',
          icon: Images.youtubeIcon,
          label: 'YouTube',
        },
        {
          url: 'https://purehalf.com/',
          icon: Images.websiteIcon,
          label: 'Website',
        },
        {
          url: 'https://whatsapp.com/channel/0029Va8AMdt8vd1MeOSlPH25',
          icon: Images.whatsappIcon,
          label: 'WhatsApp',
        },
      ];
    }

    // Filter to only social media links (exclude PrivacyPolicy, TermsAndConditions, etc.)
    const socialMediaLabels = [
      'Facebook',
      'Instagram',
      'TikTok',
      'YouTube',
      'Website',
      'WhatsApp',
    ];

    return appLinks
      .filter((link) => socialMediaLabels.includes(link.label))
      .map((link) => {
        const icon = getIconFromString(link.icon);
        return {
          url: link.url,
          icon: icon || Images.websiteIcon, // Fallback icon
          label: link.label,
        };
      })
      .filter((link) => link.icon !== null) as SocialLink[];
  }, [appLinks]);

  const handlePress = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {
      // No-op; best effort open
    });
  }, []);

  if (socialLinks.length === 0) {
    return null;
  }

  return (
    <View style={Styles.container}>
      {socialLinks.map((link) => (
        <Ripple
          key={link.url}
          onPress={() => handlePress(link.url)}
          hitSlop={Styles.hitSlop}
          accessibilityRole="link"
          accessibilityLabel={link.label}
        >
          <Image source={link.icon} resizeMode="contain" style={Styles.icon} />
        </Ripple>
      ))}
    </View>
  );
}

export default memo(SocialLinks);

const Styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 10,
    paddingTop: 30,
    flex: 1,
  },
  icon: {
    width: 35,
    height: 35,
  },
  hitSlop: {
    top: 6,
    bottom: 6,
    left: 6,
    right: 6,
  },
});
