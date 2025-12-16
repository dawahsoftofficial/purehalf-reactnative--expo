import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import Cities from './Cities';
import { hp, Typography, wp } from '../../../global';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { Colors, Fonts } from '../../../res';
import Constants from '../../../global/Constants';
import Ripple from 'react-native-material-ripple';
import { Animation } from '../../../animations';
import { isIOS } from '../../../services';

const CountryPicker = (props: any) => {
  const { onClose = () => null, onPress = () => null, visible = false } = props;
  const [searchTxt, setSearchTxt] = useState('');
  const [countries, setCountries] = useState(Cities);

  const onChangeSearch = (text: any) => {
    setSearchTxt(text);
    if (text.length === 0) {
      setCountries(Cities);
    } else {
      const temp = Cities.filter(function (element: any) {
        const text = searchTxt.toUpperCase();
        const name = element.name.toUpperCase();
        return name.includes(text);
      }).map(function (item: any) {
        return item;
      });
      setCountries(temp);
    }
  };

  const renderCountries = ({ item }: any) => {
    return (
      <Ripple style={Styles.listItemCon} onPress={onPress.bind(null, item)}>
        <View style={Styles.listItemInnerCon}>
          <Text style={Styles.countryName}>{item.name}</Text>
        </View>
      </Ripple>
    );
  };
  return (
    <Modal transparent={false} visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={Styles.container}>
        <Animation duration={200}>
          <View style={Styles.headerContainer}>
            <AntDesign
              name="close"
              color={Colors.color1}
              size={wp(7)}
              onPress={onClose}
            />
            <TextInput
              style={Styles.searchInput}
              placeholder={'Search country'}
              placeholderTextColor={Colors.color4}
              onChangeText={onChangeSearch}
              value={searchTxt}
            />
          </View>
          <FlatList
            data={countries}
            renderItem={renderCountries}
            contentContainerStyle={Styles.listContainer}
          />
        </Animation>
      </SafeAreaView>
    </Modal>
  );
};

export default CountryPicker;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: wp(3),
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    width: wp(80),
    marginHorizontal: wp(3),
    paddingVertical: hp(1.5),
    borderRadius: 8,
    backgroundColor: Colors.color3,
    fontFamily: Fonts.APPFONT_R,
    marginBottom: Constants.fontFamilyMarginBottom,
    fontSize: Typography.medium,
    paddingHorizontal: wp(3),
    color: Colors.color1,
  },
  listItemCon: {
    marginTop: hp(1),
    paddingVertical: hp(1),
    flexDirection: 'row',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: wp(2),
  },
  listItemInnerCon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: wp(90),
    paddingRight: wp(5),
    marginHorizontal: wp(2),
    borderBottomWidth: 0.8,
    paddingVertical: hp(1),
    borderBottomColor: Colors.color4,
  },
  countryName: {
    fontFamily: Fonts.APPFONT_R,
    marginBottom: Constants.fontFamilyMarginBottom,
    fontSize: isIOS ? Typography.medium : Typography.small2,
    color: Colors.color1,
  },
});
