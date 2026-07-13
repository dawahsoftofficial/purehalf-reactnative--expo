import React from 'react';
import { View } from 'react-native';

import { Profile } from '../profile';

const UserProfile = (props: any) => {
  const userData = props?.route?.params?.userData;

  return (
    <View style={{ flex: 1 }}>
      <Profile
        fromUserProfile={true}
        userData={userData}
        navigation={props.navigation}
      />
    </View>
  );
};

export default UserProfile;
