import React, { useCallback, useMemo } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Animation } from '../../animations';
import { Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import Constants from '../../global/Constants';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
import { hasRealProfileValue } from './info-card-values';

// One distinct icon per section, matching the "my profile" grouped list
// (GROUP_META in profile-hub) so the visitor screen and own screen read
// consistently instead of showing the same repeated placeholder icon.
const SECTION_ICONS: Record<string, string> = {
  [LanguageKeys.appearanceHealth]: 'body-outline',
  [LanguageKeys.familyBackground]: 'earth-outline',
  [LanguageKeys.lifeStyle]: 'briefcase-outline',
  [LanguageKeys.islamicValues]: 'moon-outline',
  [LanguageKeys.personalityRequirements]: 'sparkles-outline',
  [LanguageKeys.futurePlans]: 'heart-circle-outline',
};

type InfoItem = {
  id?: string;
  title?: string;
  type?: string;
  viewTitle?: string;
  selected?: {
    value?: number | string;
    scale?: string;
  };
};

type InfoCardProps = {
  data?: InfoItem[];
  headerHeading?: string;
  onEditPress?: (payload: { data: InfoItem[]; from: string }) => void;
  fromUserProfile?: boolean;
  from?: string;
  userData?: { gender?: string };
};

const InfoCard = ({
  data = [],
  headerHeading = '',
  onEditPress,
  fromUserProfile = false,
  from = '',
  userData,
}: InfoCardProps) => {
  const Rtl = CheckRtl();

  const isMale = useMemo(
    () => (userData?.gender === 'female' ? false : true),
    [userData?.gender]
  );

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const id = item?.id;
      if (id) {
        if (fromUserProfile) {
          if (
            (id === 'doYouHaveABeard' && isMale) ||
            (id === 'hijab-0' && !isMale)
          ) {
            return false;
          }
        } else if (
          (id === 'doYouHaveABeard' && !isMale) ||
          (id === 'hijab-0' && isMale)
        ) {
          return false;
        }
      }
      // On another member's profile, hide fields they haven't filled in.
      if (fromUserProfile && !hasRealProfileValue(item)) {
        return false;
      }
      return true;
    });
  }, [data, fromUserProfile, isMale]);

  const keyExtractor = useCallback(
    (item: InfoItem, index: number) => `${item?.id ?? index}-${index}`,
    []
  );

  // Normalises a stored answer into a display string: Yes/No for booleans,
  // "<n> <scale>" for height/weight, the raw string otherwise, with sensible
  // fallbacks ("None" for disabilities, "Not yet provided" when empty).
  const formatValue = useCallback((item: InfoItem) => {
    const value = item?.selected?.value;
    const scale = item?.selected?.scale ?? '';
    if (typeof value === 'number') {
      if (value === 1) return 'Yes';
      if (value === 0) return 'No';
      if (item?.id === 'height' || item?.id === 'weight') {
        return `${value.toFixed()} ${scale}`;
      }
      return value.toFixed();
    }
    if (typeof value === 'string' && value.length !== 0) {
      return value;
    }
    return item?.title === 'disabilities'
      ? LanguageKeys.none
      : LanguageKeys.notYetProvided;
  }, []);

  const sectionIcon = SECTION_ICONS[headerHeading] ?? 'ellipse-outline';

  const renderHeader = useMemo(
    () => (
      <View
        style={[
          Styles.headerLeft,
          { flexDirection: Rtl ? 'row-reverse' : 'row' },
        ]}
      >
        <View style={Styles.headerIconChip}>
          <Ionicons name={sectionIcon} size={wp(4.6)} color={Colors.primary} />
        </View>
        <Text variant="display" style={Styles.headerTxt}>
          {headerHeading}
        </Text>
      </View>
    ),
    [headerHeading, sectionIcon, Rtl]
  );

  const onEdit = useCallback(() => {
    if (onEditPress) {
      onEditPress({ data, from: headerHeading });
    }
  }, [data, headerHeading, onEditPress]);

  // Own-profile (editable) rows keep the compact two-column label/value look,
  // with long free-text stacked so paragraphs stay readable.
  const renderItem = useCallback(
    ({ item, index }: { item: InfoItem; index: number }) => {
      const formattedValue = formatValue(item);
      const title = item.title ?? '';
      const isLast = index === filteredData.length - 1;
      const textAlign = Rtl ? 'right' : 'left';
      const isParagraph =
        item?.type === 'input' &&
        typeof formattedValue === 'string' &&
        formattedValue.length > 24;

      if (isParagraph) {
        return (
          <View
            style={[
              Styles.stackedItemContainer,
              { borderBottomWidth: isLast ? 0 : 1 },
            ]}
          >
            <Text style={{ ...Styles.stackedHeading, textAlign }}>{title}</Text>
            <Text style={{ ...Styles.stackedValue, textAlign }}>
              {formattedValue}
            </Text>
          </View>
        );
      }

      return (
        <View
          style={[
            Styles.listItemContainer,
            {
              flexDirection: Rtl ? 'row-reverse' : 'row',
              borderBottomWidth: isLast ? 0 : 1,
            },
          ]}
        >
          <Text style={{ ...Styles.itemHeading, textAlign }}>{title}</Text>
          <Text style={{ ...Styles.itemValue, textAlign }}>
            {formattedValue}
          </Text>
        </View>
      );
    },
    [Rtl, filteredData.length, formatValue]
  );

  // Visitor view: a clean single-column list — each attribute's label sits
  // above its value, one after another, separated by a hairline. Long
  // free-text simply flows as a full-width paragraph. Never two columns.
  const renderVisitorList = useCallback(() => {
    const textAlign = Rtl ? 'right' : 'left';
    return (
      <View style={Styles.visitorList}>
        {filteredData.map((item, index) => {
          const value = formatValue(item);
          const label = item?.viewTitle ?? item?.title ?? '';
          const isLong =
            (item?.type === 'input' && value.length > 24) || value.length > 40;
          return (
            <View key={keyExtractor(item, index)} style={Styles.visitorRow}>
              <Text style={{ ...Styles.visitorLabel, textAlign }}>{label}</Text>
              <Text
                style={{
                  ...(isLong ? Styles.visitorValueLong : Styles.visitorValue),
                  textAlign,
                }}
              >
                {value}
              </Text>
            </View>
          );
        })}
      </View>
    );
  }, [Rtl, filteredData, formatValue, keyExtractor]);

  if (data.length === 0) {
    return <View />;
  }

  return (
    <Ripple
      onPress={onEdit}
      style={Styles.container}
      rippleColor={Colors.theme}
      disabled={fromUserProfile}
    >
      <View
        style={[
          Styles.headerContainer,
          { flexDirection: Rtl ? 'row-reverse' : 'row' },
        ]}
      >
        {renderHeader}
        {!fromUserProfile ? (
          <View style={Styles.editButton}>
            <Feather name="edit-2" color={Colors.color1} size={wp(4)} />
          </View>
        ) : null}
      </View>

      <Animation
        style={Styles.listContainer}
        animation={'fadeInDown'}
        duration={500}
      >
        {from === 'waliInformation' && fromUserProfile && data.length !== 0 ? (
          <Text style={Styles.waliInfoDes}>{LanguageKeys.moderatedByWali}</Text>
        ) : fromUserProfile && filteredData.length === 0 ? (
          <Text
            style={{
              ...Styles.emptyTxt,
              textAlign: Rtl ? 'right' : 'left',
            }}
          >
            {LanguageKeys.notYetProvided}
          </Text>
        ) : fromUserProfile ? (
          renderVisitorList()
        ) : (
          <ScrollView horizontal scrollEnabled={false}>
            <FlatList
              data={filteredData}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              scrollEnabled={false}
            />
          </ScrollView>
        )}
      </Animation>
    </Ripple>
  );
};

