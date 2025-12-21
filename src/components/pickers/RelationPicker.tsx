import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Ripple from 'react-native-material-ripple';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Animation } from '../../animations';
import { hp, Typography, wp } from '../../global';
import Constants from '../../global/Constants';
import { CheckRtl, LanguageKeys } from '../../languages';
import { Colors, Fonts, Images } from '../../res';
import { isIOS } from '../../services';
import { Text } from '..';

const RelationPicker = (props: any) => {
  const Rtl = CheckRtl();
  const {
    value = '',
    outerLabelStyle = {},
    disabled = false,
    relations,
    setRelations,
  } = props;
  const [relationModalVisible, setRelationModalVisible] = useState(false);
  const [activeRelation, setActiveRelation] = useState<any>(null);

  useEffect(() => {
    setActiveRelation(value);
  }, [value]);

  const renderRadio = (item: any) => {
    return item.selected ? (
      <Ionicons name="radio-button-on" size={wp(4.5)} color={Colors.theme} />
    ) : (
      <Ionicons name="radio-button-off" size={wp(4.5)} color={Colors.theme} />
    );
  };

  const onRelationPress = (item: any) => {
    relations.forEach((element: any) => {
      if (element?.id === item?.id) {
        element.selected = true;
        setActiveRelation(element);
        props.onSelect(element);
      } else {
        element.selected = false;
      }
    });
    setRelations(relations);
    setRelationModalVisible(false);
  };

  const showRelationModal = () => setRelationModalVisible(true);
  const closeRelationModal = () => setRelationModalVisible(false);

  const renderRelations = ({ item }: any) => {
    return (
      <TouchableOpacity
        style={{
          ...Styles.itemContainer,
          justifyContent: Rtl ? 'flex-end' : 'flex-start',
        }}
        onPress={onRelationPress.bind(null, item)}
        activeOpacity={0.5}
      >
        {!Rtl && renderRadio(item)}
        <Text style={Styles.itemLabel}>{item.label}</Text>
        {Rtl && renderRadio(item)}
      </TouchableOpacity>
    );
  };

  const RenderDownIcon = () => (
    <AntDesign name="down" size={wp(3.5)} color={Colors.color4} />
  );

  const RenderGroupImage = () => (
    <Image
      source={Images.groupUser}
      resizeMode="contain"
      style={Styles.groupUserIcon}
    />
  );

  const RenderRelationText = () =>
    activeRelation && activeRelation?.label ? (
      <Text style={Styles.outerBtnLabel}>{activeRelation?.label}</Text>
    ) : (
      <Text style={{ ...Styles.outerBtnLabel, color: Colors.color28 }}>
        {LanguageKeys.selectRelation}
      </Text>
    );

  return (
    <View>
      <Text style={[Styles.label, outerLabelStyle]}>
        {LanguageKeys.relation}
      </Text>
      <Ripple
        style={[
          Styles.container,
          {
            flexDirection: Rtl ? 'row-reverse' : 'row',
            backgroundColor: disabled ? Colors.color54 : Colors.color3,
          },
        ]}
        onPress={showRelationModal}
        disabled={disabled}
      >
        <View
          style={[
            Styles.innerContainer,
            { flexDirection: Rtl ? 'row-reverse' : 'row' },
          ]}
        >
          <RenderGroupImage />
          <RenderRelationText />
        </View>
        <RenderDownIcon />
      </Ripple>

      <Modal visible={relationModalVisible} transparent={true}>
        <TouchableOpacity
          style={Styles.modalContainer}
          activeOpacity={1}
          onPress={closeRelationModal}
        >
          <Animation style={Styles.listContainer} duration={300}>
            <FlatList data={relations} renderItem={renderRelations} />
          </Animation>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default RelationPicker;

const Styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.color3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: hp(6.3),
    paddingLeft: wp(2),
    paddingRight: wp(5),
    borderBottomWidth: 0.7,
    borderColor: Colors.color1,
    marginTop: hp(0.8),
  },
  label: {
    fontSize: Typography.medium,
    fontFamily: Fonts.APPFONT_R,
    marginBottom: Constants.fontFamilyMarginBottom,
    color: Colors.color1,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: hp(6),
  },
  groupUserIcon: {
    width: wp(4.5),
    height: hp(4),
  },
  outerBtnLabel: {
    fontFamily: Fonts.APPFONT_R,
    color: Colors.color1,
    fontSize: Typography.small3,
    marginTop: !isIOS ? hp(0.35) : 0,
    alignSelf: 'center',
    marginHorizontal: wp(3),
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0,0.5)',
    justifyContent: 'flex-end',
  },
  listContainer: {
    width: wp(100),
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    backgroundColor: Colors.color2,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
  },
  itemContainer: {
    paddingVertical: hp(1.4),
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemLabel: {
    marginHorizontal: wp(1),
    fontSize: Typography.medium,
    color: Colors.color1,
    fontFamily: Fonts.APPFONT_R,
    marginBottom: Constants.fontFamilyMarginBottom,
  },
});
