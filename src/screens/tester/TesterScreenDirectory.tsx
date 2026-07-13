import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Container, Header } from '../../components';
import { Colors } from '../../res';

type ScreenItem = {
  route: string;
  label: string;
  safe?: boolean;
};

type ScreenGroup = {
  title: string;
  screens: ScreenItem[];
};

const groups: ScreenGroup[] = [
  {
    title: 'Entry and registration',
    screens: [
      { route: 'SignupPrimer', label: 'Pre-registration primer', safe: true },
      { route: 'AuthWelcome', label: 'Authentication welcome', safe: true },
      { route: 'PhoneNumber', label: 'Phone number', safe: true },
      { route: 'Otp', label: 'OTP verification' },
      { route: 'UserInput', label: 'Basic user information', safe: true },
      { route: 'OnboardingProfile', label: 'Profile onboarding', safe: true },
      { route: 'Location', label: 'Location setup', safe: true },
      { route: 'ProfilePicture', label: 'Profile picture setup', safe: true },
      { route: 'WelcomeUser', label: 'New-member welcome' },
      { route: 'SignupStepInput', label: 'Primer input step' },
      { route: 'SignupStepRadio', label: 'Primer choice step' },
    ],
  },
  {
    title: 'Home and discovery',
    screens: [
      { route: 'BottomTab', label: 'Home', safe: true },
      { route: 'Welcome', label: 'Home content', safe: true },
      { route: 'SearchProfiles', label: 'Search profiles', safe: true },
      { route: 'SearchResults', label: 'Search results' },
      { route: 'UserProfile', label: 'Member profile' },
      {
        route: 'PrivatePhotoRequest',
        label: 'Private photo requests',
        safe: true,
      },
      { route: 'UserLocation', label: 'User map', safe: true },
    ],
  },
  {
    title: 'My profile and media',
    screens: [
      { route: 'Profile', label: 'My profile', safe: true },
      { route: 'PhotosAndVideos', label: 'Photos and videos', safe: true },
      { route: 'MyVideo', label: 'My introduction video', safe: true },
      { route: 'ImageViewer', label: 'Image viewer' },
      { route: 'EditProfileGroup', label: 'Edit profile section' },
      { route: 'EditInterests', label: 'Edit interests' },
    ],
  },
  {
    title: 'Messages and notifications',
    screens: [
      { route: 'Messages', label: 'Messages', safe: true },
      { route: 'SingleChat', label: 'Conversation' },
      { route: 'Notifications', label: 'Notifications', safe: true },
    ],
  },
  {
    title: 'Membership and payments',
    screens: [
      { route: 'MembershipInfo', label: 'Membership information', safe: true },
      { route: 'ProFeaturesPromotion', label: 'Premium paywall', safe: true },
      {
        route: 'DiscountProFeaturesPromotion',
        label: 'Discount paywall',
        safe: true,
      },
      {
        route: 'ChatCreditsPaywall',
        label: 'Chat credits paywall',
        safe: true,
      },
      { route: 'PaymentOptions', label: 'Payment options', safe: true },
      { route: 'BankTransfer', label: 'Bank transfer', safe: true },
      { route: 'MembershipCongrats', label: 'Membership confirmation' },
      {
        route: 'GiftMembershipCongrats',
        label: 'Gift membership confirmation',
      },
    ],
  },
  {
    title: 'Guardian / Wali',
    screens: [
      { route: 'AddWali', label: 'Add Wali', safe: true },
      { route: 'VerifyWaliCode', label: 'Verify Wali code' },
    ],
  },
  {
    title: 'Settings, support, and account',
    screens: [
      { route: 'Settings', label: 'Settings', safe: true },
      { route: 'PrivacySettings', label: 'Privacy settings', safe: true },
      { route: 'BlockedList', label: 'Blocked members', safe: true },
      { route: 'ChooseLanguage', label: 'Choose language', safe: true },
      { route: 'Languages', label: 'Languages', safe: true },
      { route: 'ContactSupport', label: 'Contact support', safe: true },
      { route: 'AccountDeletion', label: 'Account deletion', safe: true },
      { route: 'PurposeOfLeaving', label: 'Purpose of leaving', safe: true },
      {
        route: 'AccountDeleted',
        label: 'Account deleted confirmation',
        safe: true,
      },
      { route: 'AccountSuspended', label: 'Account suspended', safe: true },
    ],
  },
  {
    title: 'Tester tools',
    screens: [
      { route: 'TesterConsole', label: 'Tester console', safe: true },
      { route: 'TesterScreenInfo', label: 'Screen API information' },
      { route: 'TesterInsights', label: 'Member insights' },
      { route: 'TesterGallery', label: 'Protected gallery' },
      { route: 'TesterSplash', label: 'Splash replay', safe: true },
      { route: 'TesterScreenDirectory', label: 'Screen directory', safe: true },
    ],
  },
];

