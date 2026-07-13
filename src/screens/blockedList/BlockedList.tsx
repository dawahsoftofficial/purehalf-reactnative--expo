import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  View,
} from 'react-native';
import Ripple from 'react-native-material-ripple';

import {
  AnimatedLoader,
  Button,
  ButtonPicker,
  Container,
  Header,
  ModalLoader,
  ProfilePhotoPlaceholder,
  Text,
} from '../../components';
import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';
import { ApiServices, flashSuccessMessage } from '../../services';

const BlockedList = (props: any) => {
  const [modalLoader, setModalLoader] = useState({
    visible: false,
    message: LanguageKeys.loading,
  });

  const Rtl = CheckRtl();
  const [loader, setLoader] = useState(true);
  const [imageLoader, setImageLoader] = useState(false);
  const [loadMoreLoader, setLoadMoreLoader] = useState(false);
  const [buttonPickerVisible, setButtonPickerVisible] = useState<any>({
    pickerData: [],
    pickerHeaderTitle: '',
    visible: false,
    item: '',
    from: '',
  });

  const unBlockPickerData = [
    {
      label: LanguageKeys.unBlock,
      value: 'unBlock',
      buttonStyle: { backgroundColor: Colors.color24 },
      buttonTextStyle: { color: Colors.color2 },
    },
    {
      label: LanguageKeys.cancel,
      value: 'cancel',
    },
  ];

  const [blockedList, setBlockedList] = useState<any>([]);
  const [blockedListPage, setBlockedListPage] = useState(1);

  const hideLoader = () => setLoader(false);

  const getBlockedList = (
    params = { page: 1, type: 7 },
    blockedListData = blockedList
  ) => {
    ApiServices.getUsers(params)
      .then((res: any) => {
        if (blockedListData.length === 0) {
          setBlockedList(res);
        } else {
          blockedListData.push(...res);
          setBlockedList(blockedListData);
        }
        setLoader(false);
        setLoadMoreLoader(false);
      })
      .catch(hideLoader);
  };

  const onImageLoadStart = () => setImageLoader(true);
  const onImageLoadEnd = () => setImageLoader(false);

  useEffect(() => {
    getBlockedList();
  }, []);

  const hideButtonPicker = () => {
    setButtonPickerVisible({
      visible: false,
      item: '',
      from: '',
      pickerData: [],
      pickerHeaderTitle: '',
    });
  };

  const hideModalLoader = () => {
    setModalLoader({
      visible: false,
      message: '',
    });
  };

  const onButtonPickerButtonPress = (item: any) => {
    hideButtonPicker();
    const userId = buttonPickerVisible?.item?.id;
    const { value } = item;
    if (value === 'unBlock') {
      setModalLoader({
        visible: true,
        message: LanguageKeys.unBlockingUser,
      });
      const params = {
        type: 7,
        action_user_id: userId,
        allow_photo_request: 0,
      };
      ApiServices.interactionAction(params)
        .then(() => {
          flashSuccessMessage(LanguageKeys.unBlocked);
          // M15 fix: build a new array. Mutating in place and passing the same
          // reference to setState skipped the re-render, so the unblocked user
          // stayed visible until the screen was remounted.
          setBlockedList((prev: any[]) =>
            (prev || []).filter((n: any) => n?.id !== userId)
          );
          hideModalLoader();
        })
        .catch(hideLoader);
    }
  };

  const onUnblockPress = (item: any) => {
    setButtonPickerVisible({
      visible: true,
      item: item,
      from: 'block',
      pickerData: unBlockPickerData,
      pickerHeaderTitle: LanguageKeys.unBlockThisUser,
    });
  };

  const onLoadMorePress = () => {
    setLoadMoreLoader(true);
    setBlockedListPage(blockedListPage + 1);
    const params = {
      page: blockedListPage + 1,
      type: 7,
    };
    getBlockedList(params, blockedList);
  };

  const renderBlockedList = ({ item }: any) => {
    const { full_name, city, country } = item;
    const locationText = [city, country].filter(Boolean).join(', ');
    const hasLocation = locationText.length > 0;
    return (
      <View
        style={[Styles.itemCon, { flexDirection: Rtl ? 'row-reverse' : 'row' }]}
      >
        <View style={Styles.avatar}>
          {item?.primary_image_to_show ? (
            <>
              <Image
                source={{ uri: item?.primary_image_to_show }}
                resizeMode="cover"
                style={Styles.avatarImg}
                onLoadStart={onImageLoadStart}
                onLoadEnd={onImageLoadEnd}
              />
              {imageLoader && (
                <ActivityIndicator
                  color={Colors.primary}
                  size={wp(4)}
                  style={Styles.avatarLoader}
                />
              )}
            </>
          ) : (
            <ProfilePhotoPlaceholder name={full_name} size={AVATAR * 0.5} />
          )}
        </View>
        <View
          style={[
            Styles.itemInnerCon,
            { alignItems: Rtl ? 'flex-end' : 'flex-start' },
          ]}
        >
          <Text variant="display" style={Styles.itemName} numberOfLines={1}>
            {full_name}
          </Text>
          {hasLocation && (
            <Text style={Styles.itemLocation} numberOfLines={1}>
              {locationText}
            </Text>
          )}
        </View>
        <Ripple
          style={Styles.unblockBtn}
          onPress={onUnblockPress.bind(null, item)}
        >
          <Text style={Styles.unblockTxt}>{LanguageKeys.unBlock}</Text>
        </Ripple>
      </View>
    );
  };

  const renderListFooter = () => (
    <Button
      text="Load more"
      buttonStyle={Styles.loadMoreBtn}
      onPress={onLoadMorePress}
      disabled={loadMoreLoader}
      loading={loadMoreLoader}
      loadingMessage={'loading...'}
    />
  );

  const renderEmptyList = () => (
    <View style={Styles.emptyListCon}>
      <Image
        source={Images.logoWithoutTextBlack}
        style={Styles.emptyListIcon}
      />
      <Text variant="display" style={Styles.emptyTitle}>
        {LanguageKeys.noBlockedTitle}
      </Text>
      <Text style={Styles.emptyListText}>{LanguageKeys.noBlocked}</Text>
    </View>
  );

  return (
    <Container style={Styles.screen}>
      <Header
        title={LanguageKeys.blockedContacts}
        navigation={props.navigation}
        titleVariant="display"
      />
      <ModalLoader
        visible={modalLoader.visible}
        message={modalLoader.message}
      />
      {loader ? (
        <AnimatedLoader text="Loading..." style={Styles.loader} />
      ) : (
        <FlatList
          data={blockedList}
          renderItem={renderBlockedList}
          contentContainerStyle={Styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            blockedList?.length >= 10 ? renderListFooter : null
          }
          ListEmptyComponent={renderEmptyList}
        />
      )}
      {buttonPickerVisible.visible && (
        <ButtonPicker
          visible={true}
          data={buttonPickerVisible.pickerData}
          onClose={hideButtonPicker}
          headerTitle={buttonPickerVisible.pickerHeaderTitle}
          onButtonPress={onButtonPickerButtonPress}
        />
      )}
    </Container>
  );
};

