import React, { useCallback } from 'react';

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
    onDeletePress,
    onCancelPress,
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

  const handleButtonPress = useCallback(
    (item: any) => {
      if (item?.value === 'delete') {
        if (onDeletePress) {
          onDeletePress();
        }
      } else {
        if (onCancelPress) {
          onCancelPress();
        }
      }
    },
    [onDeletePress, onCancelPress]
  );

  return (
    <ButtonPicker
      visible={visible}
      data={deletePickerData}
      onClose={onClose}
      headerTitle={headerTitle}
      onButtonPress={handleButtonPress}
      useCustomModal={useCustomModal}
    />
  );
};

export default DeletePicker;
