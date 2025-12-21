import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { Animation } from '../../animations';
import { hp, Typography, wp } from '../../global';
import { Colors, Fonts } from '../../res';
import Text from '../Text';
import SearchBar from './SearchBar';

const HeightWeightPicker = (props: any) => {
  const [data, setData] = useState([]);
  const {
    visible = false,
    onClose = () => null,
    onPress = () => null,
    headerTitle = '',
  } = props;

  useEffect(() => {
    setTimeout(() => {
      setData(props?.data);
    }, 0);
  }, [props?.data]);

  const renderList = ({ item }: any) => {
    return (
      <Ripple style={Styles.itemCon} onPress={onPress.bind(null, item)}>
        <Text style={Styles.itemLabel} numberOfLines={1}>
          {typeof item === 'number' ? JSON.stringify(item) : item}
        </Text>
      </Ripple>
    );
  };

  const onChangeSearch = (text: any) => {
    if (text.length === 0) {
      setData(props?.data);
    } else {
      const regex = new RegExp(
        `.*${text.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&').trim()}.*`,
        'gi'
      );
      const data = props?.data?.filter((item: any) => regex.test(item));
      setData(data);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <StatusBar
        backgroundColor={Colors.blackRGBA50}
        barStyle="light-content"
      />
      <TouchableOpacity
        style={Styles.container}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animation style={Styles.innerContainer}>
          <View style={Styles.headerCon}>
            <Text style={Styles.headerTxt} numberOfLines={1}>
              {headerTitle}
            </Text>
            <AntDesign
              name="closecircle"
              color={Colors.color1}
              size={wp(6)}
              style={Styles.closeBtn}
              onPress={onClose}
            />
          </View>
          <SearchBar onChangeText={onChangeSearch} />
          <FlatList
            data={data}
            renderItem={renderList}
            contentContainerStyle={Styles.listContainer}
          />
        </Animation>
      </TouchableOpacity>
    </Modal>
  );
};

export default HeightWeightPicker;

const Styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.blackRGBA50,
    justifyContent: 'flex-end',
    flex: 1,
  },
  innerContainer: {
    height: hp(90),
    backgroundColor: Colors.color2,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
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
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small3,
    lineHeight: wp(5),
    maxWidth: wp(80),
  },
  closeBtn: {
    alignSelf: 'flex-end',
    marginBottom: hp(1),
    position: 'absolute',
    paddingHorizontal: wp(2),
  },
  listContainer: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
    paddingBottom: hp(10),
  },
  itemCon: {
    borderBottomWidth: 0.2,
    borderBottomColor: Colors.color4,
    paddingVertical: hp(1.5),
  },
  itemLabel: {
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small3,
    lineHeight: wp(5),
    maxWidth: wp(90),
  },
});
