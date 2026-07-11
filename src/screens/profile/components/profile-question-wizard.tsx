/* eslint-disable @typescript-eslint/no-explicit-any, react/prop-types -- prop-types is a
   JS-era check fully superseded by TS here; it also false-positives on the
   memo(forwardRef(...)) composition below, which TS already type-checks correctly. */
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ripple from 'react-native-material-ripple';

import {
  Button,
  IconInput,
  Picker,
  PickerButton,
  Text,
} from '../../../components';
import { hp, Typography, wp } from '../../../global';
import { CheckRtl, LanguageKeys } from '../../../languages';
import { Colors, Fonts } from '../../../res';
import { ApiServices } from '../../../services';
import { getEyeColorSwatch } from '../eye-color-swatches';
import {
  buildScalingSelected,
  convertScaleValue,
  formatScaleValue,
  getOptionKey,
  getOptionLabel,
  getProgressLabel,
  getScalingDisplay,
  getVisibleProfileFields,
  isActiveItemAnswered,
  isOptionSelected,
  normalizeScalingSelected,
  shouldUseTagOptions,
  splitSuggestionValue,
  toggleSuggestionInValue,
} from '../profile-editor-flow';

const RULER_TICK_WIDTH = Math.round(wp(2.5));

type PickerState = {
  visible: boolean;
  data: any[];
  headerTitle: string;
  activePicker: string;
};

type LiveAnswered = { id: string; answered: boolean } | null;

type TextQuestionInputProps = {
  id: string;
  placeholder?: string;
  initialValue: string;
  multiline?: boolean;
  minLength?: number;
  maxLength?: number;
  suggestions?: string[];
  onAnsweredChange: (id: string, answered: boolean) => void;
  onCommit: (id: string, value: string) => void;
};

// Exposes the live, not-yet-blurred value so the wizard can force a commit
// before advancing — see the note on getValue below.
export type TextQuestionInputHandle = {
  getValue: () => string;
};

// Owns its own per-keystroke text state so typing never touches the wizard's
// state and never re-renders the surrounding question card (which was
// forcing a full card re-render on every keystroke — a known trigger for
// Android controlled-TextInput glitches where rapid/held-key typing gets
// visibly reverted). Only reports upward on blur (the committed value) and
// when answered/unanswered flips (for the Next-button gate), not per
// keystroke. Keyed by the caller on the field's id so switching questions
// remounts it fresh instead of carrying over the previous question's text.
//
// Tapping Next/Update while still focused on this field doesn't reliably
// fire onBlur before the wizard reads its committed formData — RN's blur
// event isn't guaranteed to land before another touch target's onPress, and
// unmounting a focused input (this component remounts per-question via
// `key`) doesn't fire onBlur at all. getValue() lets the wizard pull the
// current text directly and commit it itself right before advancing,
// instead of depending on blur having already happened.
const TextQuestionInput = React.memo(
  React.forwardRef<TextQuestionInputHandle, TextQuestionInputProps>(
    (
      {
        id,
        placeholder,
        initialValue,
        multiline = false,
        minLength = 1,
        maxLength,
        suggestions,
        onAnsweredChange,
        onCommit,
      },
      ref
    ) => {
      const [value, setValue] = useState(initialValue);
      const wasAnswered = useRef(
        (initialValue?.trim().length ?? 0) >= minLength
      );

      useImperativeHandle(ref, () => ({ getValue: () => value }), [value]);

      const onChangeText = useCallback(
        (text: string) => {
          setValue(text);
          const answered = (text?.trim().length ?? 0) >= minLength;
          if (answered !== wasAnswered.current) {
            wasAnswered.current = answered;
            onAnsweredChange(id, answered);
          }
        },
        [id, minLength, onAnsweredChange]
      );

      const onBlur = useCallback(() => {
        onCommit(id, value);
      }, [id, value, onCommit]);

      // Tapping a suggestion toggles it in/out of the comma-joined answer
      // rather than replacing it, so multiple suggestions (and the user's
      // own typed words) can coexist.
      const selectedSuggestions = useMemo(
        () => new Set(splitSuggestionValue(value).map((s) => s.toLowerCase())),
        [value]
      );

      const onSuggestionPress = useCallback(
        (label: string) => onChangeText(toggleSuggestionInValue(value, label)),
        [value, onChangeText]
      );

      return (
        <View>
          <IconInput
            placeholder={placeholder}
            outerLabelStyle={Styles.hiddenControlLabel}
            containerStyle={Styles.labelLessControl}
            inputStyle={Styles.input}
            value={value}
            onChangeText={onChangeText}
            onBlur={onBlur}
            multiline={multiline}
            numberOfLines={multiline ? 5 : undefined}
            maxLength={maxLength}
          />
          {maxLength ? (
            <Text style={Styles.charCounter}>
              {`${value?.length ?? 0}/${maxLength}`}
            </Text>
          ) : null}
          {suggestions?.length ? (
            <View style={Styles.suggestionWrap}>
              {suggestions.map((label) => {
                const on = selectedSuggestions.has(label.toLowerCase());
                return (
                  <Ripple
                    key={label}
                    style={[
                      Styles.suggestionChip,
                      on && Styles.suggestionChipOn,
                    ]}
                    onPress={() => onSuggestionPress(label)}
                  >
                    <Text
                      style={[
                        Styles.suggestionChipTxt,
                        on && Styles.suggestionChipTxtOn,
                      ]}
                    >
                      {label}
                    </Text>
                  </Ripple>
                );
              })}
            </View>
          ) : null}
        </View>
      );
    }
  )
);

