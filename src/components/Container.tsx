import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import DeviceInfo from 'react-native-device-info';

import { hp } from '../global';
import { Colors } from '../res';
import { isIOS } from '../services';

const hasNotch = DeviceInfo.hasNotch();
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
    backgroundColor: Colors.color2,
    paddingTop: hasNotch ? hp(2.5) : !isIOS ? hp(0.5) : hp(1.7),
  },
});
