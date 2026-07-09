/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';

import {
  Button,
  Container,
  Header,
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
  flashSuccessMessage,
  StorageManager,
  useGlobalContext,
} from '../../services';
import { updateDetails } from './Funtions';
import {
  getOptionKey,
  getOptionLabel,
  getProgressLabel,
  getVisibleProfileFields,
  isOptionSelected,
  shouldUseTagOptions,
} from './profile-editor-flow';

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

// Inline single-select pill group for option fields with only a few choices
// (e.g. Yes/No, Future Plans). Larger option lists keep the modal PickerButton.
const OptionTags = ({ item, options, onSelect, rtl }: any) => (
  <View>
    <View
      style={[
        Styles.tagRow,
        {
          flexDirection: rtl ? 'row-reverse' : 'row',
        },
      ]}
    >
      {options.map((opt: any) => {
        const on = isOptionSelected(item, opt);
        const optLabel = getOptionLabel(item, opt);
        return (
          <Ripple
            key={getOptionKey(opt)}
            onPress={() => onSelect(item, opt)}
            style={[Styles.tag, on && Styles.tagOn]}
          >
            <Text style={[Styles.tagTxt, on && Styles.tagTxtOn]}>
              {optLabel}
            </Text>
          </Ripple>
        );
      })}
    </View>
  </View>
);

