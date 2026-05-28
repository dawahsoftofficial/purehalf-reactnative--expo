/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Modal from 'react-native-modal';
import AntDesign from 'react-native-vector-icons/AntDesign';

import {
  Button,
  HeightWeightPicker,
  IconInput,
  Picker,
  PickerButton,
  Text,
} from '../../components';
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
import { updateDetails } from './Funtions';

type PickerState = {
  visible: boolean;
  data: any[];
  headerTitle: string;
  activePicker: string;
};

type HeightWeightPickerState = {
  visible: boolean;
  data: any[];
  headerTitle: string;
  activePicker: string;
};

type FocusedInputState = {
  activeInputId: string;
  value: any;
  item: any;
};

type EditInfoCardModalProps = {
  details?: {
    visible?: boolean;
    data?: any[];
    from?: string;
  };
  onClose?: () => void;
  fetchData?: () => void;
};

const EditInfoCardModal = (props: EditInfoCardModalProps) => {
  const { t } = useTranslation();
  const [pickerDataLoader, setPickerDataLoader] = useState(false);
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const { setData, storageKeys } = StorageManager;
  const [updateLoader, setUpdateLoader] = useState(false);
  const Rtl = CheckRtl();
  const [focusedInput, setFocusedInput] = useState<FocusedInputState>({
    activeInputId: '',
    value: '',
    item: {},
  });

  const { details = {}, onClose = () => null, fetchData } = props;

  const { visible = false, data: initialData = [], from = '' } = details;

  const [formData, setFormData] = useState<any[]>(initialData);

  useEffect(() => {
    if (visible) {
      setFormData(JSON.parse(JSON.stringify(initialData)));
    }
  }, [visible, initialData]);

  const [heightWeightPicker, setHeightWeightPicker] =
    useState<HeightWeightPickerState>({
      visible: false,
      data: [],
      headerTitle: '',
      activePicker: '',
    });

  const onCloseHeightWeightPicker = useCallback(
    () =>
      setHeightWeightPicker({
        activePicker: '',
        headerTitle: '',
        visible: false,
        data: [],
      }),
    []
  );

  const openHeightWeightPicker = useCallback(
    (data: any, headerTitle: any, activePicker: any) => {
      setHeightWeightPicker({
        visible: true,
        headerTitle: headerTitle,
        data: data,
        activePicker: activePicker,
      });
    },
    []
  );

  const [picker, setPicker] = useState<PickerState>({
    visible: false,
    data: [],
    headerTitle: '',
    activePicker: '',
  });

  const onClosePicker = useCallback(
    () =>
      setPicker({
        visible: false,
        headerTitle: '',
        data: [],
        activePicker: '',
      }),
    []
  );

  const getApiData = useCallback((id: any) => {
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
  }, []);

  const openPicker = useCallback(
    async (data: any, headerTitle: any, id: any) => {
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
                headerTitle: headerTitle,
                data: newData,
                activePicker: headerTitle,
              });
              setPickerDataLoader(false);
            } else {
              setPickerDataLoader(false);
            }
          })
          .catch(() => setPickerDataLoader(false));
      }
      if (currentUser.gender === 'male' && id === 'martial-0') {
        setPicker({
          visible: true,
          headerTitle: headerTitle,
          data: data?.filter((val: any) => val?.value !== 'Widowed'),
          activePicker: headerTitle,
        });
      } else {
        setPicker({
          visible: true,
          headerTitle: headerTitle,
          data: data,
          activePicker: headerTitle,
        });
      }
    },
    [currentUser, getApiData]
  );

  const onInputFocus = useCallback((id: any, value: any, item: any) => {
    setFocusedInput({
      activeInputId: id,
      value: value,
      item: item,
    });
  }, []);

  const onBlurInput = useCallback(() => {
    const { activeInputId, item, value } = focusedInput;
    const { category } = item;
    setFormData((prevData: any[]) =>
      prevData.map((element: any) => {
        if (element.id === activeInputId) {
          return {
            ...element,
            selected: {
              id: activeInputId,
              value: value,
              category: category,
            },
          };
        }
        return element;
      })
    );
  }, [focusedInput]);

  const onChangeInput = useCallback(
    (text: any) => {
      setFocusedInput({
        ...focusedInput,
        value: text,
      });
      setFormData((prevData: any[]) =>
        prevData.map((element: any) => {
          if (element.title === focusedInput?.item?.title) {
            return {
              ...element,
              selected: {
                ...element.selected,
                value: text,
              },
            };
          }
          return element;
        })
      );
    },
    [focusedInput]
  );

  const onPickerItemPress = useCallback(
    (item: any) => {
      setFormData((prevData: any[]) =>
        prevData.map((element: any) => {
          if (element.title === picker.activePicker) {
            return {
              ...element,
              selected: item,
            };
          }
          return element;
        })
      );
      onClosePicker();
    },
    [onClosePicker, picker.activePicker]
  );

  const onHeightWeightPickerItemPress = useCallback(
    (item: any) => {
      setFormData((prevData: any[]) =>
        prevData.map((element: any) => {
          if (element.type === 'scalling') {
            if (heightWeightPicker.activePicker === element.title) {
              return {
                ...element,
                selected: {
                  ...element.selected,
                  value: item,
                },
              };
            } else if (
              heightWeightPicker.activePicker === `${element.title}Scale`
            ) {
              return {
                ...element,
                selected: {
                  value:
                    element?.selected?.scale === item
                      ? element?.selected?.value
                      : null,
                  scale: item,
                },
              };
            }
          }
          return element;
        })
      );
      onCloseHeightWeightPicker();
    },
    [heightWeightPicker.activePicker, onCloseHeightWeightPicker]
  );

  const validateWaliInformation = useCallback(
    (data: any[]): string | null => {
      const waliFields: Record<string, { value: string; label: string }> = {};

      data.forEach((item) => {
        if (item?.category === 'wali-0') {
          const value = item?.selected?.value?.trim() || '';
          if (item.id === 'firstName') {
            waliFields.firstName = { value, label: t(LanguageKeys.firstName) };
          } else if (item.id === 'lastName') {
            waliFields.lastName = { value, label: t(LanguageKeys.lastName) };
          } else if (item.id === 'phoneNumber') {
            waliFields.phoneNumber = {
              value,
              label: t(LanguageKeys.phoneNumber),
            };
          } else if (item.id === 'email') {
            waliFields.email = { value, label: t(LanguageKeys.email) };
          }
        }
      });

      if (!waliFields.firstName?.value) {
        return `${t(LanguageKeys.enterFirstName)} is required`;
      }
      if (!waliFields.lastName?.value) {
        return `${t(LanguageKeys.enterLastName)} is required`;
      }
      if (!waliFields.phoneNumber?.value) {
        return `${t(LanguageKeys.phoneNumber)} is required`;
      }
      if (!waliFields.email?.value) {
        return `${t(LanguageKeys.email)} is required`;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(waliFields.email.value)) {
        return t(LanguageKeys.invalidEmailError);
      }

      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      const phoneValue = waliFields.phoneNumber.value.replace(
        /[\s\-\+\(\)]/g,
        ''
      );
      if (
        !phoneRegex.test(waliFields.phoneNumber.value) ||
        phoneValue.length < 8
      ) {
        return t(LanguageKeys.invalidPhoneNumber);
      }

      return null;
    },
    [t]
  );

  const onUpdatePress = useCallback(async () => {
    const isWaliInformation =
      from === 'waliInformation' || formData[0]?.category === 'wali-0';

    if (isWaliInformation) {
      const validationError = validateWaliInformation(formData);
      if (validationError) {
        flashErrorMessage(validationError);
        return;
      }
    }

    setUpdateLoader(true);
    updateDetails(formData)
      .then(async (res: any) => {
        if (Object.keys(res).length !== 0) {
          const updatedUser = {
            ...currentUser,
            detail: res,
          };
          await setData(storageKeys.USER, updatedUser);
          updateCurrentUser(updatedUser);
        }
        flashSuccessMessage();
        setUpdateLoader(false);
        onClose();
        if (fetchData) {
          fetchData();
        }
      })
      .catch(() => setUpdateLoader(false));
  }, [
    currentUser,
    formData,
    from,
    setData,
    storageKeys.USER,
    updateCurrentUser,
    onClose,
    fetchData,
    validateWaliInformation,
  ]);

  const ScallingButton = useCallback(
    ({ item }: any) => {
      const { data, title, selected } = item;
      const { scale, value } = selected;

      const scallingKeys: any[] = [];
      data.forEach((element: any) => {
        scallingKeys.push(element?.scale);
      });
      let values = data[0]?.values;

      if (scale && scale.length !== 0) {
        data.forEach((element: any) => {
          if (element?.scale === scale) {
            values = element?.values;
          }
        });
      }

      return (
        <View style={Styles.scallingBtnOuterCon}>
          <PickerButton
            outerLabel={'Scale'}
            buttonText={scale && scale.length !== 0 ? scale : LanguageKeys.none}
            onPress={openHeightWeightPicker.bind(
              null,
              scallingKeys,
              title,
              `${title}Scale`
            )}
            buttonContainer={{ width: wp(30) }}
            outerLabelStyle={{ alignSelf: 'flex-start' }}
          />
          <PickerButton
            outerLabel={title}
            buttonText={
              value && value.length !== 0
                ? JSON.stringify(value)
                : LanguageKeys.none
            }
            onPress={openHeightWeightPicker.bind(null, values, title, title)}
            buttonContainer={{ width: wp(45) }}
          />
        </View>
      );
    },
    [openHeightWeightPicker]
  );

  const renderList = useCallback(
    ({ item }: any) => {
      const { data, title, selected, type, placeholder, id } = item;
      const { value } = selected;
      const isMale = currentUser?.gender === 'female' ? false : true;
      const hideItem =
        (id === 'doYouHaveABeard' && !isMale) || (id === 'hijab-0' && isMale);
      return hideItem ? null : (
        <View style={Styles.itemContainer}>
          {type === 'input' ? (
            <IconInput
              label={title}
              outerLabelStyle={Styles.inputLabel}
              placeholder={placeholder}
              inputStyle={Styles.input}
              value={
                focusedInput.activeInputId === id ? focusedInput.value : value
              }
              onChangeText={onChangeInput}
              onFocus={onInputFocus.bind(null, id, value, item)}
              onBlur={onBlurInput}
            />
          ) : type === 'scalling' ? (
            <ScallingButton item={item} />
          ) : (
            <PickerButton
              outerLabel={title}
              buttonText={
                typeof value === 'number'
                  ? value === 1
                    ? 'Yes'
                    : value === 0
                      ? 'No'
                      : JSON.stringify(value)
                  : value && value.length !== 0
                    ? value
                    : LanguageKeys.notYetProvided
              }
              onPress={openPicker.bind(null, data, title, id)}
            />
          )}
        </View>
      );
    },
    [
      currentUser?.gender,
      focusedInput,
      onBlurInput,
      onChangeInput,
      onInputFocus,
      openHeightWeightPicker,
      openPicker,
      ScallingButton,
    ]
  );

  const renderListFooter = useCallback(() => {
    return (
      <Button
        text={LanguageKeys.update}
        buttonStyle={Styles.updateBtn}
        onPress={onUpdatePress}
        disabled={updateLoader}
        loading={updateLoader}
        loadingMessage={LanguageKeys.updating}
      />
    );
  }, [onUpdatePress, updateLoader]);

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      backdropOpacity={0.5}
      animationIn="zoomIn"
      animationOut="zoomOut"
      style={Styles.modal}
    >
      <View style={Styles.innerCon}>
        <Ripple
          style={{
            alignSelf: Rtl ? 'flex-start' : 'flex-end',
            marginHorizontal: wp(-2),
          }}
          onPress={onClose}
        >
          <AntDesign name="close" size={wp(8)} color={Colors.color1} />
        </Ripple>
        <Text style={Styles.header}>{from}</Text>
        <FlatList
          data={formData}
          renderItem={renderList}
          contentContainerStyle={Styles.listContainer}
          showsVerticalScrollIndicator={false}
          // ListFooterComponent={renderListFooter}
          keyboardDismissMode={'none'}
        />
        {renderListFooter()}
      </View>

      <Picker
        visible={picker.visible}
        onClose={onClosePicker}
        onPress={onPickerItemPress}
        data={picker.data}
        headerTitle={picker.headerTitle}
        loader={pickerDataLoader}
      />
      <HeightWeightPicker
        visible={heightWeightPicker.visible}
        onClose={onCloseHeightWeightPicker}
        onPress={onHeightWeightPickerItemPress}
        data={heightWeightPicker.data}
        headerTitle={heightWeightPicker.headerTitle}
      />
    </Modal>
  );
};

export default EditInfoCardModal;

const Styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
  },
  innerCon: {
    backgroundColor: Colors.color2,
    width: wp(90),
    borderRadius: 4,
    height: hp(80),
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
  },
  header: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium2,
    lineHeight: wp(6.5),
    marginBottom: hp(1),
  },
  itemContainer: {
    marginTop: hp(4),
  },
  listContainer: {
    // paddingBottom: hp(10),
  },
  input: {
    width: wp(80),
  },
  inputLabel: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small2,
    lineHeight: wp(4.5),
  },
  updateBtn: {
    marginTop: hp(5),
  },
  scallingBtnOuterCon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
