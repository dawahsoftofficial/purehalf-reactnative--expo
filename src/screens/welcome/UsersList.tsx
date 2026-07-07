import moment from 'moment';
import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text as ReactText,
  View,
} from 'react-native';
import Ripple from 'react-native-material-ripple';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Animation } from '../../animations';
import {
  LinearGradient,
  ProfileBadges,
  ProfilePhotoPlaceholder,
  Text,
} from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';

const { width } = Dimensions.get('window');
const CARD_W = (width - wp(6) - wp(3)) / 2;
const CARD_H = CARD_W * 1.42;

// Single grid card. Kept as its own component (not an inline renderItem) so it
// can hold per-card image-error state: a missing OR broken photo falls back to
// the on-brand monogram placeholder instead of a grey stock silhouette.
const UserCard = ({ item, rtl, onPress }: any) => {
  const [imageError, setImageError] = useState(false);

  const lastOnlineFromCurrentTime = parseInt(
    moment
      .duration(moment(new Date()).diff(moment(item?.last_online_at)))
      .asHours()
      .toFixed()
  );
  const isOnline = lastOnlineFromCurrentTime === 1;
  const locationText = [item?.city, item?.country].filter(Boolean).join(', ');
  const fullName = [item?.first_name, item?.last_name]
    .filter(Boolean)
    .join(' ');
  const showImage = Boolean(item?.primary_image_to_show) && !imageError;

  return (
    <Animation animation="zoomIn" style={Styles.itemContainer}>
      <Ripple
        style={Styles.card}
        rippleColor={Colors.primary}
        onPress={() => onPress(item)}
      >
        {showImage ? (
          <Image
            source={{ uri: item?.primary_image_to_show }}
            resizeMode="cover"
            style={Styles.userImage}
            onError={() => setImageError(true)}
          />
        ) : (
          <ProfilePhotoPlaceholder name={fullName} size={wp(16)} rounded />
        )}

        {isOnline && (
          <View style={Styles.onlinePill}>
            <View style={Styles.onlineDot} />
          </View>
        )}

        <View style={Styles.badgesContainer}>
          <ProfileBadges userData={item} iconOnly vertical />
        </View>

        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.82)']}
          style={Styles.scrim}
        >
          <ReactText
            style={[Styles.name, { textAlign: rtl ? 'right' : 'left' }]}
            numberOfLines={1}
          >
            {item?.first_name} {item?.last_name}
            {item?.age ? `, ${item.age}` : ''}
          </ReactText>
          {locationText ? (
            <View
              style={[
                Styles.locationRow,
                { flexDirection: rtl ? 'row-reverse' : 'row' },
              ]}
            >
              <Ionicons
                name="location-sharp"
                size={wp(3.2)}
                color={Colors.whiteRGBA90}
              />
              <ReactText
                style={[Styles.location, { textAlign: rtl ? 'right' : 'left' }]}
                numberOfLines={1}
              >
                {locationText}
              </ReactText>
            </View>
          ) : null}
        </LinearGradient>
      </Ripple>
    </Animation>
  );
};

const UsersList = (props: any) => {
  const { data = [], onLoadMorePress = () => null, optionTab } = props;
  const Rtl = CheckRtl();

  // M9 fix: FlatList's onEndReached fires on mount when the list doesn't fill
  // the viewport, then keeps firing on scroll. Guard against:
  //   1. firing when the list is empty (would spam pagination on an empty result)
  //   2. firing before there's content to scroll past
  const handleEndReached = () => {
    if (!data || data.length === 0) return;
    onLoadMorePress();
  };

  const onUserPress = (item: any) =>
    props.navigation.navigate('UserProfile', {
      userData: item,
    });

  const renderEmptyList = () => {
    let emptyText = '';
    switch (optionTab) {
      case 'recommended':
        emptyText = LanguageKeys.noRecommendation;
        break;
      case 'likedByYou':
        emptyText = LanguageKeys.noLiked;
        break;
      case 'likedYou':
        emptyText = LanguageKeys.noLike;
        break;
      case 'visitors':
        emptyText = LanguageKeys.noVisiter;
        break;
      default:
        emptyText = LanguageKeys.noRecommendation;
        break;
    }
    return (
      <View style={Styles.emptyListCon}>
        <View style={Styles.emptyIconCircle}>
          <Ionicons
            name="sparkles-outline"
            size={wp(9)}
            color={Colors.primary}
          />
        </View>
        <Text style={Styles.emptyListText}>{emptyText}</Text>
      </View>
    );
  };

  return (
    <FlatList
      data={data}
      numColumns={2}
      extraData={data}
      renderItem={({ item }) => (
        <UserCard item={item} rtl={Rtl} onPress={onUserPress} />
      )}
      onEndReachedThreshold={0.5}
      onEndReached={handleEndReached}
      ListEmptyComponent={renderEmptyList}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={Styles.container}
      columnWrapperStyle={Styles.columnWrapper}
      keyExtractor={(item, index) => `${item?.id}-${index}`}
    />
  );
};

export default UsersList;

const Styles = StyleSheet.create({
  container: {
    paddingHorizontal: wp(3),
    paddingTop: hp(1.2),
    paddingBottom: hp(2),
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: hp(1.6),
  },
  itemContainer: {
    width: CARD_W,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.lavender,
  },
  userImage: {
    width: '100%',
    height: '100%',
  },
  onlinePill: {
    position: 'absolute',
    top: hp(1),
    right: wp(2.5),
    width: wp(3.6),
    height: wp(3.6),
    borderRadius: wp(1.8),
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  onlineDot: {
    width: wp(2.2),
    height: wp(2.2),
    borderRadius: wp(1.1),
    backgroundColor: Colors.verified,
  },
  badgesContainer: {
    position: 'absolute',
    top: hp(1),
    left: wp(2.5),
    zIndex: 2,
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: wp(2.8),
    paddingTop: hp(3),
    paddingBottom: hp(1.4),
    justifyContent: 'flex-end',
  },
  name: {
    color: Colors.surface,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small2,
    includeFontPadding: false,
    textTransform: 'capitalize',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
    marginTop: hp(0.3),
  },
  location: {
    flex: 1,
    color: Colors.whiteRGBA90,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.tiny1,
    includeFontPadding: false,
  },
  emptyListCon: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp(16),
  },
  emptyIconCircle: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(10),
    backgroundColor: Colors.lavender,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyListText: {
    color: Colors.muted,
    includeFontPadding: false,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small3,
    textAlign: 'center',
    marginTop: hp(2.5),
    marginHorizontal: wp(12),
  },
});
