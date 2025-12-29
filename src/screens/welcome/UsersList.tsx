import moment from 'moment';
import React from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text as ReactText,
  View,
} from 'react-native';
import Ripple from 'react-native-material-ripple';

import { Animation } from '../../animations';
import { ProfileBadges, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';

const UsersList = (props: any) => {
  const { data = [], onLoadMorePress = () => null, optionTab } = props;

  const onUserPress = (item: any) =>
    props.navigation.navigate('UserProfile', {
      userData: item,
    });

  const RenderUsers = ({ item }: any) => {
    const lastOnlineFromCurrentTime = parseInt(
      moment
        .duration(moment(new Date()).diff(moment(item?.last_online_at)))
        .asHours()
        .toFixed()
    );

    return (
      <Animation animation="zoomIn">
        <Ripple
          style={Styles.itemContainer}
          onPress={onUserPress.bind(null, item)}
        >
          <View style={Styles.userImageView}>
            {/* {item?.is_blur === 1 ? <BlurView /> : null} */}
            <Image
              source={
                item?.media?.primary_image_to_show
                  ? { uri: item?.media?.primary_image_to_show }
                  : Images.userTwo
              }
              resizeMode="cover"
              style={Styles.userImage}
            />
            {lastOnlineFromCurrentTime === 1 && (
              <View style={Styles.onlineStatus} />
            )}
            <View style={Styles.badgesContainer}>
              <ProfileBadges userData={item} iconOnly vertical />
            </View>
          </View>
          <ReactText style={Styles.name} numberOfLines={2}>
            {item?.first_name} {item?.last_name}, {item?.age}
          </ReactText>
          {(item?.city || item?.country) && (
            <ReactText style={Styles.location} numberOfLines={1}>
              {item?.city && `${item.city},`} {item?.country}
            </ReactText>
          )}
        </Ripple>
      </Animation>
    );
  };

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
        <Image
          source={Images.logoWithoutTextBlack}
          style={Styles.emptyListIcon}
        />
        <Text style={Styles.emptyListText}>{emptyText}</Text>
      </View>
    );
  };

  return (
    <FlatList
      data={data}
      renderItem={RenderUsers}
      numColumns={2}
      showsVerticalScrollIndicator={false}
      keyExtractor={(item, index) => index.toString()}
      contentContainerStyle={Styles.container}
      onEndReached={onLoadMorePress}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={renderEmptyList}
    />
  );
};

export default UsersList;

const { width } = Dimensions.get('window');
const Styles = StyleSheet.create({
  container: {
    paddingTop: hp(2),
    alignItems: 'center',
  },
  itemContainer: {
    width: wp(45),
    marginHorizontal: 5.5,
    marginBottom: hp(2),
    alignItems: 'center',
    overflow: 'hidden',
  },
  userImageView: {
    borderRadius: 5,
    width: '100%',
    height: 190,
    backgroundColor: Colors.color21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userImage: {
    borderRadius: 5,
    width: '100%',
    height: 190,
  },
  onlineStatus: {
    width: width * 0.03,
    height: width * 0.03 * 1,
    borderRadius: (width * 0.03 * 1) / 2,
    position: 'absolute',
    top: hp(0.5),
    right: wp(1),
    zIndex: 1,
    backgroundColor: Colors.color52,
  },
  premiumBadge: {
    width: width * 0.058,
    height: width * 0.058 * 1,
    borderRadius: (width * 0.058 * 1) / 2,
    backgroundColor: Colors.color47,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: hp(0.7),
    right: wp(1.4),
  },
  premiumBadgeIcon: {
    width: 14,
    height: 14,
  },
  badgesContainer: {
    position: 'absolute',
    top: hp(0.5),
    right: wp(1),
    zIndex: 1,
  },
  name: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: wp(3),
    includeFontPadding: false,
    alignSelf: 'center',
    textAlign: 'center',
    maxWidth: wp(43),
    marginTop: 4,
    textTransform: 'capitalize',
  },
  location: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_R,
    fontSize: wp(2.6),
    includeFontPadding: false,
    alignSelf: 'center',
    textAlign: 'center',
    maxWidth: wp(43),
  },
  emptyListCon: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp(20),
  },
  emptyListIcon: {
    width: 90,
    height: 77,
    opacity: 0.2,
  },
  emptyListText: {
    color: Colors.color22,
    includeFontPadding: false,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.medium,
    textAlign: 'center',
    marginTop: 30,
    marginHorizontal: 30,
  },
});
