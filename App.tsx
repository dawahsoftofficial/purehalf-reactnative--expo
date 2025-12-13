import React, { type JSX } from 'react';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MenuProvider } from 'react-native-popup-menu';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/res';

import { Initialization } from './src/initialization';

const App = (): JSX.Element => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <MenuProvider>
        <Initialization />
        <FlashMessage position="top" />
      </MenuProvider>
    </SafeAreaView>
  </GestureHandlerRootView>
);

export default App;
