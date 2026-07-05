/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import {
  Button,
  Container,
  Header,
  HeightWeightPicker,
  IconInput,
  Picker,
  PickerButton,
} from '../../components';
import { hp, wp } from '../../global';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors } from '../../res';
import {
  ApiServices,
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

type FocusedInputState = {
  activeInputId: string;
  value: any;
  item: any;
};

const EditProfileGroup = ({ navigation, route }: any) => {
  const { title = '', data: initialData = [] } = route?.params ?? {};

  const Rtl = CheckRtl();
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const { setData, storageKeys } = StorageManager;

  const [formData, setFormData] = useState<any[]>(() =>
    JSON.parse(JSON.stringify(initialData))
  );
  const [pickerDataLoader, setPickerDataLoader] = useState(false);
  const [updateLoader, setUpdateLoader] = useState(false);
  const [focusedInput, setFocusedInput] = useState<FocusedInputState>({
    activeInputId: '',
    value: '',
    item: {},
  });
  const [picker, setPicker] = useState<PickerState>({
    visible: false,
    data: [],
    headerTitle: '',
    activePicker: '',
  });
  const [heightWeightPicker, setHeightWeightPicker] = useState<PickerState>({
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
    (pData: any, headerTitle: any, activePicker: any) => {
      setHeightWeightPicker({
        visible: true,
        headerTitle,
        data: pData,
        activePicker,
      });
    },
    []
  );

  const getApiData = useCallback((id: any) => {
    return new Promise((resolve, reject) => {
      if (id === 'language') {
        ApiServices.getLanguages()
          .then((d: any) => resolve(d))
          .catch(() => reject(''));
      } else if (id === 'nationality') {
        ApiServices.getNationality()
          .then((d: any) => resolve(d))
          .catch(() => reject(''));
      } else {
        reject('');
      }
    });
  }, []);

  const openPicker = useCallback(
    async (pData: any, headerTitle: any, id: any) => {
      if (id === 'language' || id === 'nationality') {
        setPickerDataLoader(true);
        getApiData(id)
          .then(async (d: any) => {
            if (d) {
              const newData: any[] = [];
              for await (const element of d) {
                newData.push({ id: element?.id, value: element?.name });
              }
              setPicker({
                visible: true,
                headerTitle,
                data: newData,
                activePicker: headerTitle,
              });
            }
            setPickerDataLoader(false);
          })
          .catch(() => setPickerDataLoader(false));
        return;
      }
      if (currentUser?.gender === 'male' && id === 'martial-0') {
        setPicker({
          visible: true,
          headerTitle,
          data: pData?.filter((val: any) => val?.value !== 'Widowed'),
          activePicker: headerTitle,
        });
      } else {
        setPicker({
          visible: true,
          headerTitle,
          data: pData,
          activePicker: headerTitle,
        });
      }
    },
    [currentUser, getApiData]
  );

  const onInputFocus = useCallback((id: any, value: any, item: any) => {
    setFocusedInput({ activeInputId: id, value, item });
  }, []);

  const onBlurInput = useCallback(() => {
    const { activeInputId, item, value } = focusedInput;
    const { category } = item;
    setFormData((prev: any[]) =>
      prev.map((element: any) =>
        element.id === activeInputId
          ? { ...element, selected: { id: activeInputId, value, category } }
          : element
      )
    );
  }, [focusedInput]);

  const onChangeInput = useCallback(
    (text: any) => {
      setFocusedInput((prev) => ({ ...prev, value: text }));
      setFormData((prev: any[]) =>
        prev.map((element: any) =>
          element.title === focusedInput?.item?.title
            ? { ...element, selected: { ...element.selected, value: text } }
            : element
        )
      );
    },
    [focusedInput]
  );

  const onPickerItemPress = useCallback(
    (item: any) => {
      setFormData((prev: any[]) =>
        prev.map((element: any) =>
          element.title === picker.activePicker
            ? { ...element, selected: item }
            : element
        )
      );
      onClosePicker();
    },
    [onClosePicker, picker.activePicker]
  );

  const onHeightWeightPickerItemPress = useCallback(
    (item: any) => {
      setFormData((prev: any[]) =>
        prev.map((element: any) => {
          if (element.type === 'scalling') {
            if (heightWeightPicker.activePicker === element.title) {
              return {
                ...element,
                selected: { ...element.selected, value: item },
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

  const onSavePress = useCallback(async () => {
    setUpdateLoader(true);
    updateDetails(formData)
      .then(async (res: any) => {
        if (res && Object.keys(res).length !== 0) {
          const updatedUser = { ...currentUser, detail: res };
          await setData(storageKeys.USER, updatedUser);
          updateCurrentUser(updatedUser);
        }
        flashSuccessMessage();
        setUpdateLoader(false);
        navigation.goBack();
      })
      .catch(() => setUpdateLoader(false));
  }, [
    currentUser,
    formData,
    navigation,
    setData,
    storageKeys.USER,
    updateCurrentUser,
  ]);

  const ScallingButton = useCallback(
    ({ item }: any) => {
      const { data: sData, title: sTitle, selected } = item;
      const { scale, value } = selected;
      const scallingKeys: any[] = [];
      sData.forEach((el: any) => scallingKeys.push(el?.scale));
      let values = sData[0]?.values;
      if (scale && scale.length !== 0) {
        sData.forEach((el: any) => {
          if (el?.scale === scale) values = el?.values;
        });
      }
      return (
        <View style={Styles.scallingRow}>
          <PickerButton
            outerLabel={'Scale'}
            buttonText={scale && scale.length !== 0 ? scale : LanguageKeys.none}
            onPress={openHeightWeightPicker.bind(
              null,
              scallingKeys,
              sTitle,
              `${sTitle}Scale`
            )}
            buttonContainer={{ width: wp(30) }}
            outerLabelStyle={{ alignSelf: 'flex-start' }}
          />
          <PickerButton
            outerLabel={sTitle}
            buttonText={
              value && value.length !== 0
                ? JSON.stringify(value)
                : LanguageKeys.none
            }
            onPress={openHeightWeightPicker.bind(null, values, sTitle, sTitle)}
            buttonContainer={{ width: wp(45) }}
          />
        </View>
      );
    },
    [openHeightWeightPicker]
  );

  const renderItem = useCallback(
    ({ item }: any) => {
      const {
        data: iData,
        title: iTitle,
        selected,
        type,
        placeholder,
        id,
      } = item;
      const { value } = selected;
      const isMale = currentUser?.gender === 'female' ? false : true;
      const hideItem =
        (id === 'doYouHaveABeard' && !isMale) || (id === 'hijab-0' && isMale);
      if (hideItem) return null;
      return (
        <View style={Styles.itemContainer}>
          {type === 'input' ? (
            <IconInput
              label={iTitle}
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
              outerLabel={iTitle}
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
              onPress={openPicker.bind(null, iData, iTitle, id)}
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
      openPicker,
      ScallingButton,
    ]
  );

  return (
    <Container style={Styles.screen}>
      <Header title={title} navigation={navigation} titleVariant="display" />
      <FlatList
        data={formData}
        renderItem={renderItem}
        keyExtractor={(item: any, index: number) => `${item?.id ?? index}`}
        contentContainerStyle={Styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="none"
        keyboardShouldPersistTaps="handled"
      />
      <View style={Styles.footer}>
        <Button
          text={LanguageKeys.update}
          onPress={updateLoader ? undefined : onSavePress}
          disabled={updateLoader}
          loading={updateLoader}
          loadingMessage={LanguageKeys.updating}
        />
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
    </Container>
  );
};

export default EditProfileGroup;

const Styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.appBg,
  },
  listContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
    paddingBottom: hp(3),
  },
  itemContainer: {
    marginTop: hp(2.4),
  },
  input: {
    width: wp(80),
  },
  scallingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(2),
    backgroundColor: Colors.appBg,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
});
