import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';

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
    <Tab.Navigator
      initialRouteName="Welcome"
      tabBar={(props) => <CustomBottomTab {...props} />}
      screenOptions={{ headerShown: false, lazy: true }}
    >
      <Tab.Screen name="Settings" component={Settings} />
      <Tab.Screen name="Profile" component={Profile} />
      <Tab.Screen name="Welcome" component={Welcome} />
      <Tab.Screen name="SearchProfiles" component={SearchProfiles} />
      <Tab.Screen name="Messages" component={Messages} />
    </Tab.Navigator>
  );
};

export default AdminBottomTab;
