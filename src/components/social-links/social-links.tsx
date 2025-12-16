import React from 'react';
import { Image, Linking, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

import { Images } from '../../res';

type SocialLink = {
  url: string;
  icon: number;
};

const socialLinks: SocialLink[] = [
  {
    url: 'https://www.facebook.com/purehalfofficial',
    icon: Images.facebookIcon,
  },
  {
    url: 'https://www.instagram.com/purehalfofficial',
    icon: Images.instagramIcon,
  },
  {
    url: 'https://www.tiktok.com/@purehalfofficial',
    icon: Images.tiktokIcon,
  },
  {
    url: 'https://www.youtube.com/@purehalfofficial',
    icon: Images.youtubeIcon,
  },
  {
    url: 'https://purehalf.com/',
    icon: Images.websiteIcon,
  },
  {
    url: 'https://whatsapp.com/channel/0029Va8AMdt8vd1MeOSlPH25',
    icon: Images.whatsappIcon,
  },
];

function SocialLinks() {
  const handlePress = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={Styles.container}>
      {socialLinks.map((link, index) => (
        <Ripple key={index} onPress={() => handlePress(link.url)}>
          <Image source={link.icon} resizeMode="contain" style={Styles.icon} />
        </Ripple>
      ))}
    </View>
  );
}

export default SocialLinks;

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
});

