import React from 'react';

import { LanguageKeys } from '../../languages';
import { Colors } from '../../res';
import ButtonPicker from './ButtonPicker';

const DeletePicker = (props: any) => {
  const {
    visible = false,
    headerTitle = LanguageKeys.sureDeleteDes,
    onClose = () => null,
    useCustomModal = false,
    actionButtonLabel = LanguageKeys.delete,
  } = props;

  const deletePickerData = [
    {
      label: actionButtonLabel,
      value: 'delete',
      buttonStyle: { backgroundColor: Colors.color24 },
      buttonTextStyle: { color: Colors.color2 },
    },
    {
      label: LanguageKeys.cancel,
      value: 'cancel',
    },
  ];

  const onPickerButtonPress = (item: any) => {
    if (item?.value === 'delete') {
      props?.onDeletePress && props.onDeletePress();
    } else {
      props?.onCancelPress && props.onCancelPress();
    }
  };

  return (
    <ButtonPicker
      visible={visible}
      data={deletePickerData}
      onClose={onClose}
      headerTitle={headerTitle}
      onButtonPress={onPickerButtonPress}
      useCustomModal={useCustomModal}
    />
  );
};

export default DeletePicker;
