import { useNavigation } from '@react-navigation/native';
import _ from 'lodash';
import React, { useReducer, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text as ReactText,
  TouchableOpacity,
  View,
} from 'react-native';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { Button, ButtonPicker, ModalLoader, Text } from '../../components';
import { Constants, hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';
import { ApiServices, flashSuccessMessage } from '../../services';

const RequestedList = (props: any) => {
  const Rtl = CheckRtl();
  const navigation: any = useNavigation();
  const [ignore, forceUpdate] = useReducer((x) => x + 1, 0);
  console.log('ignore', ignore);
  const [imageLoader, setImageLoader] = useState(false);
  const [modalLoader, setModalLoader] = useState({
    visible: false,
    message: 'Loading...',
  });

  const [buttonPickerVisible, setButtonPickerVisible] = useState<any>({
    pickerData: [],
    pickerHeaderTitle: '',
    visible: false,
    userId: '',
    from: '',
  });

  const pickerData = [
    {
      label: 'Delete',
      value: 'delete',
      buttonStyle: { backgroundColor: Colors.color24 },
      buttonTextStyle: { color: Colors.color2 },
    },
    {
      label: 'Cancel',
      value: 'cancel',
    },
  ];

  const {
    data = [],
    onLoadMorePress = () => null,
    loadMoreLoader = false,
    from = '',
  } = props;

  const RenderItemContent = ({ item }: any) => {
    return (
      <View style={Styles.itemInnerCon}>
        <ReactText
          style={{
            ...Styles.itemName,
            alignSelf: Rtl ? 'flex-end' : 'flex-start',
          }}
          numberOfLines={2}
        >
          {item?.full_name}
        </ReactText>
        {(item?.city || item?.country) && (
          <ReactText
            style={{
              ...Styles.itemLocation,
              alignSelf: Rtl ? 'flex-end' : 'flex-start',
            }}
            numberOfLines={1}
          >
            {item?.city && `${item.city},`} {item?.country}
          </ReactText>
        )}
      </View>
    );
  };

  const onDeletePress = (item: any) => {
    setButtonPickerVisible({
      visible: true,
      userId: item?.id,
      from: 'delete',
      pickerData: pickerData,
      pickerHeaderTitle: LanguageKeys.sureDeleteDes,
    });
  };

  const onAcceptPress = (item: any) => {
    pickerData[0].label = LanguageKeys.accept;
    pickerData[0].value = 'accept';
    setButtonPickerVisible({
      visible: true,
      userId: item?.id,
      from: 'accept',
      pickerData: pickerData,
      pickerHeaderTitle: LanguageKeys.sureAcceptDes,
    });
  };

  const onRejectPress = (item: any) => {
    pickerData[0].label = LanguageKeys.reject;
    pickerData[0].value = 'reject';
    setButtonPickerVisible({
      visible: true,
      userId: item?.id,
      from: 'reject',
      pickerData: pickerData,
      pickerHeaderTitle: LanguageKeys.sureRejectDes,
    });
  };

  const RenderSignleButton = ({ name, onPress }: any) => (
    <Ripple style={Styles.buttonCon} onPress={onPress}>
      <AntDesign name={name} color={Colors.color1} size={wp(5)} />
    </Ripple>
  );
  const RenderButtons = ({ item }: any) =>
    from === 'othersRequests' ? (
      <View
        style={{
          ...Styles.buttonsOuterCon,
          flexDirection: Rtl ? 'row-reverse' : 'row',
        }}
      >
        <RenderSignleButton
          name="close"
          onPress={onRejectPress.bind(null, item)}
        />
        <RenderSignleButton
          name="check"
          onPress={onAcceptPress.bind(null, item)}
        />
      </View>
    ) : (
      <View
        style={{
          ...Styles.buttonsOuterCon,
          flexDirection: Rtl ? 'row-reverse' : 'row',
          justifyContent: 'flex-end',
        }}
      >
        <RenderSignleButton
          name="delete"
          onPress={onDeletePress.bind(null, item)}
        />
      </View>
    );

  const onImageLoadStart = () => setImageLoader(true);
  const onImageLoadEnd = () => setImageLoader(false);

  const onItemPress = (item: any) => {
    navigation.navigate('UserProfile', {
      userData: item,
    });
  };

  const renderList = ({ item }: any) => {
    return (
      <TouchableOpacity
        style={Styles.itemCon}
        activeOpacity={Constants.btnActiveOpacity}
        onPress={onItemPress.bind(null, item)}
      >
        {item?.media?.primary_image_to_show ? (
          <View style={Styles.itemImage}>
            <Image
              source={{ uri: item.media.primary_image_to_show }}
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
          <RenderItemContent item={item} />
          <RenderButtons item={item} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={Styles.emptyListContainer}>
      <Image
        source={Images.logoWithoutTextBlack}
        style={Styles.emptyListIcon}
      />
      <Text style={Styles.emptyListText}>
        {from === 'othersRequests'
          ? LanguageKeys.noPhotoRequests
          : LanguageKeys.noPhotoRequested}
      </Text>
    </View>
  );

  const hideButtonPicker = () => {
    setButtonPickerVisible({
      visible: false,
      userId: '',
      from: '',
      pickerData: [],
      pickerHeaderTitle: '',
    });
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

  const hideModalLoader = () => {
    setModalLoader({
      visible: false,
      message: '',
    });
  };

  const onButtonPickerButtonPress = (item: any) => {
    hideButtonPicker();
    const { value } = item;
    if (value === 'delete') {
      setModalLoader({
        visible: true,
        message: LanguageKeys.deletingRequest,
      });
      const userId = buttonPickerVisible.userId;
      ApiServices.privatePhotoRemoveRequest(userId)
        .then(() => {
          _.remove(data, function (n: any) {
            return n.id === userId;
          });
          forceUpdate();
          hideModalLoader();
          flashSuccessMessage(LanguageKeys.deleted);
        })
        .catch(hideModalLoader);
    } else if (value === 'accept') {
      setModalLoader({
        visible: true,
        message: LanguageKeys.acceptingRequest,
      });
      const userId = buttonPickerVisible.userId;
      ApiServices.privatePhotoAcceptRequest(userId)
        .then(() => {
          _.remove(data, function (n: any) {
            return n.id === userId;
          });
          forceUpdate();
          hideModalLoader();
          flashSuccessMessage(LanguageKeys.accepted);
        })
        .catch(hideModalLoader);
    } else if (value === 'reject') {
      setModalLoader({
        visible: true,
        message: LanguageKeys.rejectingRequest,
      });
      const userId = buttonPickerVisible.userId;
      ApiServices.privatePhotoRejectRequest(userId)
        .then(() => {
          _.remove(data, function (n: any) {
            return n.id === userId;
          });
          forceUpdate();
          hideModalLoader();
          flashSuccessMessage(LanguageKeys.rejected);
        })
        .catch(hideModalLoader);
    }
  };

  return (
    <>
      <ModalLoader
        visible={modalLoader.visible}
        message={modalLoader.message}
      />
      <FlatList
        data={data}
        renderItem={renderList}
        contentContainerStyle={Styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={data?.length >= 10 ? renderListFooter : null}
        ListEmptyComponent={renderEmptyList}
      />

      {buttonPickerVisible.visible && (
        <ButtonPicker
          visible={true}
          data={buttonPickerVisible.pickerData}
          onClose={hideButtonPicker}
          headerTitle={buttonPickerVisible.pickerHeaderTitle}
          onButtonPress={onButtonPickerButtonPress}
        />
      )}
    </>
  );
};

export default RequestedList;

const { width } = Dimensions.get('window');
const Styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    paddingBottom: hp(15),
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
    alignItems: 'flex-start',
    paddingVertical: hp(1),
  },
  itemInnerCon: {
    width: wp(55),
  },
  itemName: {
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium,
    color: Colors.color1,
    includeFontPadding: false,
    // maxWidth: wp(45),
  },
  itemLocation: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.medium,
    color: Colors.color1,
    lineHeight: wp(5.5),
    maxWidth: wp(45),
  },
  requestedOnView: {
    flexDirection: 'row',
    alignItems: 'center',
    width: wp(50),
  },
  requestedOn: {
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small1,
    color: Colors.color1,
    alignSelf: 'center',
    lineHeight: wp(5),
    marginHorizontal: wp(1),
  },
  buttonsOuterCon: {
    width: wp(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: hp(1),
  },
  buttonCon: {
    width: width * 0.09,
    height: width * 1 * 0.09,
    borderRadius: (width * 1 * 0.09) / 2,
    backgroundColor: Colors.color17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyListContainer: {
    marginVertical: hp(20),
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
    paddingHorizontal: wp(10),
  },
  loadMoreBtn: {
    alignSelf: 'center',
    width: wp(45),
    height: hp(5),
  },
});
