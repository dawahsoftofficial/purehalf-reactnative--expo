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

import {
  Button,
  ButtonPicker,
  ModalLoader,
  ProfilePhotoPlaceholder,
  Text,
} from '../../components';
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
      <AntDesign name={name} color={Colors.primary} size={wp(5)} />
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
        style={[Styles.itemCon, { flexDirection: Rtl ? 'row-reverse' : 'row' }]}
        activeOpacity={Constants.btnActiveOpacity}
        onPress={onItemPress.bind(null, item)}
      >
        <View style={Styles.avatar}>
          {item?.primary_image_to_show ? (
            <>
              <Image
                source={{ uri: item.primary_image_to_show }}
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
            <ProfilePhotoPlaceholder
              name={item?.full_name}
              size={AVATAR * 0.5}
            />
          )}
        </View>
        <RenderItemContent item={item} />
        <RenderButtons item={item} />
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
const AVATAR = width * 0.14;
const Styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    paddingBottom: hp(15),
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
    fontFamily: Fonts.APPFONT_B,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  buttonCon: {
    width: width * 0.09,
    height: width * 1 * 0.09,
    borderRadius: (width * 1 * 0.09) / 2,
    backgroundColor: Colors.lavender,
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
    color: Colors.muted,
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
