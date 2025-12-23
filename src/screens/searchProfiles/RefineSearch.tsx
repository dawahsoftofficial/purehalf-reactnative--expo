import { useNavigation } from '@react-navigation/native';
import _ from 'lodash';
import React, {
  useEffect,
  useImperativeHandle,
  useReducer,
  useState,
} from 'react';
import { Dimensions, FlatList, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { Animation } from '../../animations';
import { Loader, ModalLoader, Picker, Text } from '../../components';
import CountryData from '../../components/pickers/country_picker/Countries';
import { hp, Typography, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
import {
  ApiServices,
  flashErrorMessage,
  flashSuccessMessage,
  StorageManager,
  useGlobalContext,
} from '../../services';
import AgeRange from './AgeRange';
import ConfirmAlert from './ConfirmAlert';
import { filtersData } from './Data';
import { onSearch, saveAndSearch } from './Functions';
import SaveAndSearchAlert from './SaveAndSearchAlert';

type RefineSearchRef = {
  onSaveAndSearchPress: () => void;
  onSearchPress: () => void;
  hasFiltersSelected: () => boolean;
};

type RefineSearchProps = {
  premium?: boolean;
};

const RefineSearch = React.forwardRef<RefineSearchRef, RefineSearchProps>(
  ({ premium = false }, ref) => {
    const Rtl = CheckRtl();
    const { currentUser } = useGlobalContext();
    const navigation: any = useNavigation();

    // Premium filter IDs for male users
    const MALE_PREMIUM_FILTER_IDS = [
      'bdy-0', // Body Type
      'eye-0', // Eye Color
      'skin-0', // Complexion
      'last_online_at', // Last Online At
      'register_at', // Registered At
    ];

    // Premium filter IDs for female users
    const FEMALE_PREMIUM_FILTER_IDS = [
      'edu-0', // Education
      'prof-0', // Profession
      'earn-0', // Earnings Per Month
      'last_online_at', // Last Online At
      'register_at', // Registered At
    ];

    const isPremiumFilter = (filterId: string, isMale: boolean): boolean => {
      if (isMale) {
        return MALE_PREMIUM_FILTER_IDS.includes(filterId);
      }
      return FEMALE_PREMIUM_FILTER_IDS.includes(filterId);
    };

    const isFilterLocked = (filterId: string): boolean => {
      const isMale = currentUser?.gender !== 'female';
      return isPremiumFilter(filterId, isMale) && !premium;
    };

    const handleLockedFilterPress = () => {
      navigation.navigate('ProFeaturesPromotion');
    };
    const [modalLoader, setModalLoader] = useState({
      visible: false,
      message: '',
    });
    const [peopleSearch, setPeopleSearch] = useState<string>('location');
    const [searchTitle, setSearchTitle] = useState('');
    const [minAge, setMinAge] = useState<any>(LanguageKeys.any);
    const [maxAge, setMaxAge] = useState<any>(LanguageKeys.any);
    const [confirmAlertVisible, setConfirmAlertVisible] = useState(false);
    const [saveAndSearchAlertVisble, setSaveAndSearchAlertVisble] =
      useState(false);
    const [filtersDataList, setFiltersDataList] = useState(filtersData);
    const [listLoader, setListLoader] = useState(true);
    const { getData, storageKeys } = StorageManager;
    const [ignore, forceUpdate] = useReducer((x) => x + 1, 0);
    console.log('ignore', ignore);
    const [pickerDataLoader, setPickerDataLoader] = useState(false);
    const [picker, setPicker] = useState<any>({
      visible: false,
      data: [],
      headerTitle: '',
      activePicker: '',
      item: {},
    });

    const onClosePicker = () =>
      setPicker({
        visible: false,
        headerTitle: '',
        data: [],
        activePicker: '',
        item: {},
      });

    const onRadioPress = (data: any, selectedElement: any, item: any) => {
      data.forEach((element: any) => {
        if (element.value === selectedElement.value) {
          if (element.id === 'location' || element.id === 'country') {
            setPeopleSearch(element.id);
          }
          element.selected = true;
          item.selected = { ...selectedElement };
        } else {
          element.selected = false;
        }
      });
      forceUpdate();
    };

    const onRadioClearPress = (item: any) => {
      filtersDataList?.forEach((element: any) => {
        if (element?.id === item?.id) {
          element.selected = {};
        }
      });
      setFiltersDataList(filtersDataList);
      forceUpdate();
    };

    const renderRadioButtonsList = ({ item, index }: any) => {
      const { title, data, id } = item;
      const { selected } = item;
      const isLocked = isFilterLocked(id);
      return (
        <View
          style={{
            ...Styles.fieldItemCon,
            backgroundColor: index % 2 === 0 ? Colors.color31 : Colors.color2,
            opacity: isLocked ? 0.6 : 1,
          }}
        >
          <View
            style={{
              flexDirection: Rtl ? 'row-reverse' : 'row',
              alignItems: 'center',
              marginBottom: hp(0.5),
            }}
          >
            <Text style={Styles.fieldHeading}>{title}</Text>
            {isLocked && (
              <View
                style={{
                  marginLeft: Rtl ? 0 : wp(2),
                  marginRight: Rtl ? wp(2) : 0,
                }}
              >
                <AntDesign name="lock" color={Colors.theme} size={wp(4)} />
              </View>
            )}
          </View>
          <View
            style={{
              ...Styles.radioButtonOutercon,
              flexDirection: Rtl ? 'row-reverse' : 'row',
            }}
          >
            {data &&
              data.length !== 0 &&
              data.map((element: any, index: any) => {
                return (
                  <Ripple
                    style={{
                      ...Styles.radioButtonCon,
                      marginRight: Rtl ? 0 : wp(4),
                      marginLeft: Rtl ? wp(4) : 0,
                    }}
                    onPress={
                      isLocked
                        ? handleLockedFilterPress
                        : onRadioPress.bind(null, data, element, item)
                    }
                    key={index}
                    hitSlop={20}
                    rippleColor={Colors.theme}
                    disabled={isLocked}
                  >
                    <View
                      style={{
                        ...Styles.radioButton,
                        backgroundColor:
                          element?.id === selected?.id
                            ? Colors.color1
                            : 'transparent',
                      }}
                    />
                    <Text style={Styles.fieldDescription}>{element.value}</Text>
                  </Ripple>
                );
              })}
          </View>
          {!isLocked && (
            <Ripple
              style={{
                ...Styles.clearButton,
                alignSelf: Rtl ? 'flex-start' : 'flex-end',
              }}
              onPress={onRadioClearPress.bind(null, item)}
              hitSlop={20}
              rippleColor={Colors.theme}
            >
              <Text style={Styles.clearButtonText}>{LanguageKeys.clear}</Text>
            </Ripple>
          )}
        </View>
      );
    };

    const getApiData = (id: any) => {
      return new Promise((resolve, reject) => {
        if (id === 'language') {
          ApiServices.getLanguages()
            .then(async (data: any) => {
              resolve(data);
            })
            .catch(() => reject(''));
        } else if (id === 'nationality') {
          ApiServices.getNationality()
            .then(async (data: any) => {
              resolve(data);
            })
            .catch(() => reject(''));
        } else {
          reject('');
        }
      });
    };

    const openPicker = async (item: any) => {
      const { data, title, id } = item;
      if (isFilterLocked(id)) {
        handleLockedFilterPress();
        return;
      }
      if (id === 'language' || id === 'nationality') {
        setPickerDataLoader(true);
        getApiData(id)
          .then(async (data: any) => {
            if (data) {
              const newData: any = [];
              for await (const element of data) {
                newData.push({
                  id: element?.id,
                  value: element?.name,
                });
              }
              setPicker({
                visible: true,
                headerTitle: title,
                data: newData,
                activePicker: title,
                item: item,
              });
              setPickerDataLoader(false);
            } else {
              setPickerDataLoader(false);
            }
          })
          .catch(() => setPickerDataLoader(false));
      } else if (id === 'country') {
        setPickerDataLoader(true);
        const newData: any = [];
        for await (const element of CountryData) {
          newData.push({
            id: element?.name,
            value: element?.name,
          });
        }
        setPicker({
          visible: true,
          headerTitle: title,
          data: newData,
          activePicker: title,
          item: item,
        });
        setPickerDataLoader(false);
      } else if (id === 'distance') {
        setPickerDataLoader(true);
        const newData: any = [
          {
            id: 10,
            value: LanguageKeys.upTo10KmAway,
          },
          {
            id: 50,
            value: LanguageKeys.upTo50KmAway,
          },
          {
            id: 100,
            value: LanguageKeys.upTo100KmAway,
          },
          {
            id: 250,
            value: LanguageKeys.upTo250KmAway,
          },
          {
            id: 500,
            value: LanguageKeys.upTo500KmAway,
          },
        ];
        setPicker({
          visible: true,
          headerTitle: title,
          data: newData,
          activePicker: title,
          item: item,
        });
        setPickerDataLoader(false);
      } else {
        setPicker({
          visible: true,
          headerTitle: title,
          data: data,
          activePicker: title,
          item: item,
        });
      }
    };

    const onPickerItemPress = (item: any) => {
      picker.item.selected = item;
      const index = _.findIndex(filtersDataList, { id: picker.item.id });
      filtersDataList?.splice(index, 1, picker.item);
      onClosePicker();
    };

    const onPickerClearPress = (item: any) => {
      item.selected = {};
      setFiltersDataList(filtersDataList);
      forceUpdate();
    };

    const renderDropDownList = ({ item, index }: any) => {
      const { title, selected, id } = item;
      const value = selected?.value ? selected.value : '';
      const isLocked = isFilterLocked(id);
      if (peopleSearch === 'location' && item?.id === 'country') return null;
      if (peopleSearch === 'country' && item?.id === 'distance') return null;
      return (
        <Animation
          style={{
            ...Styles.fieldItemCon,
            backgroundColor:
              index % 2 === 0
                ? Colors.color2
                : item?.id === 'distance'
                  ? Colors.color2
                  : Colors.color31,
            opacity: isLocked ? 0.6 : 1,
          }}
          animation="fadeIn"
          duration={1000}
        >
          <View
            style={{
              flexDirection: Rtl ? 'row-reverse' : 'row',
              alignItems: 'center',
              marginBottom: hp(0.5),
            }}
          >
            <Text style={Styles.fieldHeading}>{title}</Text>
            {isLocked && (
              <View
                style={{
                  marginLeft: Rtl ? 0 : wp(2),
                  marginRight: Rtl ? wp(2) : 0,
                }}
              >
                <AntDesign name="lock" color={Colors.theme} size={wp(4)} />
              </View>
            )}
          </View>
          <Ripple
            style={{
              ...Styles.dropDownBtn,
              alignSelf: Rtl ? 'flex-end' : 'flex-start',
            }}
            onPress={openPicker.bind(null, item)}
            hitSlop={20}
            rippleColor={Colors.theme}
            disabled={
              isLocked ||
              (peopleSearch === 'location' && item?.id === 'country') ||
              (peopleSearch === 'country' && item?.id === 'distance')
            }
          >
            <Text
              style={{ ...Styles.fieldDescription, ...Styles.dropDownBtnTxt }}
            >
              {typeof value === 'number'
                ? value === 1
                  ? 'Yes'
                  : value === 0
                    ? 'No'
                    : JSON.stringify(value)
                : value && value.length !== 0
                  ? value
                  : LanguageKeys.notYetProvided}
            </Text>
            <View style={Styles.arrowBtn}>
              <AntDesign name="down" color={Colors.color1} size={wp(3)} />
            </View>
          </Ripple>
          {!isLocked && (
            <Ripple
              style={{
                ...Styles.clearButton,
                alignSelf: Rtl ? 'flex-start' : 'flex-end',
              }}
              onPress={onPickerClearPress.bind(null, item)}
              hitSlop={20}
              rippleColor={Colors.theme}
            >
              <Text style={Styles.clearButtonText}>{LanguageKeys.clear}</Text>
            </Ripple>
          )}
        </Animation>
      );
    };

    const setDropDownData = () => {
      getData(storageKeys.ATTRIBUTE)
        .then(async (attributeRes: any) => {
          if (attributeRes) {
            for await (const element of filtersDataList) {
              if (element?.fromAttribute) {
                const result = attributeRes[element.category][element.id];
                if (result) {
                  element.data = result;
                }
              }
            }
            setFiltersDataList(filtersDataList);
            setListLoader(false);
          } else {
            setListLoader(false);
          }
        })
        .catch(() => setListLoader(false));
    };

    const onSaveAndSearchPress = () => {
      setSaveAndSearchAlertVisble(true);
    };

    const closeSaveAndSearchAlert = () => {
      setSearchTitle('');
      setSaveAndSearchAlertVisble(false);
    };

    const closeConfirmAlert = () => {
      setSearchTitle('');
      setConfirmAlertVisible(false);
    };

    const hideModalLoader = () => {
      setModalLoader({
        visible: false,
        message: '',
      });
    };

    const onSearchPress = () => {
      setModalLoader({
        visible: true,
        message: LanguageKeys.searching,
      });
      const ageRange = {
        minAge: minAge === LanguageKeys.any ? 1 : minAge,
        maxAge: maxAge === LanguageKeys.any ? 99 : maxAge,
      };
      onSearch(ageRange, filtersDataList)
        .then((res: any) => {
          navigation.navigate('SearchResults', {
            searchResults: res.data,
            urlParams: res.urlParams,
          });
          hideModalLoader();
        })
        .catch(hideModalLoader);
    };

    const onSaveAndSearchAlertPress = (searchTitle: any) => {
      if (searchTitle.length === 0) {
        flashErrorMessage(LanguageKeys.searchTitleRequired);
        setSearchTitle('');
      } else {
        setSaveAndSearchAlertVisble(false);
        setConfirmAlertVisible(true);
        setSearchTitle(searchTitle);
      }
    };

    const onConfirmSaveandSearchAlertPress = () => {
      setConfirmAlertVisible(false);
      setModalLoader({
        visible: true,
        message: LanguageKeys.savingAndSearching,
      });
      const ageRange = {
        minAge: minAge === LanguageKeys.any ? 1 : minAge,
        maxAge: maxAge === LanguageKeys.any ? 99 : maxAge,
      };
      saveAndSearch(ageRange, filtersDataList, searchTitle)
        .then((res: any) => {
          navigation.navigate('SearchResults', {
            searchResults: res.data,
            urlParams: res.urlParams,
          });
          hideModalLoader();
        })
        .catch(hideModalLoader);
    };

    useEffect(() => {
      setDropDownData();
    }, []);

    const onMinAgeChange = (value: any) => setMinAge(value);
    const onMaxAgeChange = (value: any) => setMaxAge(value);

    const onClearAllPress = () => {
      setModalLoader({
        visible: true,
        message: LanguageKeys.clearingFilters,
      });
      setMinAge(LanguageKeys.any);
      setMaxAge(LanguageKeys.any);
      filtersDataList.forEach((element: any) => {
        element.selected = {};
      });
      setFiltersDataList(filtersDataList);
      forceUpdate();
      hideModalLoader();
      flashSuccessMessage(LanguageKeys.allFiltersCleared);
    };

    const onAgeClearPress = () => {
      setMinAge(LanguageKeys.any);
      setMaxAge(LanguageKeys.any);
    };

    const hasFiltersSelected = (): boolean => {
      // Check if age range is selected (not "any")
      const hasAgeRange =
        minAge !== LanguageKeys.any || maxAge !== LanguageKeys.any;

      // Check if any filter (excluding default "Search For People") has a selected value
      const hasFilterSelected = filtersDataList.some(
        (element: any) =>
          element?.id !== 'search_for_people' &&
          Object.keys(element?.selected || {}).length !== 0
      );

      return hasAgeRange || hasFilterSelected;
    };

    useImperativeHandle(ref, () => ({
      onSaveAndSearchPress,
      onSearchPress,
      hasFiltersSelected,
    }));

    const renderList = ({ item, index }: any) => {
      const isMale = currentUser?.gender === 'female' ? false : true;
      const isFemale = currentUser?.gender === 'female';

      // Hide filters for females
      const hideForFemale =
        isFemale &&
        (item?.id === 'bdy-0' || // Body Type
          item?.id === 'eye-0' || // Eye Color
          item?.id === 'hijab-0'); // Hijab Level

      // Hide filters for males
      const hideForMale =
        isMale &&
        (item?.id === 'doYouHaveABeard' || // Beard
          item?.id === 'is_wali'); // With Wali (already hidden)

      // Hide hijab for males (existing logic)
      const hideHijabForMale = item?.id === 'hijab-0' && isMale;

      const hideItem = hideForFemale || hideForMale || hideHijabForMale;
      return hideItem
        ? null
        : item?.type === 'dropDown'
          ? renderDropDownList({ item, index })
          : renderRadioButtonsList({ item, index });
    };

    return (
      <View style={Styles.container}>
        <Text style={Styles.heading}>{LanguageKeys.refineYourSearch}</Text>
        <Ripple
          style={{
            ...Styles.clearAllButton,
            alignSelf: Rtl ? 'flex-start' : 'flex-end',
          }}
          hitSlop={20}
          onPress={onClearAllPress}
          rippleColor={Colors.theme}
        >
          <Text style={Styles.clearButtonText}>{LanguageKeys.clearAll}</Text>
        </Ripple>
        <View style={Styles.innerContainer}>
          <ModalLoader
            visible={modalLoader.visible}
            useModalLayout={true}
            message={modalLoader.message}
          />
          <AgeRange
            minAge={minAge}
            maxAge={maxAge}
            onMinAgeChange={onMinAgeChange}
            onMaxAgeChange={onMaxAgeChange}
            onClearPress={onAgeClearPress}
          />
          {listLoader ? (
            <Loader />
          ) : (
            <FlatList
              data={filtersDataList}
              renderItem={renderList}
              scrollEnabled={false}
            />
          )}

          <Picker
            visible={picker.visible}
            onClose={onClosePicker}
            onPress={onPickerItemPress}
            data={picker.data}
            headerTitle={picker.headerTitle}
            loader={pickerDataLoader}
          />
          <SaveAndSearchAlert
            visible={saveAndSearchAlertVisble}
            onClose={closeSaveAndSearchAlert}
            onPress={onSaveAndSearchAlertPress}
          />
          <ConfirmAlert
            visible={confirmAlertVisible}
            onClose={closeConfirmAlert}
            onPress={onConfirmSaveandSearchAlertPress}
          />
        </View>
      </View>
    );
  }
);

export default RefineSearch;

const { width } = Dimensions.get('window');

const Styles = StyleSheet.create({
  container: {
    marginTop: hp(4),
  },
  innerContainer: {
    backgroundColor: Colors.color2,
    borderWidth: 0.5,
    borderColor: Colors.color27,
    overflow: 'hidden',
    borderRadius: 8,
  },
  heading: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small2,
    lineHeight: wp(5),
    marginBottom: hp(1.5),
  },
  fieldItemCon: {
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
  },
  fieldHeading: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small1,
    includeFontPadding: false,
  },
  radioButtonOutercon: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  radioButtonCon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(1),
  },
  radioButton: {
    width: width * 0.035,
    height: width * 1 * 0.035,
    borderRadius: (width * 1 * 0.035) / 2,
    borderWidth: 0.7,
  },
  fieldDescription: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_L,
    fontSize: Typography.small1,
    lineHeight: wp(4.8),
    alignSelf: 'center',
    marginHorizontal: wp(1),
  },
  clearButton: {
    position: 'absolute',
    top: '35%',
    paddingHorizontal: wp(3),
  },
  clearButtonText: {
    fontFamily: Fonts.APPFONT_L,
    fontSize: Typography.tiny2,
    color: Colors.theme,
    includeFontPadding: false,
  },
  dropDownBtn: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginTop: hp(1),
    alignItems: 'center',
    paddingHorizontal: wp(2),
    backgroundColor: Colors.color2,
    paddingVertical: hp(0.2),
    borderRadius: 4,

    shadowColor: Colors.color1,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
    borderWidth: 0.4,
    borderColor: Colors.color7,
  },
  dropDownBtnTxt: {
    alignSelf: 'flex-start',
    marginHorizontal: 0,
  },
  arrowBtn: {
    marginLeft: wp(2),
  },
  searchBtn: {
    backgroundColor: Colors.color1,
    marginHorizontal: wp(4),
  },
  clearAllButton: {
    position: 'absolute',
    top: hp(0.2),
  },
});
