import React from 'react';
import { View } from 'react-native';

import { TesterProfileTools } from '../../components';
import { Profile } from '../profile';

const UserProfile = (props: any) => {
  const userData = props?.route?.params?.userData;

  return (
    <View style={{ flex: 1 }}>
      <TesterProfileTools navigation={props.navigation} userId={userData?.id} />
      <Profile
        fromUserProfile={true}
        userData={userData}
        navigation={props.navigation}
      />
    </View>
  );
};

export default UserProfile;
