import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';

import { ApiServices, StorageManager, useGlobalContext } from '../services';

const CheckMembershipStatus = () => {
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const { setData, storageKeys } = StorageManager;

  const checkMembershipStatus = useCallback(async () => {
    if (!currentUser) return;

    ApiServices.getMembershipStatus().then(async (res: any) => {
      const updatedUser = { ...currentUser };
      if (res || currentUser.membership_status) {
        updatedUser.membership_expiry =
          res?.membership_expiry || currentUser.membership_expiry;
        updatedUser.membership_status = 1;
      } else {
        updatedUser.membership_expiry = null;
        updatedUser.membership_status = 0;
      }
      updateCurrentUser(updatedUser);
      await setData(storageKeys.USER, updatedUser);
    });
  }, [currentUser, updateCurrentUser, setData, storageKeys]);

  useEffect(() => {
    checkMembershipStatus();
  }, [checkMembershipStatus]);

  return <View />;
};

export default CheckMembershipStatus;
