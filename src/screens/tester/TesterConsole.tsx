import { CommonActions } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  DevSettings,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import NewBadgeIcon from '../../assets/svgs/badges/new-badge.svg';
import PopularBadgeIcon from '../../assets/svgs/badges/popular-badge.svg';
import ProfileCompleteBadgeIcon from '../../assets/svgs/badges/profile-complete-badge.svg';
import VipBadgeIcon from '../../assets/svgs/badges/vip-badge.svg';
import { Container, Header } from '../../components';
import { Colors } from '../../res';
import {
  flashErrorMessage,
  flashSuccessMessage,
  StorageManager,
  TesterApi,
  useGlobalContext,
} from '../../services';
import BaseUrl from '../../services/api/BaseUrl';
import {
  useRatingStore,
  useSettingsStore,
  useTesterPreviewStore,
  useUserStatsStore,
} from '../../stores';
import TesterNotesTab from './TesterNotesTab';

const Button = ({
  label,
  onPress,
  danger = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}) => (
  <TouchableOpacity
    disabled={disabled}
    onPress={onPress}
    style={[
      styles.button,
      danger && styles.danger,
      disabled && styles.disabled,
    ]}
  >
    <Text style={styles.buttonText}>{label}</Text>
  </TouchableOpacity>
);

const VIP_PACKAGES = [
  {
    name: 'Plus Starter',
    badge: 'Starter',
    priority: 'Low',
    bonusChats: 10,
    dailyChats: 3,
    productId: 'plus_starter',
    benefits: [
      'See who liked you',
      'See profile visitors from the last 7 days',
      'Basic chat filters',
      'Enhanced visibility above free members',
    ],
  },
  {
    name: 'Pro Recommended',
    badge: 'Recommended',
    priority: 'Medium',
    bonusChats: 15,
    dailyChats: 6,
    productId: 'pro_recommended',
    benefits: [
      'See and sort everyone who liked you',
      'See profile visitors from the last 30 days',
      'Advanced chat filters',
      'Higher visibility than Starter and free members',
    ],
  },
  {
    name: 'Elite Highest Visibility',
    badge: 'VIP / Maximum visibility',
    priority: 'High',
    bonusChats: 30,
    dailyChats: 12,
    productId: 'elite_highest_visibility',
    benefits: [
      'Full likes and profile-views access',
      'Advanced chat filters',
      'Highest membership search priority',
      'Maximum visibility above Pro, Starter, and free members',
    ],
  },
] as const;

