import { View, StyleSheet, FlatList, Text as ReactText, Dimensions } from 'react-native';
import React from 'react';
import Ripple from 'react-native-material-ripple';

import { Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { Colors, Fonts } from '../../res';
import { Animation } from '../../animations';
import { CheckRtl } from '../../languages';

const OptionsBar = (props: any) => {
  const {
    userStats = {},
    options = [],
    activeOptionButton = {},
    onPress = () => null,
  } = props;
  const Rtl = CheckRtl();

  const RenderCounter = (counter: any) => {
    return (
      counter > 0 && (
        <View style={[Styles.counterCon, { right: Rtl ? 'auto' : 0 }]}>
          <ReactText style={Styles.counterText} numberOfLines={1}>
            {counter}
          </ReactText>
        </View>
      )
    );
  };

  const RenderBtn = ({ item }: any) => {
    const { name, value } = item;
    return (
      <Animation
        animation={activeOptionButton.value === value ? 'zoomIn' : ''}
        style={{
          alignSelf: 'center',
          borderBottomWidth: activeOptionButton.value === value ?
            1 : 0.2,
          marginRight: value === '3' ? 3 : 0,
        }}>
        <Ripple
          style={Styles.btn}
          onPress={onPress.bind(null, item)}>
          <Text
            style={{
              ...Styles.btnTxt,
              fontFamily: activeOptionButton.value === value ?
                Fonts.APPFONT_SB : Fonts.APPFONT_R,
            }}>
            {name}
          </Text>
        </Ripple>
        {value === '1' && userStats?.like_you_counter !== 0
          ? RenderCounter(userStats?.like_you_counter)
          : value === '3' && userStats?.visit_you_counter !== 0
            ? RenderCounter(userStats?.visit_you_counter)
            : null}
      </Animation>
    );
  };

  return (
    <View style={Styles.container}>
      <FlatList
        data={options}
        renderItem={RenderBtn}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        inverted={Rtl}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

export default OptionsBar;

const { width } = Dimensions.get('window')

const Styles = StyleSheet.create({
  container: {
    height: 40,
    marginTop: 10,
    alignSelf: 'center',
  },
  btnTxt: {
    color: Colors.color1,
    fontSize: wp(2.8),
    fontFamily: Fonts.APPFONT_R,
    alignSelf: 'center',
  },
  btn: {
    paddingHorizontal: wp(2.2),
    paddingVertical: hp(0.3),
    marginHorizontal: wp(2.3),
    borderRadius: 30,
  },
  counterCon: {
    width: width * 0.04,
    height: width * 0.04,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -6,
    backgroundColor: Colors.color50,
  },
  counterText: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.tiny,
    top: 1
  },
});
