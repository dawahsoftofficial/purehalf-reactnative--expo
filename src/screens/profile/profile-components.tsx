import React, { memo } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';

import { Button, ButtonPicker, ModalLoader, Text } from '../../components';
import { hp, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors } from '../../res';
import Styles from './Styles';

export type BlockActionValue = string;
export type BlockPickerOption = { label: string; value: BlockActionValue };

type TaglineSectionProps = {
  rtl: boolean;
  tagline?: string;
  isEditing: boolean;
  inputValue: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  onEditPress: () => void;
  onCancel: () => void;
  isOwnProfile: boolean;
};

export const TaglineSection = memo(function TaglineSection({
  rtl,
  tagline,
  isEditing,
  inputValue,
  onChange,
  onSubmit,
  onEditPress,
  onCancel,
  isOwnProfile,
}: TaglineSectionProps) {
  if (isEditing) {
    return (
      <View style={Styles.tagLineOuterCon}>
        <View
          style={[
            Styles.tagLineHeaderRow,
            { flexDirection: rtl ? 'row-reverse' : 'row' },
          ]}
        >
          <TextInput
            style={[
              Styles.tagLineInput,
              { textAlign: rtl ? 'right' : 'left', flex: 1 },
            ]}
            placeholder={'Enter One line about yourself'}
            placeholderTextColor={Colors.color1}
            onChangeText={onChange}
            value={inputValue}
          />
          <Ripple style={Styles.tagLineSubmitBtn} onPress={onSubmit}>
            <AntDesign name="check" color={Colors.theme} size={wp(6)} />
          </Ripple>
          <Ripple
            style={[
              Styles.tagLineSubmitBtn,
              { backgroundColor: Colors.blackRGBA25 },
            ]}
            onPress={onCancel}
          >
            <AntDesign name="close" color={Colors.color1} size={wp(6)} />
          </Ripple>
        </View>
      </View>
    );
  }

  if (!isOwnProfile && !tagline) {
    return <View style={{ marginBottom: hp(5) }} />;
  }

  return (
    <View style={Styles.tagLineOuterCon}>
      <View
        style={[
          Styles.tagLineHeaderRow,
          { flexDirection: rtl ? 'row-reverse' : 'row' },
        ]}
      >
        <Text style={Styles.tagLineHeading} numberOfLines={1}>
          {LanguageKeys.tagline}
        </Text>
        {isOwnProfile ? (
          <Ripple style={Styles.editButton} onPress={onEditPress}>
            <Feather name="edit-2" color={Colors.color1} size={wp(4)} />
          </Ripple>
        ) : null}
      </View>
      {tagline ? (
        <Text
          style={[Styles.tagLineText, { textAlign: rtl ? 'right' : 'left' }]}
          numberOfLines={3}
        >
          {tagline}
        </Text>
      ) : null}
    </View>
  );
});

type ErrorRetryProps = {
  onRetry: () => void;
};

export const ErrorRetry = memo(function ErrorRetry({
  onRetry,
}: ErrorRetryProps) {
  return (
    <View>
      <Text style={Styles.somethingWentWrontText}>
        {LanguageKeys.somethingWentWrong}
      </Text>
      <Button
        text={LanguageKeys.tryAgain}
        onPress={onRetry}
        buttonStyle={Styles.tryAgainWrapper}
        textStyle={Styles.tryAgainText}
      />
    </View>
  );
});

type BlockPickerSheetProps = {
  visible: boolean;
  data: BlockPickerOption[];
  headerTitle: string;
  onClose: () => void;
  onButtonPress: (item: BlockPickerOption) => void;
};

export const BlockPickerSheet = memo(function BlockPickerSheet({
  visible,
  data,
  headerTitle,
  onClose,
  onButtonPress,
}: BlockPickerSheetProps) {
  if (!visible) {
    return null;
  }
  return (
    <ButtonPicker
      visible={true}
      data={data}
      onClose={onClose}
      headerTitle={headerTitle}
      onButtonPress={onButtonPress}
    />
  );
});

type ScreenLoaderProps = {
  visible: boolean;
  message: string;
};

export const ScreenLoader = memo(function ScreenLoader({
  visible,
  message,
}: ScreenLoaderProps) {
  return <ModalLoader visible={visible} message={message} />;
});

type ContentScrollProps = {
  children: React.ReactNode;
  scrollRef: React.RefObject<ScrollView | null>;
};

export const ContentScroll = memo(function ContentScroll({
  children,
  scrollRef,
}: ContentScrollProps) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} ref={scrollRef}>
      {children}
    </ScrollView>
  );
});
