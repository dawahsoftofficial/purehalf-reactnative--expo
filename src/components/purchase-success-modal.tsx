import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { hp, Typography, wp } from '../global';
import { CheckRtl } from '../languages';
import { Colors, Fonts } from '../res';
import { Text } from './';

type PurchaseSuccessModalProps = {
  visible: boolean;
  onCollect: () => void;
  title?: string;
  message?: string;
};

export function PurchaseSuccessModal({
  visible,
  onCollect,
  title,
  message,
}: PurchaseSuccessModalProps) {
  const Rtl = CheckRtl();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCollect}
    >
      <View style={Styles.overlay}>
        <View style={Styles.container}>
          <View style={Styles.iconContainer}>
            <AntDesign name="checkcircle" size={wp(15)} color={Colors.theme} />
          </View>
          <Text style={Styles.title}>{title || 'Purchase Successful'}</Text>
          <Text style={Styles.message}>
            {message || 'Your purchase was successful!'}
          </Text>
          <Ripple
            style={[
              Styles.collectButton,
              { flexDirection: Rtl ? 'row-reverse' : 'row' },
            ]}
            onPress={onCollect}
          >
            <Text style={Styles.collectButtonText}>{'Collect'}</Text>
          </Ripple>
        </View>
      </View>
    </Modal>
  );
}

const Styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.blackRGBA70,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
  },
  container: {
    backgroundColor: Colors.color2,
    borderRadius: wp(5),
    padding: wp(6),
    alignItems: 'center',
    width: '100%',
    maxWidth: wp(85),
  },
  iconContainer: {
    marginBottom: hp(2),
  },
  title: {
    fontSize: Typography.large2,
    fontFamily: Fonts.APPFONT_B,
    color: Colors.color1,
    textAlign: 'center',
    marginBottom: hp(1),
    includeFontPadding: false,
  },
  message: {
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color1,
    textAlign: 'center',
    marginBottom: hp(3),
    includeFontPadding: false,
  },
  collectButton: {
    backgroundColor: Colors.theme,
    paddingHorizontal: wp(8),
    paddingVertical: hp(1.5),
    borderRadius: wp(3),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: wp(40),
  },
  collectButtonText: {
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_B,
    color: Colors.color2,
    includeFontPadding: false,
  },
});
