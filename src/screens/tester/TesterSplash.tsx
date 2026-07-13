import React, { useEffect } from 'react';
import { Image, StatusBar, StyleSheet, View } from 'react-native';

import { Images } from '../../res';

export default function TesterSplash({ navigation }: any) {
  useEffect(() => {
    const timeout = setTimeout(() => navigation.goBack(), 1800);
    return () => clearTimeout(timeout);
  }, [navigation]);
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f1eef8" barStyle="dark-content" />
      <Image
        source={Images.logoColoured}
        resizeMode="contain"
        style={styles.logo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1eef8',
  },
  logo: { width: 170, height: 170 },
});
