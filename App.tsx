import React, { type JSX } from 'react';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MenuProvider } from 'react-native-popup-menu';

import { Initialization } from './src/initialization';

const App = (): JSX.Element => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <MenuProvider>
      <Initialization />
      <FlashMessage position="top" />
    </MenuProvider>
  </GestureHandlerRootView>
);

export default App;
