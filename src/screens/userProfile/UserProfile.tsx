import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Colors } from '../../res';
import { useGlobalContext } from '../../services';
import { Profile } from '../profile';

const UserProfile = (props: any) => {
  const userData = props?.route?.params?.userData;
  const { currentUser } = useGlobalContext();
  const currentUserId = currentUser?.id;
  const targetUserId = userData?.id;
  const hasUserIds = currentUserId != null && targetUserId != null;
  const isOwnProfile =
    hasUserIds && String(currentUserId) === String(targetUserId);

  useEffect(() => {
    if (currentUserId != null && (targetUserId == null || isOwnProfile)) {
      props.navigation.replace('Profile');
    }
  }, [currentUserId, isOwnProfile, props.navigation, targetUserId]);

  // Wait for the signed-in user to hydrate before deciding whether this is an
  // other-member profile. Rendering Profile too early can send the current
  // user's id to the other-member endpoint, which intentionally returns 404.
  if (!hasUserIds || isOwnProfile) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

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
