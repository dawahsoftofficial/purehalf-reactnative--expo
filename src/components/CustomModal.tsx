import React from 'react';
import { Modal, StatusBar, StyleSheet } from 'react-native';

import { Animation } from '../animations';
import { hp, wp } from '../global';
import { Colors } from '../res';
import { useGlobalContext } from '../services';

const CustomModal = () => {
  const { customModal } = useGlobalContext();

  if (!customModal?.visible) {
    return null;
  }

  return (
    <Modal
      visible={customModal.visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <StatusBar
        backgroundColor={Colors.blackRGBA50}
        barStyle="light-content"
      />
      <Animation style={Styles.container}>{customModal.data()}</Animation>
    </Modal>
  );
};

export default CustomModal;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    height: hp(100),
    width: wp(100),
    backgroundColor: Colors.blackRGBA50,
  },
});
