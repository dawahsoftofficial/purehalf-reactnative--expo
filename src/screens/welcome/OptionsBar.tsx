import React from 'react';
import { FlatList, StyleSheet, Text as ReactText, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Text } from '../../components';
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
    const counter =
      value === '1'
        ? userStats?.like_you_counter
        : value === '3'
          ? userStats?.visit_you_counter
          : 0;
    const showCounter = !isLocked && counter && counter > 0;

    return (
      <Ripple
        rippleColor={Colors.primary}
        style={[
          Styles.pill,
          {
            backgroundColor: isActive ? Colors.primary : Colors.lavender,
            flexDirection: Rtl ? 'row-reverse' : 'row',
          },
        ]}
        onPress={onPress.bind(null, item)}
      >
        <Text
          style={{
            ...Styles.pillTxt,
            color: isActive ? Colors.surface : Colors.muted,
            fontFamily: isActive ? Fonts.APPFONT_SB : Fonts.APPFONT_M,
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
        ) : showCounter ? (
          <View
            style={[
              Styles.countBubble,
              {
                backgroundColor: isActive ? Colors.surface : Colors.primary,
                marginLeft: Rtl ? 0 : wp(1.2),
                marginRight: Rtl ? wp(1.2) : 0,
              },
            ]}
          >
            <ReactText
              style={[
                Styles.countTxt,
                { color: isActive ? Colors.primary : Colors.surface },
              ]}
              numberOfLines={1}
            >
              {counter > 99 ? '99+' : counter}
            </ReactText>
          </View>
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
  pillTxt: {
    fontSize: Typography.small,
    includeFontPadding: false,
    alignSelf: 'center',
    textAlignVertical: 'center',
  },
  countBubble: {
    minWidth: wp(4.2),
    height: wp(4.2),
    borderRadius: wp(2.1),
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