export default BlockedList;

const { width } = Dimensions.get('window');
const AVATAR = width * 0.14;
const Styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.appBg,
  },
  listContainer: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
  },
  itemCon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 16,
    padding: wp(3),
    marginBottom: hp(1.4),
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: Colors.lavender,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarLoader: {
    position: 'absolute',
  },
  itemInnerCon: {
    flex: 1,
    marginHorizontal: wp(3),
  },
  itemName: {
    fontSize: Typography.medium,
    color: Colors.ink,
    includeFontPadding: false,
  },
  itemLocation: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small1,
    color: Colors.muted,
    marginTop: hp(0.2),
  },
  unblockBtn: {
    backgroundColor: Colors.lavender,
    borderRadius: 999,
    paddingVertical: hp(0.9),
    paddingHorizontal: wp(4),
  },
  unblockTxt: {
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small1,
    color: Colors.primary,
  },
  loader: {
    marginTop: hp(30),
  },
  loadMoreBtn: {
    alignSelf: 'center',
    width: wp(45),
    height: hp(5),
  },
  emptyListCon: {
    marginVertical: hp(24),
    alignItems: 'center',
  },
  emptyListIcon: {
    width: 90,
    height: 77,
    opacity: 0.18,
  },
  emptyTitle: {
    fontSize: Typography.medium1,
    color: Colors.ink,
    marginTop: 24,
    textAlign: 'center',
    alignSelf: 'center',
  },
  emptyListText: {
    color: Colors.muted,
    includeFontPadding: false,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    textAlign: 'center',
    alignSelf: 'center',
    marginTop: 6,
    marginHorizontal: 30,
  },
});
