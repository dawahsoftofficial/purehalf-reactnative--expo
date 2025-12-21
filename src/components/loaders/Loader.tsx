import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Colors } from '../../res';

const Loader = (props: any) => {
  const { containerStyle } = props;
  return (
    <View style={[Styles.container, containerStyle]}>
      <ActivityIndicator size={'small'} color={Colors.theme} />
    </View>
  );
};

export default Loader;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