export default React.memo(InfoCard);

const Styles = StyleSheet.create({
  container: {
    marginHorizontal: wp(4),
    backgroundColor: Colors.surface,
    paddingTop: hp(1.8),
    borderRadius: 16,
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: Colors.hairline,
    overflow: 'hidden',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingBottom: hp(1),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2.5),
    flexShrink: 1,
  },
  headerIconChip: {
    width: wp(8.5),
    height: wp(8.5),
    borderRadius: wp(4.25),
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTxt: {
    color: Colors.ink,
    fontSize: Typography.medium1,
    marginBottom: Constants.fontFamilyMarginBottom,
    flexShrink: 1,
  },
  listContainer: {
    marginTop: hp(1),
  },
  // ---- Visitor list (single-column browse) ----
  visitorList: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(0.8),
  },
  visitorRow: {
    paddingVertical: hp(1.4),
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  visitorLabel: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small1,
    letterSpacing: 0.2,
    marginBottom: hp(0.6),
  },
  visitorValue: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small2,
  },
  visitorValueLong: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    lineHeight: wp(5.8),
  },
  // ---- Own-profile (editable) rows ----
  listItemContainer: {
    paddingHorizontal: wp(4),
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: wp(92),
    paddingVertical: hp(1.3),
    borderBottomColor: Colors.hairline,
  },
  stackedItemContainer: {
    width: wp(92),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.4),
    borderBottomColor: Colors.hairline,
  },
  stackedHeading: {
    width: wp(84),
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small1,
    marginBottom: hp(0.7),
  },
  stackedValue: {
    width: wp(84),
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small1,
    lineHeight: wp(5.4),
  },
  emptyTxt: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    includeFontPadding: false,
    paddingHorizontal: wp(4),
    paddingBottom: hp(1.4),
  },
  itemHeading: {
    width: wp(42),
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small1,
  },
  itemValue: {
    width: wp(38),
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small1,
  },
  waliInfoDes: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small3,
    includeFontPadding: false,
    marginTop: hp(-2),
    marginBottom: hp(2),
    marginHorizontal: wp(4),
  },
  editButton: {
    paddingVertical: hp(1),
    paddingHorizontal: wp(2),
    marginRight: wp(-2),
  },
});
