import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text } from 'react-native';
import Ripple from 'react-native-material-ripple';

import { hp, Typography, wp } from '../../../global';
import { Colors, Fonts } from '../../../res';

interface IcebreakerChipsProps {
  /** Called with the suggestion text when a chip is tapped. */
  onSelect: (text: string) => void;
  rtl: boolean;
}

/**
 * Tappable conversation-starter chips shown above the input while a chat is
 * brand new. Tapping fills the input (never auto-sends) so the sender stays
 * in control of the first words.
 */
const IcebreakerChips = ({ onSelect, rtl }: IcebreakerChipsProps) => {
  const { t }: any = useTranslation();

  const suggestions = [
    t('icebreakerOneText'),
    t('icebreakerTwoText'),
    t('icebreakerThreeText'),
    t('icebreakerFourText'),
  ].filter((text) => text && text !== 'not available');

  if (!suggestions.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        Styles.row,
        { flexDirection: rtl ? 'row-reverse' : 'row' },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {suggestions.map((text) => (
        <Ripple
          key={text}
          style={Styles.chip}
          rippleColor={Colors.lavender}
          onPress={() => onSelect(text)}
        >
          <Text style={Styles.chipText} numberOfLines={1}>
            {text}
          </Text>
        </Ripple>
      ))}
    </ScrollView>
  );
};

const Styles = StyleSheet.create({
  row: {
    paddingHorizontal: wp(4),
    paddingTop: hp(0.5),
  },
  chip: {
    backgroundColor: Colors.primaryRGBA12,
    borderRadius: 16,
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3.5),
    marginRight: wp(2),
  },
  chipText: {
    fontSize: Typography.small,
    fontFamily: Fonts.APPFONT_R,
    color: Colors.primary,
    includeFontPadding: false,
  },
});

export default IcebreakerChips;
