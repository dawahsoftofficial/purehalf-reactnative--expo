/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
import { isFieldFilled } from './profile-editor-flow';

export type GroupMeta = { key: string; title: string; icon: string };

export const GROUP_META: GroupMeta[] = [
  {
    key: 'appearanceAndHealth',
    title: LanguageKeys.appearanceHealth,
    icon: 'body-outline',
  },
  {
    key: 'familyBackground',
    title: LanguageKeys.familyBackground,
    icon: 'earth-outline',
  },
  {
    key: 'lifeStyle',
    title: LanguageKeys.lifeStyle,
    icon: 'briefcase-outline',
  },
  {
    key: 'islamicValues',
    title: LanguageKeys.islamicValues,
    icon: 'moon-outline',
  },
  {
    key: 'personalityRequirements',
    title: LanguageKeys.personalityRequirements,
    icon: 'sparkles-outline',
  },
  {
    key: 'futurePlan',
    title: LanguageKeys.futurePlans,
    icon: 'heart-circle-outline',
  },
];

const isHidden = (item: any, gender?: string) => {
  const isMale = gender !== 'female';
  return (
    (item?.id === 'doYouHaveABeard' && !isMale) ||
    (item?.id === 'hijab-0' && isMale)
  );
};

export const countFilled = (group: any[], gender?: string) => {
  let filled = 0;
  let total = 0;
  (group ?? []).forEach((item) => {
    if (isHidden(item, gender)) return;
    total += 1;
    if (isFieldFilled(item)) filled += 1;
  });
  return { filled, total };
};

const previewOf = (group: any[], gender?: string) => {
  const values: string[] = [];
  (group ?? []).forEach((item) => {
    if (isHidden(item, gender) || !isFieldFilled(item)) return;
    if (item?.type === 'dropDownBinary') return;
    const sel = item?.selected ?? {};
    let display: any;
    if (item?.type === 'scalling') {
      display = `${sel.value}${sel.scale ? ' ' + sel.scale : ''}`;
    } else {
      display = sel.value;
    }
    if (typeof display === 'number') display = String(display);
    if (typeof display === 'string' && display.trim().length) {
      values.push(display.trim());
    }
  });
  return values.slice(0, 3).join(' · ');
};

export const computeCompletion = ({
  categoriesData,
  interests,
  tagline,
  gender,
}: {
  categoriesData: any;
  interests: any[];
  tagline?: string;
  gender?: string;
}) => {
  let filled = 0;
  let total = 0;
  GROUP_META.forEach((g) => {
    const c = countFilled(categoriesData?.[g.key], gender);
    filled += c.filled;
    total += c.total;
  });
  total += 1;
  if ((interests ?? []).some((i) => i?.selected)) filled += 1;
  total += 1;
  if (tagline && tagline.trim().length) filled += 1;
  return total ? Math.round((filled / total) * 100) : 0;
};

export const SectionLabel = memo(function SectionLabel({
  label,
}: {
  label: string;
}) {
  return <Text style={Styles.sectionLabel}>{label}</Text>;
});

