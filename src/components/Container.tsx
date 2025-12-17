import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';

import { hp } from '@/global';

import { Colors } from '../res';

const Container = (props: any) => {
  const {
    style = null,
    barStyle = 'dark-content',
    barBg = Colors.color2,
  } = props;

  return (
    <View style={Styles.container}>
      <View style={[Styles.container, style]}>
        <StatusBar
          backgroundColor={barBg}
          barStyle={barStyle}
          translucent={false}
        />
        {props.children}
      </View>
    </View>
  );
};

export default Container;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: hp(2),
    backgroundColor: Colors.color2,
  },
});
