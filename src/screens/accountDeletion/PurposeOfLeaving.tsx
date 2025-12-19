import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ripple from 'react-native-material-ripple';

import { Container } from '../../components';
import { hp, Typography, wp } from '../../global';
import { Colors, Fonts } from '../../res';
import { StorageManager } from '../../services';
import Otp from '../otp/Otp';

const PurposeOfLeaving = (props: any) => {
  const { getData, storageKeys } = StorageManager;
  const [purposeOfLeavingList, setPurposeOfLeavingList] = useState([]);
  const phoneNumber = props?.route?.params?.phoneNumber;
  const phoneNumberFirebaseRes = props?.route?.params?.phoneNumberFirebaseRes;
  const type = props?.route?.params?.type;

  useEffect(() => {
    getData(storageKeys.ATTRIBUTE).then((res: any) => {
      const deleteAttribute = res['other-0']['delete-0'];
      if (deleteAttribute && deleteAttribute?.length !== 0) {
        setPurposeOfLeavingList(deleteAttribute);
      }
    });
  }, []);

  const [selectedRadio, setSelectedRadio] = useState({
    index: null,
    item: null,
  });

  const onRadioPress = (item: any, index: any) =>
    setSelectedRadio({
      index: index,
      item: item,
    });

  const renderList = ({ item, index }: any) => {
    return (
      <Ripple
        style={{
          ...Styles.radioBtnCon,
        }}
        onPress={onRadioPress.bind(null, item, index)}
      >
        <View
          style={{
            ...Styles.radioBtn,
            backgroundColor:
              index === selectedRadio.index ? Colors.color1 : 'transparent',
          }}
        />
        <Text style={Styles.description}>{item?.value}</Text>
      </Ripple>
    );
  };

  const renderListHeader = () => (
    <Text style={Styles.heading}>Purpose of leaving</Text>
  );

  return (
    <Container style={Styles.container}>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={Styles.container}
      >
        <FlatList
          data={purposeOfLeavingList}
          renderItem={renderList}
          contentContainerStyle={Styles.listContainer}
          ListHeaderComponent={renderListHeader}
          scrollEnabled={false}
        />
        <Otp
          showLogo={false}
          route={{
            params: {
              phoneNumber: phoneNumber,
              phoneNumberFirebaseRes: phoneNumberFirebaseRes,
            },
          }}
          from={'AccountDeletion'}
          type={type}
          purposeOfLeaving={selectedRadio?.item}
          navigation={props?.navigation}
        />
      </ScrollView>
    </Container>
  );
};

export default PurposeOfLeaving;

const { width } = Dimensions.get('window');
const Styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    paddingTop: hp(3),
  },
  listContainer: {
    paddingHorizontal: wp(4),
    height: hp(50),
  },
  heading: {
    color: Colors.color1,
    fontSize: Typography.large,
    fontFamily: Fonts.APPFONT_B,
    marginBottom: hp(2),
    lineHeight: wp(6),
  },
  radioBtnCon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(2),
    alignSelf: 'flex-start',
  },
  radioBtn: {
    width: width * 0.06,
    height: width * 0.06 * 1,
    borderRadius: (width * 0.06 * 1) / 2,
    borderWidth: 2,
    borderColor: Colors.color1,
  },
  description: {
    alignSelf: 'center',
    marginHorizontal: wp(3),
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    includeFontPadding: false,
    color: Colors.color1,
  },
});
