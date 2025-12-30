import React, { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Modal from 'react-native-modal';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { Animation } from '../../animations';
import { Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { Colors, Fonts } from '../../res';
import { Button } from '../buttons';

const ButtonPicker = (props: any) => {
  const {
    visible,
    onClose = () => null,
    headerTitle = 'Select option',
    data = [{ label: 'Cancel', value: 'cancel' }],
    onButtonPress = () => null,
    useCustomModal = false,
  } = props;

  const handleButtonPress = useCallback(
    (item: any) => {
      onButtonPress(item);
      // Close modal immediately after button press
      onClose();
    },
    [onButtonPress, onClose]
  );

  const renderList = useCallback(
    ({ item }: any) => {
      const { label, value } = item;
      return (
        <Button
          buttonStyle={{
            ...Styles.button,
            backgroundColor: value === 'cancel' ? Colors.color8 : Colors.theme,
          }}
          text={label}
          onPress={() => handleButtonPress(item)}
          textStyle={{
            color: value === 'cancel' ? Colors.color1 : Colors.color2,
          }}
        />
      );
    },
    [handleButtonPress]
  );

  const handleBackdropPress = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSwipeComplete = useCallback(() => {
    onClose();
  }, [onClose]);

  // If using custom modal, return null (handled by CustomModal component)
  if (useCustomModal) {
    return null;
  }

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={handleBackdropPress}
      onSwipeComplete={handleSwipeComplete}
      swipeDirection={['down']}
      backdropOpacity={0.5}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      style={Styles.modal}
      avoidKeyboard={true}
      useNativeDriverForBackdrop={true}
      hideModalContentWhileAnimating={true}
      onModalHide={handleBackdropPress}
    >
      <View style={Styles.container}>
        <View
          style={Styles.innerContainer}
          onStartShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
        >
          <Animation style={Styles.animationContainer}>
            <View style={Styles.headerCon}>
              <Text style={Styles.headerTxt} numberOfLines={1}>
                {headerTitle}
              </Text>
              <AntDesign
                name="close"
                color={Colors.color1}
                size={wp(5)}
                style={Styles.closeBtn}
                onPress={handleBackdropPress}
              />
            </View>
            <FlatList
              data={data}
              renderItem={renderList}
              scrollEnabled={false}
              contentContainerStyle={Styles.listContainer}
              keyExtractor={(item, index) => `button-${index}-${item.value}`}
            />
          </Animation>
        </View>
      </View>
    </Modal>
  );
};

export default ButtonPicker;

const Styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  container: {
    justifyContent: 'flex-end',
    paddingTop: hp(12),
  },
  innerContainer: {
    backgroundColor: Colors.color2,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
  },
  animationContainer: {
    width: '100%',
  },
  headerCon: {
    borderBottomWidth: 0.2,
    borderBottomColor: Colors.color4,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    paddingVertical: hp(1.5),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.color8,
  },
  headerTxt: {
    color: Colors.color1,
    alignSelf: 'center',
    textAlign: 'center',
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small2,
    lineHeight: wp(5),
    maxWidth: wp(80),
  },
  closeBtn: {
    alignSelf: 'flex-end',
    marginBottom: hp(1),
    position: 'absolute',
    paddingHorizontal: wp(3),
  },
  listContainer: {
    paddingVertical: hp(3),
  },
  button: {
    marginTop: hp(2),
    alignSelf: 'center',
    width: wp(80),
    height: hp(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonTxt: {
    textAlign: 'center',
    alignSelf: 'center',
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_SB,
    includeFontPadding: false,
    fontSize: Typography.medium,
  },
});
