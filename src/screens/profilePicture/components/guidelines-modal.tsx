import React, { memo } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Button } from '../../../components';
import { hp, Typography, wp } from '../../../global';
import { Colors, Fonts, Images } from '../../../res';

type User = {
  gender?: string;
  [key: string]: unknown;
};

type GuidelinesModalProps = {
  visible: boolean;
  user: User | null;
  onClose: () => void;
};

const RULES = [
  {
    icon: 'sparkles-outline',
    text: 'Sharp and high quality — not blurry. Show your face and upper body, like a passport photo.',
  },
  {
    icon: 'happy-outline',
    text: 'Face the camera and keep your face clearly visible. No sunglasses or looking away.',
  },
  {
    icon: 'information-circle-outline',
    text: 'Tap the guidelines button on the photo screen anytime to see these tips again.',
  },
];

function GuidelinesModal({ visible, user, onClose }: GuidelinesModalProps) {
  const isFemale = user?.gender === 'female';

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
    >
      <SafeAreaView style={Styles.container} edges={['top', 'bottom']}>
        <View style={Styles.topBar}>
          <Text style={Styles.title}>Photo guidelines</Text>
          <Ripple
            style={Styles.closeChip}
            onPress={onClose}
            rippleContainerBorderRadius={999}
          >
            <Ionicons name="close" size={wp(5.5)} color={Colors.ink} />
          </Ripple>
        </View>

        <ScrollView
          contentContainerStyle={Styles.body}
          showsVerticalScrollIndicator={false}
        >
          <Text style={Styles.subtitle}>
            A good photo makes a strong first impression. Here&apos;s what
            works.
          </Text>

          <View style={Styles.compareRow}>
            <View style={Styles.compareCol}>
              <View style={[Styles.tag, Styles.tagGood]}>
                <Ionicons
                  name="checkmark-circle"
                  size={wp(4)}
                  color={Colors.verified}
                />
                <Text style={[Styles.tagText, Styles.tagTextGood]}>
                  Correct
                </Text>
              </View>
              <Image
                source={isFemale ? Images.rightPfpFemale : Images.rightPfp}
                resizeMode="cover"
                style={Styles.pfpImage}
              />
            </View>
            <View style={Styles.compareCol}>
              <View style={[Styles.tag, Styles.tagBad]}>
                <Ionicons
                  name="close-circle"
                  size={wp(4)}
                  color={Colors.color44}
                />
                <Text style={[Styles.tagText, Styles.tagTextBad]}>Avoid</Text>
              </View>
              <Image
                source={isFemale ? Images.wrongPFPFemale : Images.wrongPFP}
                resizeMode="cover"
                style={Styles.pfpImage}
              />
            </View>
          </View>

          <View style={Styles.rulesCard}>
            {RULES.map((rule, index) => (
              <View
                key={rule.icon}
                style={[Styles.ruleRow, index > 0 && Styles.ruleDivider]}
              >
                <View style={Styles.ruleIcon}>
                  <Ionicons
                    name={rule.icon}
                    size={wp(5)}
                    color={Colors.primary}
                  />
                </View>
                <Text style={Styles.ruleText}>{rule.text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={Styles.footer}>
          <Button text="Got it" onPress={onClose} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default memo(GuidelinesModal);

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(1.5),
  },
  title: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.large1,
  },
  closeChip: {
    width: wp(9.5),
    height: wp(9.5),
    borderRadius: wp(4.75),
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(2),
  },
  subtitle: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    lineHeight: wp(5.4),
    marginBottom: hp(2.5),
  },
  compareRow: {
    flexDirection: 'row',
    gap: wp(3),
  },
  compareCol: {
    flex: 1,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    alignSelf: 'flex-start',
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(2.5),
    borderRadius: 999,
    marginBottom: hp(1),
  },
  tagGood: {
    backgroundColor: 'rgba(46,158,91,0.12)',
  },
  tagBad: {
    backgroundColor: 'rgba(158,28,30,0.10)',
  },
  tagText: {
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small,
  },
  tagTextGood: {
    color: Colors.verified,
  },
  tagTextBad: {
    color: Colors.color44,
  },
  pfpImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: Colors.lavender,
  },
  rulesCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 16,
    paddingHorizontal: wp(4),
    marginTop: hp(2.5),
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(3),
    paddingVertical: hp(1.8),
  },
  ruleDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  ruleIcon: {
    width: wp(9),
    height: wp(9),
    borderRadius: 10,
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleText: {
    flex: 1,
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    lineHeight: wp(5.4),
  },
  footer: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(1.5),
  },
});