const EditProfileGroup = ({ navigation, route }: any) => {
  const { title = '', data: initialData = [] } = route?.params ?? {};

  const Rtl = CheckRtl();
  const { t } = useTranslation();
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const { setData, storageKeys } = StorageManager;

  const [formData, setFormData] = useState<any[]>(() =>
    JSON.parse(JSON.stringify(initialData))
  );
  const [activeIndex, setActiveIndex] = useState(0);
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
  const visibleFields = useMemo(
    () => getVisibleProfileFields(formData, currentUser?.gender),
    [currentUser?.gender, formData]
  );

  const activeItem = visibleFields[activeIndex];
  const progressLabel = getProgressLabel(
    t(title),
    activeIndex,
    visibleFields.length
  );
  const isFirstStep = activeIndex === 0;
  const isLastStep =
    visibleFields.length > 0 && activeIndex === visibleFields.length - 1;

  useEffect(() => {
    if (activeIndex > 0 && activeIndex >= visibleFields.length) {
      setActiveIndex(Math.max(visibleFields.length - 1, 0));
    }
  }, [activeIndex, visibleFields.length]);

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

  // Select-only (no clear): tapping an inline tag sets that field's value.
  const onSelectOption = useCallback((tappedItem: any, opt: any) => {
    setFormData((prev: any[]) =>
      prev.map((element: any) =>
        element.id === tappedItem.id ? { ...element, selected: opt } : element
      )
    );
  }, []);

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

  const goBackStep = useCallback(() => {
    setActiveIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goNextStep = useCallback(() => {
    setActiveIndex((prev) =>
      visibleFields.length ? Math.min(prev + 1, visibleFields.length - 1) : 0
    );
  }, [visibleFields.length]);

  const onPrimaryPress = useCallback(() => {
    if (isLastStep) {
      void onSavePress();
      return;
    }
    goNextStep();
  }, [goNextStep, isLastStep, onSavePress]);

  const onSkipPress = useCallback(() => {
    if (isLastStep) {
      void onSavePress();
      return;
    }
    goNextStep();
  }, [goNextStep, isLastStep, onSavePress]);

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

  const renderActiveControl = useCallback(
    (item: any) => {
      if (!item) return null;

      const {
        data: iData,
        title: iTitle,
        selected,
        type,
        placeholder,
        id,
      } = item;
      const { value } = selected ?? {};

      // Option fields with only a few choices render as inline pills instead of
      // opening the modal picker. Language/nationality load options lazily
      // (empty here), so they stay on the PickerButton.
      const isOptionType = type === 'dropDown' || type === 'dropDownBinary';
      let tagOptions: any[] = isOptionType && Array.isArray(iData) ? iData : [];
      if (currentUser?.gender === 'male' && id === 'martial-0') {
        tagOptions = tagOptions.filter((v: any) => v?.value !== 'Widowed');
      }
      const useTags = shouldUseTagOptions(item, tagOptions);

      return (
        <View style={Styles.questionCard}>
          <Text style={Styles.questionEyebrow}>{progressLabel}</Text>
          <View style={Styles.progressTrack}>
            <View
              style={[
                Styles.progressFill,
                {
                  width: `${
                    visibleFields.length
                      ? ((activeIndex + 1) / visibleFields.length) * 100
                      : 0
                  }%`,
                },
              ]}
            />
          </View>
          <Text style={Styles.questionTitle}>{iTitle}</Text>

          <View style={Styles.controlWrap}>
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
            ) : useTags ? (
              <OptionTags
                item={item}
                options={tagOptions}
                onSelect={onSelectOption}
                rtl={Rtl}
              />
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
      onSelectOption,
      Rtl,
      ScallingButton,
      progressLabel,
      activeIndex,
      visibleFields.length,
    ]
  );

  return (
    <Container style={Styles.screen}>
      <Header title={title} navigation={navigation} titleVariant="display" />
      <View style={Styles.content}>
        {visibleFields.length > 0 ? (
          renderActiveControl(activeItem)
        ) : (
          <View style={Styles.emptyCard}>
            <Text style={Styles.emptyText}>{LanguageKeys.notYetProvided}</Text>
          </View>
        )}
      </View>
      <View style={Styles.footer}>
        <View style={Styles.footerRow}>
          {!isFirstStep ? (
            <Ripple
              onPress={updateLoader ? undefined : goBackStep}
              style={[Styles.secondaryBtn, updateLoader && Styles.disabledBtn]}
              disabled={updateLoader}
            >
              <Text style={Styles.secondaryBtnText}>{LanguageKeys.back}</Text>
            </Ripple>
          ) : null}
          <Ripple
            onPress={
              updateLoader || visibleFields.length === 0
                ? undefined
                : onSkipPress
            }
            style={[
              Styles.secondaryBtn,
              (updateLoader || visibleFields.length === 0) &&
                Styles.disabledBtn,
            ]}
            disabled={updateLoader || visibleFields.length === 0}
          >
            <Text style={Styles.secondaryBtnText}>{LanguageKeys.skip}</Text>
          </Ripple>
          <View style={Styles.primaryBtnWrap}>
            <Button
              text={isLastStep ? LanguageKeys.update : LanguageKeys.next}
              onPress={
                updateLoader || visibleFields.length === 0
                  ? undefined
                  : onPrimaryPress
              }
              disabled={updateLoader || visibleFields.length === 0}
              loading={updateLoader}
              loadingMessage={LanguageKeys.updating}
            />
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
  },
  questionCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 16,
    paddingHorizontal: wp(4),
    paddingVertical: hp(2.2),
  },
  questionEyebrow: {
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small1,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.lavender,
    overflow: 'hidden',
    marginTop: hp(1),
    marginBottom: hp(2),
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  questionTitle: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small3,
    lineHeight: wp(6.2),
  },
  controlWrap: {
    marginTop: hp(2),
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 16,
    padding: wp(5),
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small2,
  },
  input: {
    width: wp(80),
  },
  scallingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagRow: {
    flexWrap: 'wrap',
    gap: wp(2),
  },
  tag: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.1),
    borderRadius: 999,
    backgroundColor: Colors.lavender,
  },
  tagOn: {
    backgroundColor: Colors.primary,
  },
  tagTxt: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small1,
  },
  tagTxtOn: {
    color: Colors.color2,
  },
  footer: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(2),
    backgroundColor: Colors.appBg,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  secondaryBtn: {
    minHeight: hp(5.5),
    paddingHorizontal: wp(4),
    borderRadius: 999,
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small2,
  },
  disabledBtn: {
    opacity: 0.45,
  },
  primaryBtnWrap: {
    flex: 1,
  },
});
