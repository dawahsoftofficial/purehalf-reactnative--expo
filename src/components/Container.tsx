import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../res';
import AppBackgroundPattern from './AppBackgroundPattern';

const Container = (props: any) => {
  const {
    style = null,
    barStyle = 'dark-content',
    barBg = Colors.color2,
  } = props;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[Styles.container]}>
      <View style={[Styles.container, style]}>
        <StatusBar
          backgroundColor={barBg}
          barStyle={barStyle}
          translucent={false}
        />
        <AppBackgroundPattern />
        {props.children}
      </View>
    </SafeAreaView>
  );
};

export default Container;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.color2,
  },
});
