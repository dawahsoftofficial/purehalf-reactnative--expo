import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';

import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
import Text from '../Text';

const ModalLoader = (props: any) => {
  const {
    visible = false,
    message = LanguageKeys.loading,
    useModalLayout = false,
  } = props;

  if (!visible) {
    return null;
  }

  if (useModalLayout) {
    return (
      <Modal
        visible={true}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={Styles.container}>
          <View style={Styles.innerContainer}>
            <ActivityIndicator color={Colors.theme} size={wp(5)} />
            <Text style={Styles.textStyle}>{message}</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <View style={Styles.container} pointerEvents="box-none">
      <View style={Styles.innerContainer}>
        <ActivityIndicator color={Colors.theme} size={wp(5)} />
        <Text style={Styles.textStyle}>{message}</Text>
      </View>
    </View>
  );
};

export default ModalLoader;

const Styles = StyleSheet.create({
  container: {
    position: 'absolute',
    height: hp(100),
    width: wp(100),
    zIndex: 1,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.blackRGBA50,
  },
  innerContainer: {
    backgroundColor: Colors.color2,
    width: wp(70),
    minHeight: hp(16),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  textStyle: {
    fontSize: Typography.medium,
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_SB,
    includeFontPadding: false,
    alignSelf: 'center',
    marginVertical: hp(2),
  },
});
