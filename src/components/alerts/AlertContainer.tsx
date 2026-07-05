import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { Animation } from '../../animations';
import { hp, wp } from '../../global';
import { Colors } from '../../res';

const AlertContainer = (props: any) => {
  const { visible = false, onClose = () => null } = props;

  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={Styles.container}
      >
        <View
          onStartShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
        >
          <Animation
            style={Styles.contentCon}
            animation={'fadeInUp'}
            duration={320}
          >
            <AntDesign
              name="close"
              size={wp(6)}
              color={Colors.muted}
              style={Styles.closeIcon}
              onPress={onClose}
            />
            {props.children}
          </Animation>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default AlertContainer;

const Styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.blackRGBA50,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentCon: {
    alignSelf: 'center',
    width: wp(88),
    backgroundColor: Colors.surface,
    paddingTop: hp(1),
    paddingBottom: hp(2),
    paddingHorizontal: wp(2),
    borderRadius: 24,
  },
  closeIcon: {
    alignSelf: 'flex-end',
    marginHorizontal: wp(1),
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
  },
});