export const CompletionCard = memo(function CompletionCard({
  percent,
}: {
  percent: number;
}) {
  return (
    <View style={Styles.completionCard}>
      <View style={Styles.completionTop}>
        <Text style={Styles.completionTitle}>
          {LanguageKeys.profileStrength}
        </Text>
        <Text style={Styles.completionPct}>{`${percent}%`}</Text>
      </View>
      <View style={Styles.track}>
        <View style={[Styles.trackFill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
});

type InterestsPreviewProps = {
  interests: any[];
  onEdit: () => void;
};

export const InterestsPreview = memo(function InterestsPreview({
  interests,
  onEdit,
}: InterestsPreviewProps) {
  const selected = (interests ?? []).filter((i) => i?.selected).slice(0, 8);
  return (
    <View style={Styles.card}>
      <View style={Styles.cardHead}>
        <Text style={Styles.cardHeadTxt}>
          {LanguageKeys.myInterestAndHobbies}
        </Text>
        <Ripple onPress={onEdit} style={Styles.editLink}>
          <Text style={Styles.editLinkTxt}>{LanguageKeys.update}</Text>
        </Ripple>
      </View>
      {selected.length > 0 ? (
        <View style={Styles.pills}>
          {selected.map((i) => (
            <View key={i?.id} style={Styles.pill}>
              <Text style={Styles.pillTxt}>{i?.value}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Ripple onPress={onEdit} style={Styles.addRow}>
          <Ionicons name="add" size={wp(4.5)} color={Colors.primary} />
          <Text style={Styles.addTxt}>{LanguageKeys.tapToAdd}</Text>
        </Ripple>
      )}
    </View>
  );
});

type DetailSectionListProps = {
  categoriesData: any;
  gender?: string;
  onOpenGroup: (group: GroupMeta) => void;
};

export const DetailSectionList = memo(function DetailSectionList({
  categoriesData,
  gender,
  onOpenGroup,
}: DetailSectionListProps) {
  return (
    <View style={Styles.card}>
      {GROUP_META.map((g, index) => {
        const group = categoriesData?.[g.key];
        const { filled, total } = countFilled(group, gender);
        const preview = previewOf(group, gender);
        return (
          <Ripple
            key={g.key}
            onPress={() => onOpenGroup(g)}
            style={[Styles.row, index > 0 && Styles.rowDivider]}
          >
            <View style={Styles.iconChip}>
              <Ionicons name={g.icon} size={wp(5)} color={Colors.primary} />
            </View>
            <View style={Styles.rowText}>
              <Text style={Styles.rowTitle}>{g.title}</Text>
              <Text style={Styles.rowPreview} numberOfLines={1}>
                {preview.length > 0 ? preview : LanguageKeys.tapToAdd}
              </Text>
            </View>
            {total > 0 ? (
              <View
                style={[
                  Styles.countPill,
                  filled === total && Styles.countPillDone,
                ]}
              >
                <Text
                  style={[
                    Styles.countTxt,
                    filled === total && Styles.countTxtDone,
                  ]}
                >
                  {`${filled}/${total}`}
                </Text>
              </View>
            ) : null}
            <Ionicons
              name="chevron-forward"
              size={wp(5)}
              color={Colors.primaryLite}
            />
          </Ripple>
        );
      })}
    </View>
  );
});

const Styles = StyleSheet.create({
  sectionLabel: {
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.tiny1,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginTop: hp(2.5),
    marginBottom: hp(1),
    marginHorizontal: wp(5),
  },
  completionCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 16,
    padding: wp(4),
    marginHorizontal: wp(4),
    marginTop: hp(1),
  },
  completionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.2),
  },
  completionTitle: {
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small2,
    color: Colors.ink,
  },
  completionPct: {
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small3,
    color: Colors.primary,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.lavender,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 16,
    marginHorizontal: wp(4),
    overflow: 'hidden',
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingTop: hp(1.6),
    paddingBottom: hp(0.5),
  },
  cardHeadTxt: {
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small3,
    color: Colors.ink,
  },
  editLink: {
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(1),
  },
  editLinkTxt: {
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small1,
    color: Colors.primary,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    paddingHorizontal: wp(4),
    paddingBottom: hp(1.8),
    paddingTop: hp(0.5),
  },
  pill: {
    backgroundColor: Colors.lavender,
    borderRadius: 999,
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3),
  },
  pillTxt: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small1,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    paddingHorizontal: wp(4),
    paddingBottom: hp(1.8),
    paddingTop: hp(0.5),
  },
  addTxt: {
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    paddingVertical: hp(1.6),
    paddingHorizontal: wp(4),
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  iconChip: {
    width: wp(9.5),
    height: wp(9.5),
    borderRadius: 11,
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small2,
    color: Colors.ink,
  },
  rowPreview: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small1,
    color: Colors.muted,
    marginTop: hp(0.2),
  },
  countPill: {
    backgroundColor: Colors.lavender,
    borderRadius: 999,
    paddingVertical: hp(0.3),
    paddingHorizontal: wp(2.2),
  },
  countPillDone: {
    backgroundColor: 'rgba(46,158,91,0.12)',
  },
  countTxt: {
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.tiny1,
    color: Colors.primary,
  },
  countTxtDone: {
    color: Colors.verified,
  },
});
