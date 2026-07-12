import React from 'react';
import { FlatList, StyleSheet, Text as ReactText, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { LinearGradient, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl } from '../../languages';
import { Colors, Fonts } from '../../res';
import { usePremiumStore } from '../../stores';

const OptionsBar = (props: any) => {
  const {
    userStats = {},
    options = [],
    activeOptionButton = {},
    onPress = () => null,
  } = props;
  const Rtl = CheckRtl();
  const isPremium = usePremiumStore((state) => state.isPremium);
  const premiumLoaded = usePremiumStore((state) => state.loaded);
  const isPremiumUser = isPremium();

  const RenderBtn = ({ item }: any) => {
    const { name, value } = item;
    const isActive = activeOptionButton.value === value;
    // Liked-you ('1') and Visitors ('3') are premium-gated in Welcome.onOptionPress
    const isPaid = value === '1' || value === '3';
    const isLocked = isPaid && premiumLoaded && !isPremiumUser;
    const isPremiumFeature = isPaid && isPremiumUser;
    const isGoldPremiumCta = isPremiumFeature;
    const counter =
      value === '1'
        ? userStats?.like_you_counter
        : value === '3'
          ? userStats?.visit_you_counter
          : 0;
    const showCounter = !isLocked && counter && counter > 0;

    return (
      <Ripple
        rippleColor={isPremiumFeature ? Colors.color20 : Colors.primary}
        style={[
          Styles.pill,
          isPremiumFeature && Styles.premiumPill,
          isGoldPremiumCta && Styles.premiumPillGold,
          isPremiumFeature && isActive && Styles.premiumPillActive,
          {
            backgroundColor: isGoldPremiumCta
              ? 'transparent'
              : isActive
                ? Colors.primary
                : Colors.lavender,
            flexDirection: Rtl ? 'row-reverse' : 'row',
          },
        ]}
        onPress={onPress.bind(null, item)}
      >
        {isGoldPremiumCta ? (
          <LinearGradient
            colors={isActive ? ['#F0C974', '#D99A32'] : ['#F8E4B1', '#E8B45A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            pointerEvents="none"
            style={Styles.premiumGoldGradient}
          />
        ) : null}
        {showCounter ? (
          <View
            style={[
              Styles.countBubble,
              {
                backgroundColor: Colors.attention,
                marginLeft: Rtl ? wp(1.2) : 0,
                marginRight: Rtl ? 0 : wp(1.2),
              },
            ]}
          >
            <ReactText
              style={[Styles.countTxt, { color: Colors.surface }]}
              numberOfLines={1}
            >
              {counter > 99 ? '99+' : counter}
            </ReactText>
          </View>
        ) : null}
        <Text
          style={{
            ...Styles.pillTxt,
            color: isGoldPremiumCta
              ? Colors.ink
              : isActive
                ? Colors.surface
                : Colors.muted,
            fontFamily:
              isActive || isPremiumFeature ? Fonts.APPFONT_SB : Fonts.APPFONT_M,
          }}
        >
          {name}
        </Text>
        {isLocked ? (
          <Ionicons
            name="lock-closed"
            size={wp(3.1)}
            color={isActive ? Colors.surface : Colors.primaryMid}
            style={{
              marginLeft: Rtl ? 0 : wp(1.1),
              marginRight: Rtl ? wp(1.1) : 0,
            }}
          />
        ) : null}
      </Ripple>
    );
  };

  return (
    <View style={Styles.container}>
      <FlatList
        data={options}
        renderItem={RenderBtn}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        inverted={Rtl}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={Styles.listContent}
      />
    </View>
  );
};

export default OptionsBar;

const Styles = StyleSheet.create({
  container: {
    marginTop: hp(1.6),
  },
  listContent: {
    paddingHorizontal: wp(3),
    gap: wp(1.6),
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    height: hp(4.2),
    paddingHorizontal: wp(2.8),
    borderRadius: 999,
  },
  premiumPill: {
    borderWidth: 1,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 3,
  },
  premiumPillGold: {
    borderColor: '#E0A848',
    shadowColor: Colors.color37,
    overflow: 'hidden',
  },
  premiumPillActive: {
    borderColor: Colors.color20,
  },
  premiumGoldGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  pillTxt: {
    fontSize: Typography.small,
    includeFontPadding: false,
    alignSelf: 'center',
    textAlignVertical: 'center',
  },
  countBubble: {
    minWidth: wp(5.4),
    height: wp(5.4),
    borderRadius: wp(2.7),
    paddingHorizontal: wp(1),
    justifyContent: 'center',
    alignItems: 'center',
  },
  countTxt: {
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.tiny1,
    includeFontPadding: false,
  },
});
