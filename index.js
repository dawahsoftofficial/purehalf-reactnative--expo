import notifee from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import React from 'react';
import { AppRegistry } from 'react-native';

import App from './App';
import { name as appName } from './app.json';
import { Images } from './src/res';
import { AppProvider, isIOS } from './src/services';

const createChannelId = async () => {
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
  });
  return channelId;
};

if (!isIOS) {
  createChannelId();
}

const onMessageReceived = async (message) => {
  const { title, body, pressAction } = message.data;
  let data = {};
  if (message?.data?.data) {
    data = JSON.parse(message?.data?.data);
  }
  data.pressAction = pressAction;
  await notifee.displayNotification({
    title: `${title} ${pressAction === 'openChat' ? '💬' : pressAction === 'my_liked_you_tab' ? '👍' : ''}`,
    body: body,
    data: data,
    android: {
      channelId: 'default',
      pressAction: {
        id: pressAction,
        launchActivity: 'default',
      },
      smallIcon: 'icon',
      largeIcon: data?.user?.image ? data?.user?.image : Images.userTwo,
      circularLargeIcon: true,
      vibrate: true,
    },
  });
};

messaging().setBackgroundMessageHandler(onMessageReceived);

const Initial = () => {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
};

AppRegistry.registerComponent(appName, () => Initial);