// Inline single-select option list for fields with only a few choices
// (e.g. Yes/No, Future Plans). Each option is a full-width row. Larger option
// lists keep the modal PickerButton.
const OptionTags = ({ item, options, onSelect, rtl }: any) => (
  <View style={Styles.optionList}>
    {options.map((opt: any) => {
      const on = isOptionSelected(item, opt);
      const optLabel = getOptionLabel(item, opt);
      const swatch = item?.id === 'eye-0' ? getEyeColorSwatch(optLabel) : {};
      const { color, gradient } = swatch;
      const hasSwatch = Boolean(color || gradient);
      const label = (
        <Text
          style={[
            Styles.optionRowTxt,
            { textAlign: rtl ? 'right' : 'left' },
            on && Styles.optionRowTxtOn,
          ]}
        >
          {optLabel}
        </Text>
      );
      return (
        <Ripple
          key={getOptionKey(opt)}
          onPress={() => onSelect(item, opt)}
          style={[Styles.optionRow, on && Styles.optionRowOn]}
        >
          {hasSwatch ? (
            <View
              style={[
                Styles.optionRowInner,
                { flexDirection: rtl ? 'row-reverse' : 'row' },
              ]}
            >
              {color ? (
                <View
                  style={[Styles.optionSwatch, { backgroundColor: color }]}
                />
              ) : gradient ? (
                <LinearGradient
                  colors={gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={Styles.optionSwatch}
                />
              ) : null}
              {label}
            </View>
          ) : (
            label
          )}
        </Ripple>
      );
    })}
  </View>
);

// Memoized so per-frame readout updates while dragging don't re-render the
// full tick strip (up to ~350 views for lbs).
const RulerTicks = React.memo(function RulerTicks({ values, scale }: any) {
  return (
    <>
      {values.map((v: number) => {
        const major = scale === 'ft' ? v % 12 === 0 : v % 10 === 0;
        const mid = !major && (scale === 'ft' ? v % 6 === 0 : v % 5 === 0);
        return (
          <View key={v} style={Styles.rulerTickSlot}>
            <View
              style={[
                Styles.rulerTick,
                mid && Styles.rulerTickMid,
                major && Styles.rulerTickMajor,
              ]}
            />
            {major ? (
              <Text style={Styles.rulerTickLabel}>
                {scale === 'ft' ? `${Math.floor(v / 12)}′` : String(v)}
              </Text>
            ) : null}
          </View>
        );
      })}
    </>
  );
});

// Inline unit toggle + ruler slider for height/weight. The ruler snaps to the
// integer steps of the active scale's values list; switching scale converts
// the current value instead of clearing it. Height commits as cm regardless
// of the display unit (see profile-editor-flow).
const ScaleRuler = ({ item, onSelect }: any) => {
  const scaleEntries: any[] = Array.isArray(item?.data) ? item.data : [];
  const display = getScalingDisplay(item);
  const activeEntry =
    scaleEntries.find((entry: any) => entry?.scale === display.scale) ??
    scaleEntries[0];
  const activeScale = activeEntry?.scale ?? display.scale;
  const values: number[] = activeEntry?.values ?? [];
  const minValue = values[0] ?? 0;
  const maxValue = values.length ? values[values.length - 1] : 0;
  const otherEntry = scaleEntries.find(
    (entry: any) => entry?.scale !== activeScale
  );

  const scrollRef = useRef<ScrollView>(null);
  const [rulerWidth, setRulerWidth] = useState(0);
  const [live, setLive] = useState<{ scale: string; value: number } | null>(
    null
  );

  const clampValue = (v: number) => Math.min(Math.max(v, minValue), maxValue);
  const committedValue =
    display.value === null
      ? (values[Math.floor(values.length / 2)] ?? minValue)
      : clampValue(display.value);
  const shownValue =
    live && live.scale === activeScale ? live.value : committedValue;

  const valueForOffset = (x: number) =>
    clampValue(minValue + Math.round(x / RULER_TICK_WIDTH));

  const onRulerScroll = (event: any) => {
    setLive({
      scale: activeScale,
      value: valueForOffset(event.nativeEvent.contentOffset.x),
    });
  };

  const onRulerRest = (event: any) => {
    onSelect(
      item,
      buildScalingSelected(
        item,
        activeScale,
        valueForOffset(event.nativeEvent.contentOffset.x)
      )
    );
  };

  // Fires on mount, when the side spacers get their measured width, and when
  // the tick strip changes after a unit switch — exactly the moments the
  // scroll position must be re-derived from the committed value.
  const positionRuler = () => {
    scrollRef.current?.scrollTo({
      x: (committedValue - minValue) * RULER_TICK_WIDTH,
      animated: false,
    });
  };

  const onScalePress = (nextScale: string) => {
    if (!nextScale || nextScale === activeScale) return;
    const nextEntry = scaleEntries.find(
      (entry: any) => entry?.scale === nextScale
    );
    const nextValues: number[] = nextEntry?.values ?? [];
    const nextMin = nextValues[0] ?? 0;
    const nextMax = nextValues.length ? nextValues[nextValues.length - 1] : 0;
    const converted = Math.min(
      Math.max(convertScaleValue(shownValue, activeScale, nextScale), nextMin),
      nextMax
    );
    onSelect(item, buildScalingSelected(item, nextScale, converted));
  };

  const sideSpacer = rulerWidth
    ? Math.max((rulerWidth - RULER_TICK_WIDTH) / 2, 0)
    : 0;

  return (
    <View>
      <View style={Styles.scaleToggleRow}>
        {scaleEntries.map((entry: any) => {
          const on = entry?.scale === activeScale;
          return (
            <Ripple
              key={entry?.scale}
              onPress={() => onScalePress(entry?.scale)}
              style={[Styles.scaleToggleBtn, on && Styles.scaleToggleBtnOn]}
            >
              <Text
                style={[Styles.scaleToggleTxt, on && Styles.scaleToggleTxtOn]}
              >
                {entry?.scale}
              </Text>
            </Ripple>
          );
        })}
      </View>
      <Text style={Styles.rulerReadout}>
        {formatScaleValue(activeScale, shownValue)}
      </Text>
      <Text style={Styles.rulerReadoutAlt}>
        {display.value === null
          ? LanguageKeys.notYetProvided
          : otherEntry
            ? formatScaleValue(
                otherEntry.scale,
                convertScaleValue(shownValue, activeScale, otherEntry.scale)
              )
            : ''}
      </Text>
      <View
        style={Styles.rulerWrap}
        onLayout={(event: any) => setRulerWidth(event.nativeEvent.layout.width)}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={RULER_TICK_WIDTH}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={onRulerScroll}
          onScrollEndDrag={onRulerRest}
          onMomentumScrollEnd={onRulerRest}
          onContentSizeChange={positionRuler}
        >
          <View style={{ width: sideSpacer }} />
          <RulerTicks values={values} scale={activeScale} />
          <View style={{ width: sideSpacer }} />
        </ScrollView>
        <View pointerEvents="none" style={Styles.rulerCenterLine} />
      </View>
      <View style={Styles.rulerEndsRow}>
        <Text style={Styles.rulerEndTxt}>
          {formatScaleValue(activeScale, minValue)}
        </Text>
        <Text style={Styles.rulerEndTxt}>
          {formatScaleValue(activeScale, maxValue)}
        </Text>
      </View>
    </View>
  );
};

type ProfileQuestionWizardProps = {
  fields: any[];
  gender?: string;
  saving?: boolean;
  finalLabel?: string;
  showSkip?: boolean;
  onComplete: (formData: any[]) => void;
  // Called when Back is pressed on the FIRST question — lets a multi-group host
  // (onboarding) step to the previous group. Absent for single-group use (ME).
  onBack?: () => void;
  // Start on the last question instead of the first (used when returning to a
  // previous group via Back, so the user lands where they left off).
  startAtEnd?: boolean;
};

const ProfileQuestionWizard = ({
  fields,
  gender,
  saving = false,
  finalLabel = LanguageKeys.update,
  showSkip = true,
  onComplete,
  onBack,
  startAtEnd = false,
}: ProfileQuestionWizardProps) => {
  const Rtl = CheckRtl();

  const [formData, setFormData] = useState<any[]>(() =>
    JSON.parse(JSON.stringify(fields ?? [])).map(normalizeScalingSelected)
  );
  const [activeIndex, setActiveIndex] = useState(() =>
    startAtEnd
      ? Math.max(getVisibleProfileFields(fields ?? [], gender).length - 1, 0)
      : 0
  );
  const [pickerDataLoader, setPickerDataLoader] = useState(false);
  const [liveAnswered, setLiveAnswered] = useState<LiveAnswered>(null);
  const [picker, setPicker] = useState<PickerState>({
    visible: false,
    data: [],
    headerTitle: '',
    activePicker: '',
  });
  // Points at whichever TextQuestionInput is currently mounted (there's at
  // most one, for the active question), so its live value can be pulled and
  // committed on demand before advancing — see commitPendingText below.
  const activeTextInputRef = useRef<TextQuestionInputHandle | null>(null);

  const visibleFields = useMemo(
    () => getVisibleProfileFields(formData, gender),
    [gender, formData]
  );

  const activeItem = visibleFields[activeIndex];
  const progressLabel = getProgressLabel('', activeIndex, visibleFields.length);
  const isFirstStep = activeIndex === 0;
  const isLastStep =
    visibleFields.length > 0 && activeIndex === visibleFields.length - 1;
  const isAnswered = isActiveItemAnswered(activeItem, liveAnswered);

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
      if (gender === 'male' && id === 'martial-0') {
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
    [gender, getApiData]
  );

  // TextQuestionInput commits on blur; formData is the committed store.
  const onCommitText = useCallback((id: string, value: string) => {
    setFormData((prev: any[]) =>
      prev.map((element: any) =>
        element.id === id
          ? { ...element, selected: { id, value, category: element.category } }
          : element
      )
    );
  }, []);

  const onAnsweredChange = useCallback((id: string, answered: boolean) => {
    setLiveAnswered({ id, answered });
  }, []);

  // Forces the active question's TextQuestionInput (if any) to hand over its
  // live value and commits it into formData directly, without depending on
  // onBlur having fired first — see the note on TextQuestionInputHandle.
  // Returns the up-to-date formData synchronously (setFormData alone
  // wouldn't be visible until the next render) so callers that need it
  // immediately (onComplete) get the real, current data instead of a stale
  // closure.
  const commitPendingText = useCallback((): any[] => {
    const pendingId = activeItem?.type === 'input' ? activeItem.id : null;
    const pendingValue = pendingId
      ? activeTextInputRef.current?.getValue()
      : undefined;
    if (!pendingId || pendingValue === undefined) return formData;

    const next = formData.map((element: any) =>
      element.id === pendingId
        ? {
            ...element,
            selected: {
              id: pendingId,
              value: pendingValue,
              category: element.category,
            },
          }
        : element
    );
    setFormData(next);
    return next;
  }, [activeItem, formData]);

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

  const onSelectOption = useCallback((tappedItem: any, opt: any) => {
    setFormData((prev: any[]) =>
      prev.map((element: any) =>
        element.id === tappedItem.id ? { ...element, selected: opt } : element
      )
    );
  }, []);

  const goBackStep = useCallback(() => {
    commitPendingText();
    setActiveIndex((prev) => Math.max(prev - 1, 0));
  }, [commitPendingText]);

  const goNextStep = useCallback(() => {
    commitPendingText();
    setActiveIndex((prev) =>
      visibleFields.length ? Math.min(prev + 1, visibleFields.length - 1) : 0
    );
  }, [commitPendingText, visibleFields.length]);

  const advance = useCallback(() => {
    if (isLastStep) {
      onComplete(commitPendingText());
      return;
    }
    goNextStep();
  }, [commitPendingText, goNextStep, isLastStep, onComplete]);

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
        multiline,
        minLength,
        maxLength,
        suggestions,
        suggestionsMale,
        suggestionsFemale,
      } = item;
      const { value } = selected ?? {};

      const isOptionType = type === 'dropDown' || type === 'dropDownBinary';
      let tagOptions: any[] = isOptionType && Array.isArray(iData) ? iData : [];
      if (gender === 'male' && id === 'martial-0') {
        tagOptions = tagOptions.filter((v: any) => v?.value !== 'Widowed');
      }
      const useTags = shouldUseTagOptions(item, tagOptions);
      const activeSuggestions =
        (gender === 'female' ? suggestionsFemale : suggestionsMale) ??
        suggestions;

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
              <TextQuestionInput
                key={id}
                ref={activeTextInputRef}
                id={id}
                placeholder={placeholder}
                initialValue={value == null ? '' : String(value)}
                multiline={multiline}
                minLength={minLength}
                maxLength={maxLength}
                suggestions={activeSuggestions}
                onAnsweredChange={onAnsweredChange}
                onCommit={onCommitText}
              />
            ) : type === 'scalling' ? (
              <ScaleRuler item={item} onSelect={onSelectOption} />
            ) : useTags ? (
              <OptionTags
                item={item}
                options={tagOptions}
                onSelect={onSelectOption}
                rtl={Rtl}
              />
            ) : (
              <PickerButton
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
                buttonContainer={Styles.labelLessPickerButton}
                outerLabelStyle={Styles.hiddenControlLabel}
              />
            )}
          </View>
        </View>
      );
    },
    [
      gender,
      onAnsweredChange,
      onCommitText,
      openPicker,
      onSelectOption,
      Rtl,
      progressLabel,
      activeIndex,
      visibleFields.length,
    ]
  );

  return (
    <>
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
        {saving ? (
          <View style={Styles.savingStatus}>
            <View style={Styles.savingAccent} />
            <Text style={Styles.savingStatusText}>{LanguageKeys.updating}</Text>
          </View>
        ) : null}
        <View style={Styles.footerRow}>
          {!isFirstStep || onBack ? (
            <Ripple
              onPress={saving ? undefined : isFirstStep ? onBack : goBackStep}
              style={[Styles.secondaryBtn, saving && Styles.disabledBtn]}
              disabled={saving}
            >
              <Text style={Styles.secondaryBtnText}>{LanguageKeys.back}</Text>
            </Ripple>
          ) : null}
          {showSkip ? (
            <Ripple
              onPress={
                saving || visibleFields.length === 0 ? undefined : advance
              }
              style={[
                Styles.secondaryBtn,
                (saving || visibleFields.length === 0) && Styles.disabledBtn,
              ]}
              disabled={saving || visibleFields.length === 0}
            >
              <Text style={Styles.secondaryBtnText}>{LanguageKeys.skip}</Text>
            </Ripple>
          ) : null}
          <View style={Styles.primaryBtnWrap}>
            <Button
              text={
                saving
                  ? LanguageKeys.updating
                  : isLastStep
                    ? finalLabel
                    : LanguageKeys.next
              }
              onPress={
                saving || visibleFields.length === 0 || !isAnswered
                  ? undefined
                  : advance
              }
              disabled={saving || visibleFields.length === 0 || !isAnswered}
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
    </>
  );
};

