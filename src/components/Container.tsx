import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '../res';

const Container = (props: any) => {
  const {
    style = null,
    barStyle = 'dark-content',
    barBg = Colors.color2,
  } = props;
  const { top } = useSafeAreaInsets();

  return (
    <View style={[Styles.container, { paddingTop: top }]}>
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
  },
});
