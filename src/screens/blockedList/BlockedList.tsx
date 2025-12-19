import _ from 'lodash';
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
          _.remove(blockedList, function (n: any) {
            return userId === n?.id;
          });
          setBlockedList(blockedList);
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
    return (
      <View style={Styles.itemCon}>
        {item?.media?.cover_image ? (
          <View style={Styles.itemImage}>
            <Image
              source={{ uri: item.media.cover_image }}
              resizeMode="cover"
              style={Styles.itemImage}
              onLoadStart={onImageLoadStart}
              onLoadEnd={onImageLoadEnd}
            />
            {imageLoader && (
              <ActivityIndicator
                color={Colors.theme}
                size={wp(5)}
                style={{ position: 'absolute' }}
              />
            )}
          </View>
        ) : (
          <View style={Styles.itemImage}>
            <Image source={Images.user} resizeMode="contain" />
          </View>
        )}
        <View
          style={{
            ...Styles.itemContentCon,
            flexDirection: Rtl ? 'row-reverse' : 'row',
          }}
        >
          <View style={Styles.itemInnerCon}>
            <Text style={Styles.itemName} numberOfLines={1}>
              {full_name}
            </Text>
            <Text style={Styles.itemLocation} numberOfLines={1}>
              {city} , {country}
            </Text>
          </View>
          <Ripple
            style={Styles.leftDownArrowCon}
            onPress={onUnblockPress.bind(null, item)}
          >
            <Image
              source={Images.leftDownArrow}
              resizeMode="contain"
              style={Styles.leftDownArrow}
            />
          </Ripple>
        </View>
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
      <Text style={Styles.emptyListText}>{LanguageKeys.noBlocked}</Text>
    </View>
  );

  return (
    <Container>
      <Header
        title={LanguageKeys.blockedContacts}
        navigation={props.navigation}
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
const Styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
  },
  itemCon: {
    borderTopRightRadius: 4,
    borderTopLeftRadius: 4,
    marginBottom: hp(4),
  },
  itemImage: {
    width: '100%',
    height: width * 1 * 0.5,
    borderTopRightRadius: 4,
    borderTopLeftRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.color18,
  },
  itemContentCon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
  },
  itemInnerCon: {
    maxWidth: wp(70),
  },
  itemName: {
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium,
    color: Colors.color1,
    lineHeight: wp(5.5),
    maxWidth: wp(70),
  },
  itemLocation: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.medium,
    color: Colors.color1,
    lineHeight: wp(5.5),
    maxWidth: wp(70),
  },
  requestedOnView: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestedOn: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small1,
    color: Colors.color1,
    alignSelf: 'center',
    marginHorizontal: wp(4),
    lineHeight: wp(5),
  },
  leftDownArrowCon: {
    width: width * 0.1,
    height: width * 1 * 0.1,
    borderRadius: (width * 1 * 0.1) / 2,
    backgroundColor: Colors.color17,
    marginVertical: hp(1),
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftDownArrow: {
    width: width * 0.05,
    height: width * 1 * 0.05,
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
    marginVertical: hp(30),
    alignItems: 'center',
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
