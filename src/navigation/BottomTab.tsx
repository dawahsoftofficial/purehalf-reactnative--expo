import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/res';

import {
  Messages,
  Profile,
  SearchProfiles,
  Settings,
  Welcome,
} from '../screens';
import CustomBottomTab from './CustomBottomTab';

const Tab = createBottomTabNavigator();
const AdminBottomTab = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <Tab.Navigator
        tabBar={(props) => <CustomBottomTab {...props} />}
        screenOptions={{ headerShown: false, lazy: true }}
        initialRouteName="Welcome"
      >
        <Tab.Screen name="Settings" component={Settings} />
        <Tab.Screen name="Profile" component={Profile} />
        <Tab.Screen name="Welcome" component={Welcome} />
        <Tab.Screen name="SearchProfiles" component={SearchProfiles} />
        <Tab.Screen name="Messages" component={Messages} />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

export default AdminBottomTab;
