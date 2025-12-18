import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';

import { ApiServices, StorageManager, useGlobalContext } from '../services';

const CheckMembershipStatus = () => {
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const { setData, storageKeys } = StorageManager;

  const checkMembershipStatus = useCallback(async () => {
    if (!currentUser) return;

    ApiServices.getMembershipStatus().then(async (res: any) => {
      const membership_status = res || currentUser.membership_status ? 1 : 0;
      const membership_expiry = res?.membership_expiry ?? null;

      const hasStatusChanged =
        currentUser.membership_status !== membership_status ||
        currentUser.membership_expiry !== membership_expiry;

      if (!hasStatusChanged) return;

      const updatedUser = {
        ...currentUser,
        membership_status,
        membership_expiry,
      };

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