function VipPackagesTab() {
  return (
    <View style={styles.packageList}>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Current VIP package behavior</Text>
        <Text style={styles.infoText}>
          Static tester reference for the three packages currently shown on the
          membership paywall. Search priority is applied only while membership
          is active.
        </Text>
      </View>

      {VIP_PACKAGES.map((plan, index) => (
        <View
          key={plan.productId}
          style={[
            styles.packageCard,
            index === VIP_PACKAGES.length - 1 && styles.elitePackageCard,
          ]}
        >
          <View style={styles.packageHeader}>
            <View style={styles.packageTitleWrap}>
              <Text style={styles.packageName}>{plan.name}</Text>
              <Text style={styles.packageId}>{plan.productId}</Text>
            </View>
            <View style={styles.packageBadge}>
              <Text style={styles.packageBadgeText}>{plan.badge}</Text>
            </View>
          </View>

          <View style={styles.packageStats}>
            <View style={styles.packageStat}>
              <Text style={styles.packageStatValue}>+{plan.bonusChats}</Text>
              <Text style={styles.packageStatLabel}>Chats on purchase</Text>
            </View>
            <View style={styles.packageStat}>
              <Text style={styles.packageStatValue}>{plan.dailyChats}</Text>
              <Text style={styles.packageStatLabel}>Chats every day</Text>
            </View>
            <View style={styles.packageStat}>
              <Text style={styles.packageStatValue}>{plan.priority}</Text>
              <Text style={styles.packageStatLabel}>Search priority</Text>
            </View>
          </View>

          <Text style={styles.includesTitle}>What to test</Text>
          {plan.benefits.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <Text style={styles.benefitCheck}>✓</Text>
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>
      ))}

      <View style={styles.testNote}>
        <Text style={styles.testNoteTitle}>Daily gift behavior</Text>
        <Text style={styles.testNoteText}>
          Each package earns its listed daily chats after every full 24 hours.
          Missed days accumulate. Home should show the VIP daily-gift popup with
          every waiting day and the combined chat total before collection.
        </Text>
      </View>
    </View>
  );
}

const BADGE_PREVIEWS = [
  {
    key: 'vipMember',
    name: 'VIP',
    Icon: VipBadgeIcon,
    condition: 'Active paid membership.',
  },
  {
    key: 'boosted',
    name: 'Boosted',
    Icon: PopularBadgeIcon,
    condition: 'The profile payload has boosted or is_boosted set to true.',
  },
  {
    key: 'completedProfile',
    name: 'Complete',
    Icon: ProfileCompleteBadgeIcon,
    condition: 'All required profile-completion fields are present.',
  },
  {
    key: 'newMember',
    name: 'New',
    Icon: NewBadgeIcon,
    condition: 'Account age is inside the configured New-member window.',
  },
] as const;

function BadgesTab() {
  const badgeConfig = useSettingsStore(
    (state) => state.getBadgesAndPayments()?.badges ?? null
  );
  const newMemberDays = badgeConfig?.newMember?.maxAccountAgeDays ?? 7;

  return (
    <View style={styles.packageList}>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Member badge previews</Text>
        <Text style={styles.infoText}>
          These are the exact SVG icons used on profile cards. Enablement and
          surface visibility come from the badges_and_payments admin setting.
        </Text>
      </View>

      <View style={styles.badgePreviewGrid}>
        {BADGE_PREVIEWS.map((badge) => {
          const config = badgeConfig?.[badge.key];
          const enabled = config?.enabled ?? badge.key !== 'newMember';
          const Icon = badge.Icon;

          return (
            <View key={badge.key} style={styles.badgePreviewCard}>
              <View style={styles.badgePreviewIcon}>
                <Icon width={56} height={56} />
              </View>
              <View style={styles.badgePreviewCopy}>
                <View style={styles.badgePreviewTitleRow}>
                  <Text style={styles.badgePreviewName}>{badge.name}</Text>
                  <View
                    style={[
                      styles.badgeConfigState,
                      enabled
                        ? styles.badgeConfigStateEnabled
                        : styles.badgeConfigStateDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeConfigStateText,
                        enabled && styles.badgeConfigStateTextEnabled,
                      ]}
                    >
                      {enabled ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.badgePreviewCondition}>
                  {badge.condition}
                </Text>
                {badge.key === 'newMember' ? (
                  <Text style={styles.badgePreviewMeta}>
                    Current window: {newMemberDays} day
                    {newMemberDays === 1 ? '' : 's'}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.testNote}>
        <Text style={styles.testNoteTitle}>Surface controls</Text>
        <Text style={styles.testNoteText}>
          A badge must be enabled and its current app surface must be switched
          on. The New badge additionally requires a valid created_at date.
        </Text>
      </View>
    </View>
  );
}

type TesterTab = 'actions' | 'vip' | 'badges' | 'notes';

function TesterTabs({
  active,
  onChange,
}: {
  active: TesterTab;
  onChange: (tab: TesterTab) => void;
}) {
  return (
    <View style={styles.tabs}>
      {(
        [
          ['actions', 'Actions'],
          ['vip', 'VIP'],
          ['badges', 'Badges'],
          ['notes', 'Notes'],
        ] as const
      ).map(([value, label]) => (
        <TouchableOpacity
          key={value}
          style={[styles.tab, active === value && styles.tabActive]}
          onPress={() => onChange(value)}
        >
          <Text
            style={[styles.tabText, active === value && styles.tabTextActive]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function TesterConsole({ navigation }: any) {
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const [busy, setBusy] = useState(false);
  const [gender, setGender] = useState(currentUser?.gender || 'male');
  const [dob, setDob] = useState(currentUser?.date_of_birth || '');
  const [creditAmount, setCreditAmount] = useState('50');
  const [activeTab, setActiveTab] = useState<TesterTab>('actions');
  const setUserStats = useUserStatsStore((state) => state.setUserStats);
  const userStats = useUserStatsStore();

  useEffect(() => {
    TesterApi.status().catch(() => {
      flashErrorMessage('Tester access is no longer enabled.');
      navigation.goBack();
    });
  }, [navigation]);

  const mergeUser = async (updates: any) => {
    const merged = { ...currentUser, ...updates };
    updateCurrentUser(merged);
    await StorageManager.setData(StorageManager.storageKeys.USER, merged);
  };

  const run = async (operation: () => Promise<any>, success: string) => {
    setBusy(true);
    try {
      const state = await operation();
      if (state) await mergeUser(state);
      flashSuccessMessage(success);
    } catch (error: any) {
      flashErrorMessage(
        error?.response?.data?.message || 'Tester action failed.'
      );
    } finally {
      setBusy(false);
    }
  };

  const goToBeginning = async () => {
    await StorageManager.deleteData(StorageManager.storageKeys.PRIMER_SEEN);
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'SignupPrimer' }] })
    );
  };

  const playSplash = () => navigation.navigate('TesterSplash');

  const goHome = () =>
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'BottomTab' }] })
    );

  // Close the tester tool and show the rating popup (rendered app-wide from
  // Initialization, so it appears over home once we land there).
  const openRatingScreen = () => {
    goHome();
    useRatingStore.getState().show('tester_preview');
  };

  // Close the tester tool and ask home to show the daily-gift calendar popup.
  const openGiftCalendar = () => {
    useTesterPreviewStore.getState().requestGiftCalendar();
    goHome();
  };

  const restartApp = () =>
    Alert.alert(
      'Restart Pure Half?',
      'The app will reload now. Your signed-in tester session will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restart app',
          onPress: () => {
            if (typeof DevSettings.reload === 'function') {
              DevSettings.reload('Tester requested app restart');
              return;
            }

            navigation.dispatch(
              CommonActions.reset({ index: 0, routes: [{ name: 'BottomTab' }] })
            );
          },
        },
      ]
    );

  const deleteSelf = () =>
    Alert.alert(
      'Permanently delete test account?',
      'This permanently removes this user and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete completely',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await TesterApi.deleteSelf();
              await StorageManager.deleteAll();
              updateCurrentUser(null);
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'AuthWelcome' }],
                })
              );
            } catch (error: any) {
              flashErrorMessage(
                error?.response?.data?.message || 'Account deletion failed.'
              );
              setBusy(false);
            }
          },
        },
      ]
    );

  const parsedCredits = Number.parseInt(creditAmount, 10);

  const resetData = (
    type: 'daily_recommendations' | 'visits_to_me' | 'liked_by_me' | 'likes_me',
    label: string
  ) =>
    Alert.alert(label, 'This clears the selected test data from both sides.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            const result = await TesterApi.resetSelfData(type);
            if (type === 'visits_to_me') {
              setUserStats(
                userStats.like_count,
                0,
                userStats.photo_request_count
              );
            } else if (type === 'likes_me') {
              setUserStats(
                0,
                userStats.visit_count,
                userStats.photo_request_count
              );
            } else if (type === 'daily_recommendations') {
              await mergeUser({
                reviewed_top_picks: null,
                recommend_api_hit_at: null,
              });
            }
            flashSuccessMessage(
              `${label}: ${result.cleared_count} record${result.cleared_count === 1 ? '' : 's'} cleared.`
            );
          } catch (error: any) {
            flashErrorMessage(
              error?.response?.data?.message || 'Could not clear tester data.'
            );
          } finally {
            setBusy(false);
          }
        },
      },
    ]);

  if (activeTab === 'vip') {
    return (
      <Container>
        <Header navigation={navigation} title="Tester tools" />
        <ScrollView contentContainerStyle={styles.content}>
          <TesterTabs active={activeTab} onChange={setActiveTab} />
          <VipPackagesTab />
        </ScrollView>
      </Container>
    );
  }

  if (activeTab === 'badges') {
    return (
      <Container>
        <Header navigation={navigation} title="Tester tools" />
        <ScrollView contentContainerStyle={styles.content}>
          <TesterTabs active={activeTab} onChange={setActiveTab} />
          <BadgesTab />
        </ScrollView>
      </Container>
    );
  }

  if (activeTab === 'notes') {
    return (
      <Container>
        <Header navigation={navigation} title="Tester tools" />
        <ScrollView contentContainerStyle={styles.content}>
          <TesterTabs active={activeTab} onChange={setActiveTab} />
          <TesterNotesTab navigation={navigation} />
        </ScrollView>
      </Container>
    );
  }

  return (
    <Container>
      <Header navigation={navigation} title="Tester tools" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.warning}>
          <Text style={styles.warningTitle}>Protected tester console</Text>
          <Text style={styles.warningText}>
            Every server action is authorized against your live tester flag.
            Changes affect real test data.
          </Text>
          <Text style={styles.warningText}>API: {BaseUrl}</Text>
        </View>

        <TesterTabs active={activeTab} onChange={setActiveTab} />

        <Text style={styles.heading}>Account state</Text>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.row}>
          {(['male', 'female'] as const).map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.choice, gender === value && styles.choiceSelected]}
              onPress={() => setGender(value)}
            >
              <Text
                style={
                  gender === value
                    ? styles.choiceTextSelected
                    : styles.choiceText
                }
              >
                {value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Button
          label="Save gender"
          onPress={() =>
            run(() => TesterApi.updateSelf({ gender }), 'Gender updated.')
          }
          disabled={busy}
        />

        <Text style={styles.label}>Date of birth (YYYY-MM-DD)</Text>
        <TextInput
          value={dob}
          onChangeText={setDob}
          style={styles.input}
          autoCapitalize="none"
        />
        <Button
          label="Save date of birth"
          onPress={() =>
            run(
              () => TesterApi.updateSelf({ date_of_birth: dob }),
              'Date of birth updated.'
            )
          }
          disabled={busy}
        />

        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.label}>Open all profile galleries</Text>
            <Text style={styles.meta}>
              Private media remains server protected until this is enabled.
            </Text>
          </View>
          <Switch
            value={!!currentUser?.tester_can_view_private_media}
            onValueChange={(value) =>
              run(
                () =>
                  TesterApi.updateSelf({
                    tester_can_view_private_media: value,
                  }),
                'Gallery override updated.'
              )
            }
            disabled={busy}
          />
        </View>

        <Text style={styles.label}>Chat credit amount (raw credits)</Text>
        <TextInput
          value={creditAmount}
          onChangeText={setCreditAmount}
          style={styles.input}
          keyboardType="number-pad"
        />
        <View style={styles.row}>
          <View style={styles.flex}>
            <Button
              label="Add credits"
              onPress={() =>
                run(
                  () => TesterApi.adjustCredits('add', parsedCredits),
                  'Credits added.'
                )
              }
              disabled={
                busy || !Number.isInteger(parsedCredits) || parsedCredits < 1
              }
            />
          </View>
          <View style={styles.flex}>
            <Button
              label="Remove credits"
              onPress={() =>
                run(
                  () => TesterApi.adjustCredits('remove', parsedCredits),
                  'Credits removed.'
                )
              }
              disabled={
                busy || !Number.isInteger(parsedCredits) || parsedCredits < 1
              }
            />
          </View>
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.label}>VIP</Text>
          <Switch
            value={!!currentUser?.membership_status}
            onValueChange={(value) =>
              run(
                () =>
                  TesterApi.updateSelf({
                    membership_status: value ? 1 : 0,
                  }),
                `VIP ${value ? 'enabled' : 'disabled'}.`
              )
            }
            disabled={busy}
          />
        </View>

        <Text style={styles.heading}>Discovery and interactions</Text>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.label}>Invisible profile visits</Text>
            <Text style={styles.meta}>
              Opening another profile will not register a visit.
            </Text>
          </View>
          <Switch
            value={!!currentUser?.tester_is_invisible}
            onValueChange={(value) =>
              run(
                () => TesterApi.updateSelf({ tester_is_invisible: value }),
                `Invisible visits ${value ? 'enabled' : 'disabled'}.`
              )
            }
            disabled={busy}
          />
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.label}>Force recommendation heart</Text>
            <Text style={styles.meta}>
              Shows the header heart and bypasses the tester time window.
            </Text>
          </View>
          <Switch
            value={!!currentUser?.tester_force_recommendations}
            onValueChange={(value) =>
              run(
                () =>
                  TesterApi.updateSelf({
                    tester_force_recommendations: value,
                  }),
                `Recommendation override ${value ? 'enabled' : 'disabled'}.`
              )
            }
            disabled={busy}
          />
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.label}>Show all badges on testers</Text>
            <Text style={styles.meta}>
              Tester profiles display VIP, Boosted, Complete, and New badges.
            </Text>
          </View>
          <Switch
            value={!!currentUser?.tester_show_all_badges}
            onValueChange={(value) =>
              run(
                () => TesterApi.updateSelf({ tester_show_all_badges: value }),
                `Tester badge override ${value ? 'enabled' : 'disabled'}.`
              )
            }
            disabled={busy}
          />
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.label}>
              Show testers in daily recommendations
            </Text>
            <Text style={styles.meta}>
              Compatible tester accounts are placed first in the daily deck.
            </Text>
          </View>
          <Switch
            value={!!currentUser?.tester_show_testers_in_daily_recommendations}
            onValueChange={(value) =>
              run(
                () =>
                  TesterApi.updateSelf({
                    tester_show_testers_in_daily_recommendations: value,
                  }),
                `Daily tester profiles ${value ? 'enabled' : 'disabled'}.`
              )
            }
            disabled={busy}
          />
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.label}>
              Show testers at top of Recommendations
            </Text>
            <Text style={styles.meta}>
              Compatible tester accounts are pinned to the first page.
            </Text>
          </View>
          <Switch
            value={!!currentUser?.tester_show_testers_on_top}
            onValueChange={(value) =>
              run(
                () =>
                  TesterApi.updateSelf({
                    tester_show_testers_on_top: value,
                  }),
                `Tester priority ${value ? 'enabled' : 'disabled'}.`
              )
            }
            disabled={busy}
          />
        </View>
        <Button
          label="Show tester accounts"
          onPress={() => navigation.navigate('TesterDirectory')}
          disabled={busy}
        />
        <Button
          label="Reset daily recommendation history"
          onPress={() =>
            resetData('daily_recommendations', 'Recommendation history')
          }
          disabled={busy}
        />
        <Button
          label="Clear visits to my profile"
          onPress={() => resetData('visits_to_me', 'Visits to my profile')}
          disabled={busy}
        />
        <Button
          label="Clear profiles liked by me"
          onPress={() => resetData('liked_by_me', 'Profiles liked by me')}
          disabled={busy}
        />
        <Button
          label="Clear people who like me"
          onPress={() => resetData('likes_me', 'People who like me')}
          disabled={busy}
        />

        <Text style={styles.heading}>Screen previews</Text>
        <Button
          label="Open the rating screen"
          onPress={openRatingScreen}
          disabled={busy}
        />
        <Button
          label="Gift calendar"
          onPress={openGiftCalendar}
          disabled={busy}
        />

        <Text style={styles.heading}>Navigation</Text>
        <Button
          label="All app pages / screen directory"
          onPress={() => navigation.navigate('TesterScreenDirectory')}
        />

        <Text style={styles.heading}>App flow</Text>
        <Button label="Restart app" onPress={restartApp} disabled={busy} />
        <Button
          label="Go to pre-registration beginning"
          onPress={goToBeginning}
        />
        <Button label="Play splash screen" onPress={playSplash} />

        <Text style={styles.heading}>Destructive</Text>
        <Button
          label="Delete myself completely"
          onPress={deleteSelf}
          danger
          disabled={busy}
        />
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 120, gap: 10 },
  warning: {
    backgroundColor: '#FFF3CD',
    borderColor: '#E6B800',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  warningTitle: { color: '#493A00', fontWeight: '700', fontSize: 16 },
  warningText: { color: '#493A00', marginTop: 4, lineHeight: 19 },
  heading: {
    color: Colors.ink,
    fontWeight: '800',
    fontSize: 18,
    marginTop: 14,
  },
  label: { color: Colors.ink, fontWeight: '700', fontSize: 14 },
  meta: { color: Colors.muted, fontSize: 12 },
  input: {
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    color: Colors.ink,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 13,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  buttonText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  danger: { backgroundColor: Colors.attention },
  disabled: { opacity: 0.45 },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  choice: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 9,
  },
  choiceSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  choiceText: { color: Colors.ink, textTransform: 'capitalize' },
  choiceTextSelected: {
    color: '#fff',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  switchCopy: { flex: 1 },
  tabs: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    backgroundColor: Colors.appBg,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  tab: {
    flex: 1,
    minHeight: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.muted, fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: '#fff' },
  packageList: { gap: 14, paddingTop: 4 },
  infoCard: {
    backgroundColor: '#EEF4FF',
    borderColor: '#BDD1F8',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  infoTitle: { color: Colors.ink, fontSize: 16, fontWeight: '800' },
  infoText: {
    color: Colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  packageCard: {
    backgroundColor: '#fff',
    borderColor: Colors.hairline,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  elitePackageCard: { borderColor: Colors.primary, borderWidth: 2 },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  packageTitleWrap: { flex: 1 },
  packageName: { color: Colors.ink, fontSize: 17, fontWeight: '800' },
  packageId: { color: Colors.muted, fontSize: 11, marginTop: 3 },
  packageBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
    maxWidth: 130,
  },
  packageBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  packageStats: { flexDirection: 'row', gap: 8, marginTop: 14 },
  packageStat: {
    flex: 1,
    minHeight: 74,
    backgroundColor: Colors.appBg,
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageStatValue: { color: Colors.primary, fontSize: 17, fontWeight: '900' },
  packageStatLabel: {
    color: Colors.muted,
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    marginTop: 3,
  },
  includesTitle: {
    color: Colors.ink,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 3,
  },
  benefitRow: { flexDirection: 'row', gap: 8, marginTop: 7 },
  benefitCheck: { color: Colors.primary, fontSize: 14, fontWeight: '900' },
  benefitText: { color: Colors.ink, fontSize: 12, lineHeight: 17, flex: 1 },
  testNote: {
    backgroundColor: '#F5EDFF',
    borderColor: '#D8BDF4',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  testNoteTitle: { color: Colors.ink, fontSize: 15, fontWeight: '800' },
  testNoteText: {
    color: Colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  badgePreviewGrid: { gap: 10 },
  badgePreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderColor: Colors.hairline,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  badgePreviewIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.appBg,
  },
  badgePreviewCopy: { flex: 1 },
  badgePreviewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgePreviewName: { color: Colors.ink, fontSize: 16, fontWeight: '800' },
  badgePreviewCondition: {
    color: Colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },
  badgePreviewMeta: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
  },
  badgeConfigState: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F1F1F1',
  },
  badgeConfigStateEnabled: { backgroundColor: '#E8F7EE' },
  badgeConfigStateDisabled: { backgroundColor: '#F1F1F1' },
  badgeConfigStateText: {
    color: Colors.muted,
    fontSize: 10,
    fontWeight: '800',
  },
  badgeConfigStateTextEnabled: { color: Colors.verified },
});
