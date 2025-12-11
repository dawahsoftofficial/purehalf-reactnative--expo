import React from "react";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomBottomTab from './CustomBottomTab'
import { Settings, Profile, Welcome, SearchProfiles, Messages } from '../screens'

const Tab = createBottomTabNavigator();
const AdminBottomTab = () => {
    return (
        <Tab.Navigator
            tabBar={props => <CustomBottomTab {...props} />}
            screenOptions={{ headerShown: false }}
            initialRouteName="Welcome"
        >
            <Tab.Screen name="Settings" component={Settings} />
            <Tab.Screen name="Profile" component={Profile} />
            <Tab.Screen name="Welcome" component={Welcome} />
            <Tab.Screen name="SearchProfiles" component={SearchProfiles} />
            <Tab.Screen name="Messages" component={Messages} />
        </Tab.Navigator>
    );
}

export default AdminBottomTab