export default function TesterScreenDirectory({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'Home and discovery': true,
  });
  const normalizedSearch = search.trim().toLowerCase();
  const filteredGroups = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          screens: group.screens.filter((screen) =>
            `${screen.label} ${screen.route}`
              .toLowerCase()
              .includes(normalizedSearch)
          ),
        }))
        .filter((group) => group.screens.length > 0),
    [normalizedSearch]
  );

  return (
    <Container>
      <Header navigation={navigation} title="All app pages" />
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color={Colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search page name or route"
          placeholderTextColor={Colors.muted}
          autoCapitalize="none"
          style={styles.search}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color={Colors.muted} />
          </TouchableOpacity>
        )}
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {filteredGroups.map((group) => {
          const isOpen = normalizedSearch.length > 0 || expanded[group.title];
          return (
            <View key={group.title} style={styles.group}>
              <TouchableOpacity
                style={styles.groupHeader}
                onPress={() =>
                  setExpanded((current) => ({
                    ...current,
                    [group.title]: !current[group.title],
                  }))
                }
              >
                <View>
                  <Text style={styles.groupTitle}>{group.title}</Text>
                  <Text style={styles.groupCount}>
                    {group.screens.length} pages
                  </Text>
                </View>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.primary}
                />
              </TouchableOpacity>
              {isOpen &&
                group.screens.map((screen) => (
                  <TouchableOpacity
                    key={screen.route}
                    disabled={!screen.safe}
                    onPress={() => navigation.navigate(screen.route)}
                    style={[styles.screen, !screen.safe && styles.disabled]}
                  >
                    <View style={styles.screenIcon}>
                      <Ionicons
                        name={
                          screen.safe ? 'open-outline' : 'lock-closed-outline'
                        }
                        size={18}
                        color={screen.safe ? Colors.primary : Colors.muted}
                      />
                    </View>
                    <View style={styles.screenCopy}>
                      <Text style={styles.screenLabel}>{screen.label}</Text>
                      <Text style={styles.route}>{screen.route}</Text>
                    </View>
                    {!screen.safe && (
                      <Text style={styles.context}>Needs context</Text>
                    )}
                  </TouchableOpacity>
                ))}
            </View>
          );
        })}
        {filteredGroups.length === 0 && (
          <Text style={styles.empty}>No app pages match “{search}”.</Text>
        )}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    margin: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: '#fff',
  },
  search: { flex: 1, color: Colors.ink, paddingVertical: 11 },
  content: { paddingHorizontal: 14, paddingBottom: 100, gap: 12 },
  group: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.hairline,
    overflow: 'hidden',
  },
  groupHeader: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.themeLight,
  },
  groupTitle: { color: Colors.ink, fontWeight: '800', fontSize: 16 },
  groupCount: { color: Colors.muted, fontSize: 11, marginTop: 2 },
  screen: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  disabled: { opacity: 0.55 },
  screenIcon: { width: 30 },
  screenCopy: { flex: 1 },
  screenLabel: { color: Colors.ink, fontWeight: '600' },
  route: { color: Colors.muted, fontSize: 11, marginTop: 2 },
  context: { color: Colors.muted, fontSize: 10 },
  empty: { color: Colors.muted, textAlign: 'center', padding: 30 },
});
