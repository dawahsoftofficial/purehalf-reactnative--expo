import { useFocusEffect, useNavigation } from '@react-navigation/native';
import _ from 'lodash';
import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { DeletePicker, ModalLoader, Text } from '../../components';
import { Constants, hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
import { ApiServices, flashSuccessMessage } from '../../services';
import { getFilterItemLabel } from './Functions';

const SavedSearches = () => {
  const Rtl = CheckRtl();
  const navigation: any = useNavigation();
  const [loader, setLoader] = useState(true);
  const [deleteAlert, setDeleteAlert] = useState({
    visible: false,
    from: '',
  });
  const [modalLoader, setModalLoader] = useState({
    visible: false,
    message: 'Loading...',
  });

  const [savedSearches, setSavedSearches] = useState([]);

  const hideModalLoader = () => {
    setModalLoader({
      visible: false,
      message: '',
    });
  };
  const hideLoader = () => setLoader(false);

  const getSavedFilters = () => {
    ApiServices.getSearchFilters()
      .then((res: any) => {
        setSavedSearches(res);
        setLoader(false);
      })
      .catch(hideLoader);
  };

  useFocusEffect(
    React.useCallback(() => {
      setLoader(true);
      getSavedFilters();
    }, [])
  );

  const RenderFilterTxt = ({ item }: any) => {
    const keys = Object.keys(item);
    return (
      <View style={Styles.filterListCon}>
        {keys.map((element, index) => {
          return (
            <View
              style={{
                ...Styles.filterItemCon,
                flexDirection: Rtl ? 'row-reverse' : 'row',
                borderBottomWidth: index === keys.length - 1 ? 0 : 1,
              }}
              key={index}
            >
              <Text
                style={{
                  ...Styles.filterItemHeading,
                  textAlign: Rtl ? 'right' : 'left',
                }}
              >
                {getFilterItemLabel(element)}
              </Text>
              <Text
                style={{
                  ...Styles.filterItemValue,
                  textAlign: Rtl ? 'right' : 'left',
                }}
              >
                {element === 'min_age' && item[element] === 1
                  ? LanguageKeys.any
                  : element === 'max_age' && item[element] === 99
                    ? LanguageKeys.any
                    : item[element]}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const onItemPress = (item: any) => {
    setModalLoader({
      visible: true,
      message: LanguageKeys.searching,
    });
    const { apply } = item;
    let urlParams = '';
    for (const element in apply) {
      urlParams = urlParams + `&${element}=${apply[element]}`;
    }
    ApiServices.searchFilterApply(urlParams)
      .then((res) => {
        navigation.navigate('SearchResults', {
          searchResults: res,
          urlParams: urlParams,
        });
      })
      .finally(hideModalLoader);
  };

  const onDeletePress = (item: any) => {
    const id = item?.id;
    setDeleteAlert({
      visible: true,
      from: id,
    });
  };

  const onDeleteAlertDeletePress = () => {
    setDeleteAlert({
      visible: false,
      from: '',
    });
    setModalLoader({
      visible: true,
      message: LanguageKeys.deleting,
    });
    ApiServices.deleteSearchFilter(deleteAlert?.from)
      .then(() => {
        _.remove(savedSearches, (item: any) => item.id === deleteAlert?.from);
        setSavedSearches(savedSearches);
        flashSuccessMessage(LanguageKeys.deleted);
      })
      .finally(hideModalLoader);
  };

  const hideDeleteAlert = () =>
    setDeleteAlert({
      visible: false,
      from: '',
    });

  const renderList = ({ item }: any) => {
    const { view, title } = item;
    return (
      <Ripple
        style={Styles.itemCon}
        rippleColor={Colors.primary}
        onPress={onItemPress.bind(null, item)}
      >
        <View
          style={{
            ...Styles.itemConHeader,
            flexDirection: Rtl ? 'row-reverse' : 'row',
          }}
        >
          <View
            style={{
              ...Styles.itemHeaderLeft,
              flexDirection: Rtl ? 'row-reverse' : 'row',
            }}
          >
            <View style={Styles.itemIcon}>
              <Ionicons name="bookmark" color={Colors.primary} size={wp(4.2)} />
            </View>
            <Text style={Styles.heading} numberOfLines={1}>
              {title}
            </Text>
          </View>
          <Ripple
            onPress={onDeletePress.bind(null, item)}
            style={Styles.deleteButton}
            rippleColor={Colors.color24}
            hitSlop={12}
          >
            <Ionicons
              name="trash-outline"
              color={Colors.color24}
              size={wp(4.5)}
            />
          </Ripple>
        </View>

        <RenderFilterTxt item={view} title={title} />
      </Ripple>
    );
  };

  // Empty or still loading: render nothing so the whole section (label + list)
  // disappears instead of showing an awkward empty state at the top.
  if (loader || !savedSearches || savedSearches.length === 0) {
    return null;
  }

  return (
    <View style={Styles.wrapper}>
      <Text style={Styles.sectionLabel}>{LanguageKeys.savedSearches}</Text>
      <ModalLoader
        visible={modalLoader.visible}
        message={modalLoader.message}
        useModalLayout={true}
      />
      <FlatList
        data={savedSearches}
        renderItem={renderList}
        contentContainerStyle={Styles.listContainer}
        scrollEnabled={false}
      />
      <DeletePicker
        visible={deleteAlert?.visible}
        onClose={hideDeleteAlert}
        onDeletePress={onDeleteAlertDeletePress}
        onCancelPress={hideDeleteAlert}
      />
    </View>
  );
};

export default SavedSearches;

const Styles = StyleSheet.create({
  wrapper: {
    marginTop: hp(2),
  },
  sectionLabel: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    includeFontPadding: false,
    marginBottom: hp(0.5),
  },
  listContainer: {
    paddingTop: hp(1),
  },
  itemCon: {
    marginBottom: hp(1.4),
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.hairline,
    overflow: 'hidden',
  },
  itemConHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.4),
    paddingHorizontal: wp(3.5),
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  itemHeaderLeft: {
    alignItems: 'center',
    flexShrink: 1,
  },
  itemIcon: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: wp(2),
  },
  heading: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small2,
    includeFontPadding: false,
    flexShrink: 1,
  },
  deleteButton: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterListCon: {
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(0.5),
  },
  filterItemCon: {
    justifyContent: 'space-between',
    paddingVertical: hp(1.1),
    borderBottomColor: Colors.hairline,
  },
  filterItemHeading: {
    flex: 1,
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small,
    includeFontPadding: false,
  },
  filterItemValue: {
    flex: 1,
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small1,
    marginBottom: Constants.fontFamilyMarginBottom,
    textAlign: 'right',
  },
});
