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
            animation={'zoomIn'}
            duration={500}
          >
            <AntDesign
              name="close"
              size={wp(7)}
              color={Colors.color1}
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
    width: wp(90),
    backgroundColor: Colors.color2,
    paddingVertical: hp(1),
    borderRadius: 8,
  },
  closeIcon: {
    alignSelf: 'flex-end',
    marginHorizontal: wp(1),
    paddingHorizontal: wp(2),
  },
});
