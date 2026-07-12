import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { hp, wp } from '../global';
import { navigationRef } from '../navigation/RootNavigation';
import { Colors } from '../res';
import { useConversationStore } from '../stores';

// Screens where the FAB would either be redundant (already on Messages) or
// visually collide with a full-screen auth/onboarding/paywall flow.
const HIDDEN_ON_ROUTES = new Set([
  'Messages',
  'SingleChat',
  'AuthWelcome',
  'PhoneNumber',
  'Otp',
  'UserInput',
  'OnboardingProfile',
  'Location',
  'ProfilePicture',
  'SignupPrimer',
  'WelcomeUser',
  'ProFeaturesPromotion',
  'ChatCreditsPaywall',
  'DiscountProFeaturesPromotion',
  'MembershipCongrats',
  'GiftMembershipCongrats',
  'PaymentOptions',
  'BankTransfer',
  'AccountDeletion',
  'PurposeOfLeaving',
  'AccountDeleted',
  'AccountSuspended',
]);

function PersistentMessagesFab() {
  const unreadConversationsCount = useConversationStore(
    (state) => state.unreadConversationsCount
  );
  const { bottom } = useSafeAreaInsets();
  const [currentRoute, setCurrentRoute] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    const unsubscribe = navigationRef.addListener('state', () => {
      setCurrentRoute(navigationRef.getCurrentRoute()?.name);
    });
    return unsubscribe;
  }, []);

  if (!currentRoute || HIDDEN_ON_ROUTES.has(currentRoute)) {
    return null;
  }

  const onPress = () => {
    if (!navigationRef.isReady()) return;
    // navigationRef has no app-specific ParamList (none exists in this
    // codebase — see app-old/src/services/paywall-service.tsx:133 for the
    // same cast used to call it imperatively outside a screen component).
    const navigate = navigationRef.navigate as (name: string) => void;
    navigate('Messages');
  };

  return (
    <View
      pointerEvents="box-none"
      style={[Styles.container, { bottom: hp(2.5) + bottom }]}
    >
      <Ripple style={Styles.fab} onPress={onPress} rippleColor={Colors.color2}>
        <Ionicons name="mail" size={wp(6)} color={Colors.color2} />
        {unreadConversationsCount > 0 && (
          <View
            style={[
              Styles.badge,
              {
                minWidth:
                  unreadConversationsCount.toString().length >= 3
                    ? wp(7)
                    : wp(5.5),
              },
            ]}
          >
            <Text style={Styles.badgeText} numberOfLines={1}>
              {unreadConversationsCount}
            </Text>
          </View>
        )}
      </Ripple>
    </View>
  );
}

export default PersistentMessagesFab;

const Styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: wp(5),
    zIndex: 20,
    elevation: 20,
  },
  fab: {
    width: wp(14),
    height: wp(14),
    borderRadius: wp(7),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.color1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    height: wp(5),
    borderRadius: wp(2.5),
    backgroundColor: Colors.theme,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(1.2),
    borderWidth: 1.5,
    borderColor: Colors.color2,
  },
  badgeText: {
    color: Colors.color2,
    fontSize: wp(2.8),
    fontWeight: '600',
  },
});
