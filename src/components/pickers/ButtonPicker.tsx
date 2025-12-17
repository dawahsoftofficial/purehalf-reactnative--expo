import React, { useEffect } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { Animation } from '../../animations';
import { Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { Colors, Fonts } from '../../res';
import { useGlobalContext } from '../../services';
import { Button } from '../buttons';

const ButtonPicker = (props: any) => {
  const { updateCustomModal } = useGlobalContext();
  const {
    visible,
    onClose = () => null,
    headerTitle = 'Select option',
    data = [{ lable: 'Cancel', value: 'cancel' }],
    onButtonPress = () => null,
    useCustomModal = false,
  } = props;

  const renderList = ({ item }: any) => {
    const { label, value } = item;
    return (
      <Button
        buttonStyle={{
          ...Styles.button,
          backgroundColor: value === 'cancel' ? Colors.color8 : Colors.theme,
        }}
        text={label}
        onPress={onButtonPress.bind(null, item)}
        textStyle={{
          color: value === 'cancel' ? Colors.color1 : Colors.color2,
        }}
      />
    );
  };

  const Content = () => (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        style={Styles.container}
        activeOpacity={1}
        onPress={onClose}
      >
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
                onPress={onClose}
              />
            </View>
            <FlatList
              data={data}
              renderItem={renderList}
              scrollEnabled={false}
              contentContainerStyle={{ paddingVertical: hp(3) }}
            />
          </Animation>
        </View>
      </TouchableOpacity>
    </View>
  );

  useEffect(() => {
    if (useCustomModal && visible) {
      updateCustomModal(true, Content);
    } else if (useCustomModal && !visible) {
      updateCustomModal(false, null);
    }
  }, [useCustomModal, visible, updateCustomModal]);

  if (useCustomModal) {
    return null;
  }

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      {Content()}
    </Modal>
  );
};

export default ButtonPicker;

const Styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.blackRGBA50,
    justifyContent: 'flex-end',
    flex: 1,
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
