import React, { memo, useCallback } from 'react';
import { Image, Linking, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

import { Images } from '../../res';

type SocialLink = {
  url: string;
  icon: number;
  label: string;
};

const socialLinks: SocialLink[] = [
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

function SocialLinks() {
  const handlePress = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {
      // No-op; best effort open
    });
  }, []);

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
