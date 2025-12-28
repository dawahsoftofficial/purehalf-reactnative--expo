import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';

import { ApiServices, StorageManager, useGlobalContext } from '../services';
import { usePremiumStore } from '../stores';

const CheckMembershipStatus = () => {
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const { setData, storageKeys } = StorageManager;
  const setMembershipExpiry = usePremiumStore(
    (state) => state.setMembershipExpiry
  );

  const checkMembershipStatus = useCallback(async () => {
    if (!currentUser) return;

    ApiServices.getMembershipStatus()
      .then(async (res: any) => {
        // Use RevenueCat membership_expiry if available, otherwise fallback to backend
        const revenueCatExpiry = res?.membership_expiry ?? null;
        const backendExpiry = currentUser.membership_expiry ?? null;
        const membership_expiry = revenueCatExpiry || backendExpiry;

        // Determine membership status: 1 if either RevenueCat or backend shows active
        const revenueCatStatus = res ? 1 : 0;
        const backendStatus = currentUser.membership_status ? 1 : 0;
        const membership_status = revenueCatStatus || backendStatus ? 1 : 0;

        const hasStatusChanged =
          currentUser.membership_status !== membership_status ||
          currentUser.membership_expiry !== membership_expiry;

        if (!hasStatusChanged) {
          // Still update store even if user data hasn't changed (in case store is out of sync)
          setMembershipExpiry(membership_expiry);
          return;
        }

        const updatedUser = {
          ...currentUser,
          membership_status,
          membership_expiry,
        };

        updateCurrentUser(updatedUser);
        await setData(storageKeys.USER, updatedUser);

        // Update premium store with membership expiry for unified premium check
        setMembershipExpiry(membership_expiry);
      })
      .catch(() => {
        // If RevenueCat fails, use backend membership_expiry
        const backendExpiry = currentUser.membership_expiry ?? null;
        if (backendExpiry) {
          setMembershipExpiry(backendExpiry);
        }
      });
  }, [
    currentUser,
    updateCurrentUser,
    setData,
    storageKeys,
    setMembershipExpiry,
  ]);

  useEffect(() => {
    checkMembershipStatus();
  }, [checkMembershipStatus]);

  // Sync membership expiry when currentUser changes
  useEffect(() => {
    if (currentUser?.membership_expiry !== undefined) {
      setMembershipExpiry(currentUser.membership_expiry);
    }
  }, [currentUser?.membership_expiry, setMembershipExpiry]);

  return <View />;
};

export default CheckMembershipStatus;