export default ProfileQuestionWizard;

const Styles = StyleSheet.create({
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
  hiddenControlLabel: {
    height: 0,
    lineHeight: 0,
    opacity: 0,
  },
  labelLessControl: {
    marginTop: 0,
  },
  charCounter: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small1,
    textAlign: 'right',
    alignSelf: 'flex-end',
    marginTop: hp(0.5),
  },
  suggestionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    marginTop: hp(1.5),
  },
  suggestionChip: {
    paddingHorizontal: wp(3.2),
    paddingVertical: hp(0.9),
    borderRadius: 999,
    backgroundColor: Colors.lavender,
  },
  suggestionChipOn: {
    backgroundColor: Colors.primary,
  },
  suggestionChipTxt: {
    color: Colors.primaryMid,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small1,
  },
  suggestionChipTxtOn: {
    color: Colors.color2,
  },
  labelLessPickerButton: {
    marginTop: 0,
  },
  scaleToggleRow: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: Colors.lavender,
    borderRadius: 999,
    padding: 3,
  },
  scaleToggleBtn: {
    paddingHorizontal: wp(5),
    paddingVertical: hp(0.8),
    borderRadius: 999,
  },
  scaleToggleBtnOn: {
    backgroundColor: Colors.primary,
  },
  scaleToggleTxt: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small1,
  },
  scaleToggleTxtOn: {
    color: Colors.color2,
  },
  rulerReadout: {
    textAlign: 'center',
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_B,
    fontSize: wp(8),
    marginTop: hp(2),
  },
  rulerReadoutAlt: {
    textAlign: 'center',
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small1,
    marginTop: 2,
  },
  rulerWrap: {
    height: 64,
    marginTop: hp(1.5),
  },
  rulerCenterLine: {
    position: 'absolute',
    left: '50%',
    marginLeft: -1,
    top: 0,
    width: 2,
    height: 36,
    borderRadius: 1,
    backgroundColor: Colors.primary,
  },
  rulerTickSlot: {
    width: RULER_TICK_WIDTH,
    height: 64,
    alignItems: 'center',
  },
  rulerTick: {
    width: 1,
    height: 12,
    marginTop: 16,
    backgroundColor: Colors.hairline,
  },
  rulerTickMid: {
    height: 20,
    marginTop: 8,
    backgroundColor: Colors.primaryLite,
  },
  rulerTickMajor: {
    width: 2,
    height: 28,
    marginTop: 0,
    backgroundColor: Colors.primaryMid,
  },
  rulerTickLabel: {
    position: 'absolute',
    top: 36,
    width: 40,
    left: RULER_TICK_WIDTH / 2 - 20,
    textAlign: 'center',
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small1,
  },
  rulerEndsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(0.5),
  },
  rulerEndTxt: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small1,
  },
  optionList: {
    gap: hp(1.2),
  },
  optionRow: {
    width: '100%',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.6),
    borderRadius: 12,
    backgroundColor: Colors.lavender,
  },
  optionRowOn: {
    backgroundColor: Colors.primary,
  },
  optionRowInner: {
    alignItems: 'center',
    gap: wp(2.5),
  },
  optionSwatch: {
    width: wp(4.5),
    height: wp(4.5),
    borderRadius: wp(2.25),
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  optionRowTxt: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small2,
  },
  optionRowTxtOn: {
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
  savingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.2),
    gap: wp(2),
  },
  savingAccent: {
    flex: 1,
    height: 3,
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  savingStatusText: {
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small1,
  },
  secondaryBtn: {
    height: hp(6.5),
    paddingHorizontal: wp(4),
    borderRadius: 16,
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
