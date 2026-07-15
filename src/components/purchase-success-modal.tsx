import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { hp, Typography, wp } from '../global';
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
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCollect}
    >
      <View style={Styles.overlay}>
        <View style={Styles.container}>
          <View style={Styles.topAccent} />
          <View style={Styles.iconContainer}>
            <AntDesign
              name="checkcircle"
              size={wp(12)}
              color={Colors.verified}
            />
          </View>
          <Text style={Styles.title}>{title || 'Purchase Successful'}</Text>
          <Text style={Styles.message}>
            {message || 'Your purchase was successful!'}
          </Text>
          <Ripple
            style={Styles.collectButton}
            onPress={onCollect}
            accessibilityRole="button"
            accessibilityLabel="Collect chat bundle"
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
    paddingHorizontal: wp(6),
    paddingTop: hp(4),
    paddingBottom: hp(2.5),
    alignItems: 'center',
    width: '100%',
    maxWidth: wp(85),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.hairline,
    shadowColor: Colors.ink,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  topAccent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: hp(0.8),
    backgroundColor: Colors.theme,
  },
  iconContainer: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(46, 158, 91, 0.12)',
    marginBottom: hp(2),
  },
  title: {
    fontSize: Typography.large2,
    fontFamily: Fonts.APPFONT_B,
    color: Colors.color1,
    textAlign: 'center',
    alignSelf: 'stretch',
    marginBottom: hp(1),
    includeFontPadding: false,
  },
  message: {
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color1,
    textAlign: 'center',
    alignSelf: 'stretch',
    marginBottom: hp(3),
    includeFontPadding: false,
  },
  collectButton: {
    backgroundColor: Colors.theme,
    paddingVertical: hp(1.5),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  collectButtonText: {
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_B,
    color: Colors.color2,
    includeFontPadding: false,
  },
});
