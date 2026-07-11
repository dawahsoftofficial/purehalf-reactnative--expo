/* eslint-disable @typescript-eslint/no-explicit-any */
import { t } from 'i18next';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Button, Container, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import {
  cancelProfileReminder,
  scheduleProfileReminder,
} from '../../notifications/profile-reminder';
import { Colors, Fonts } from '../../res';
import {
  ApiServices,
  flashSuccessMessage,
  StorageManager,
  useGlobalContext,
} from '../../services';
import { useSettingsStore } from '../../stores';
import GiftBadge from '../profile/components/gift-badge';
import GiftClaimModal from '../profile/components/gift-claim-modal';
import ProfileQuestionWizard from '../profile/components/profile-question-wizard';
import Data from '../profile/Data';
import { updateDetails } from '../profile/Funtions';
import {
  buildUpdatedUserAfterGiftClaim,
  giftClaimChats,
  shouldShowGiftClaimToast,
} from '../profile/gift-claim-outcome';
import { hydrateGroupFields } from '../profile/hydrate-group-fields';
import {
  computeCompletion,
  GROUP_META,
  type GroupMeta,
} from '../profile/profile-hub';

// The six onboarding groups, in the approved order. Titles and icons are
// reused from the ME section's GROUP_META so they never drift out of sync.
const GROUP_ORDER = [
  'appearanceAndHealth',
  'islamicValues',
  'lifeStyle',
  'futurePlan',
  'familyBackground',
  'personalityRequirements',
];

const GROUP_SEQUENCE = GROUP_ORDER.map((key) =>
  GROUP_META.find((g) => g.key === key)
).filter((g): g is GroupMeta => Boolean(g));

type Phase = 'loading' | 'intro' | 'question' | 'done';

const OnboardingProfile = ({ navigation, route }: any) => {
  const fromHome = route?.params?.from === 'Home';
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const { setData, getData, storageKeys } = StorageManager;
  const gender = (currentUser as any)?.gender;

  const [phase, setPhase] = useState<Phase>('loading');
  const [groupIndex, setGroupIndex] = useState(0);
  const [startAtEnd, setStartAtEnd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categoriesData, setCategoriesData] = useState<Record<string, any[]>>(
    {}
  );
  const [giftModalVisible, setGiftModalVisible] = useState(false);

  // Snapshot the detail once at mount. Saving a group calls updateCurrentUser,
  // and if hydration re-read the live currentUser it would re-hydrate mid-flow
  // and reset the wizard — so the initial values are frozen here.
  const detailSnapshotRef = useRef<any>((currentUser as any)?.detail ?? {});

  // Onboarding runs before the home screen populates the ATTRIBUTE cache, so
  // fetch it here and hydrate every group up front. This runs ONCE on mount:
  // depending on currentUser would re-fire it after every group save and
  // clobber the checkpoint phase, trapping the user on the same group.
  useEffect(() => {
    let alive = true;

    const hydrateAll = async (attribute: any) => {
      const detail = detailSnapshotRef.current;
      const hydrated: Record<string, any[]> = {};
      GROUP_SEQUENCE.forEach(({ key }) => {
        hydrated[key] = hydrateGroupFields(
          Data[key] ?? [],
          attribute ?? {},
          detail
        );
      });
      setCategoriesData(hydrated);
      let introSeen = false;
      try {
        introSeen = Boolean(await getData(storageKeys.ONBOARDING_INTRO_SEEN));
      } catch {
        // Storage read failed — default to showing the intro rather than
        // getting stuck on the loading spinner with no recovery path.
        introSeen = false;
      }
      if (!alive) return;
      setPhase(introSeen ? 'question' : 'intro');
    };

    ApiServices.getAttribute()
      .then((attribute: any) => {
        if (!alive) return;
        hydrateAll(attribute);
      })
      .catch(() => {
        if (!alive) return;
        // Options-less questions (input/scalling/binary) still work without it.
        hydrateAll({});
      });

    return () => {
      alive = false;
    };
  }, []);

  const strengthPct = useMemo(
    () =>
      computeCompletion({
        categoriesData,
        interests: [],
        tagline: (currentUser as any)?.detail?.tagline,
        gender,
      }),
    [categoriesData, currentUser, gender]
  );

  const giftThreshold =
    useSettingsStore().getProfileCompletionThresholdPercent();
  const giftCredits = useSettingsStore().getProfileCompletionGiftCredits();
  const giftClaimed = Boolean(
    (currentUser as any)?.profile_finish_bonus_awarded
  );
  const giftEligible = !giftClaimed && strengthPct >= giftThreshold;

  const exitFlow = useCallback(() => {
    cancelProfileReminder();
    const next = fromHome ? 'BottomTab' : 'ProfilePicture';
    navigation.reset({ index: 0, routes: [{ name: next }] });
  }, [fromHome, navigation]);

  const bailFlow = useCallback(() => {
    scheduleProfileReminder();
    const next = fromHome ? 'BottomTab' : 'ProfilePicture';
    navigation.reset({ index: 0, routes: [{ name: next }] });
  }, [fromHome, navigation]);

  const onIntroContinue = useCallback(() => {
    setData(storageKeys.ONBOARDING_INTRO_SEEN, true);
    setPhase('question');
  }, [setData, storageKeys.ONBOARDING_INTRO_SEEN]);

  const openGiftModal = useCallback(() => setGiftModalVisible(true), []);
  const closeGiftModal = useCallback(() => setGiftModalVisible(false), []);

  // Services.tsx's Promise executors are untyped (bare `Promise<unknown>`),
  // so callers cast at the call site — matching the existing
  // `as unknown as User` idiom already used elsewhere in this codebase
  // (e.g. Header.tsx's getCurrentUserDetail call) rather than a bare `as`,
  // which TS rejects between unrelated types.
  const claimGift = useCallback(
    () =>
      ApiServices.claimProfileGift() as unknown as Promise<{
        status: string;
        awarded: number;
        new_balance: number;
        multiplier: number;
      }>,
    []
  );

  const onGiftClaimed = useCallback(
    (result: any) => {
      setGiftModalVisible(false);
      const updatedUser = buildUpdatedUserAfterGiftClaim(currentUser, result);
      setData(storageKeys.USER, updatedUser);
      updateCurrentUser(updatedUser);
      // A repeat claim resolves with status: 'already_claimed' (awarded: 0)
      // instead of rejecting — see ApiServices.claimProfileGift's JSDoc. Only
      // show the reward toast for a genuinely fresh claim so stale local
      // state (e.g. multi-device use) doesn't surface a confusing "+0 Chat
      // Credits" toast; the badge's claimed checkmark already communicates
      // the already-claimed state.
      if (shouldShowGiftClaimToast(result)) {
        const chats = giftClaimChats(result);
        flashSuccessMessage(
          `${t(LanguageKeys.youEarned)} +${chats} ${t(LanguageKeys.chatCredits)}`
        );
      }
    },
    [currentUser, setData, storageKeys.USER, updateCurrentUser]
  );

  const currentGroup = GROUP_SEQUENCE[groupIndex];
  const isLastGroup = groupIndex >= GROUP_SEQUENCE.length - 1;

  const onGroupComplete = useCallback(
    (formData: any[]) => {
      setSaving(true);
      // Persist this group and reflect the saved values in the meter.
      setCategoriesData((prev) => ({ ...prev, [currentGroup.key]: formData }));
      updateDetails(formData)
        .then(async (res: any) => {
          const reward = res?.reward;
          if (reward && reward.awarded > 0) {
            const chats = Math.round(
              reward.awarded / (reward.multiplier || 50)
            );
            // Reward is surfaced as a lightweight toast now that the between-
            // groups checkpoint screen is gone. Translate each key first — the
            // flash helper t()s the whole string, which can't resolve a
            // concatenation of keys.
            flashSuccessMessage(
              `${t(LanguageKeys.youEarned)} +${chats} ${t(LanguageKeys.chatCredits)}`
            );
          }
          if (res?.detail) {
            const updatedUser: any = {
              ...(currentUser as any),
              detail: res.detail,
            };
            if (reward && typeof reward.new_balance === 'number') {
              updatedUser.chat_credits = reward.new_balance;
            }
            await setData(storageKeys.USER, updatedUser);
            updateCurrentUser(updatedUser);
          }
          setSaving(false);
          if (isLastGroup) {
            setPhase('done');
          } else {
            // Straight on to the next group — no interstitial.
            setStartAtEnd(false);
            setGroupIndex((i) => i + 1);
          }
        })
        .catch(() => setSaving(false));
    },
    [
      currentGroup.key,
      currentUser,
      isLastGroup,
      setData,
      storageKeys.USER,
      updateCurrentUser,
    ]
  );

  // Back from the first question of a group returns to the previous group,
  // landing on its last question.
  const goToPrevGroup = useCallback(() => {
    setStartAtEnd(true);
    setGroupIndex((i) => Math.max(i - 1, 0));
  }, []);

  if (phase === 'loading') {
    return (
      <Container style={Styles.screen}>
        <View style={Styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </Container>
    );
  }

  if (phase === 'intro') {
    return (
      <Container style={Styles.screen}>
        <View style={Styles.center}>
          <View style={Styles.doneBadge}>
            <Ionicons name="gift-outline" size={wp(9)} color={Colors.color2} />
          </View>
          <Text variant="display" style={Styles.doneTitle}>
            {LanguageKeys.onboardingIntroTitle}
          </Text>
          <Text style={Styles.doneBody}>
            {LanguageKeys.onboardingIntroBody}
          </Text>
          <View style={Styles.introRewardChip}>
            <Ionicons name="gift" size={wp(4)} color={Colors.primary} />
            <Text style={Styles.introRewardChipTxt}>
              {LanguageKeys.onboardingIntroRewardChip}
            </Text>
          </View>
        </View>
        <View style={Styles.footer}>
          <Button
            text={LanguageKeys.onboardingIntroCta}
            onPress={onIntroContinue}
          />
        </View>
      </Container>
    );
  }

  if (phase === 'done') {
    return (
      <Container style={Styles.screen}>
        <View style={Styles.center}>
          <View style={Styles.doneBadge}>
            <Ionicons name="checkmark" size={wp(9)} color={Colors.color2} />
          </View>
          <Text variant="display" style={Styles.doneTitle}>
            {LanguageKeys.onboardingDoneTitle}
          </Text>
          <Text style={Styles.doneBody}>{LanguageKeys.onboardingDoneBody}</Text>
        </View>
        <View style={Styles.footer}>
          <Button text={LanguageKeys.continue} onPress={exitFlow} />
        </View>
      </Container>
    );
  }

  return (
    <Container style={Styles.screen}>
      <View style={Styles.header}>
        <View style={Styles.headerRow}>
          <View style={Styles.groupNameRow}>
            <View style={Styles.groupIconChip}>
              <Ionicons
                name={currentGroup.icon}
                size={wp(4.5)}
                color={Colors.primary}
              />
            </View>
            <Text style={Styles.groupName} numberOfLines={1}>
              {currentGroup.title}
            </Text>
          </View>
          <View style={Styles.headerEndRow}>
            <Ripple onPress={saving ? undefined : bailFlow} disabled={saving}>
              <Text style={Styles.finishLaterText}>
                {LanguageKeys.finishLater}
              </Text>
            </Ripple>
            <GiftBadge
              eligible={giftEligible}
              claimed={giftClaimed}
              onPress={openGiftModal}
            />
          </View>
        </View>
        <View style={Styles.meterRow}>
          <View style={Styles.meterTrack}>
            <View style={[Styles.meterFill, { width: `${strengthPct}%` }]} />
          </View>
          <Text style={Styles.strengthLabel}>{`${strengthPct}%`}</Text>
        </View>
      </View>

      <ProfileQuestionWizard
        key={currentGroup.key}
        fields={categoriesData[currentGroup.key] ?? []}
        gender={gender}
        saving={saving}
        finalLabel={LanguageKeys.continue}
        showSkip={false}
        startAtEnd={startAtEnd}
        onBack={groupIndex > 0 ? goToPrevGroup : undefined}
        onComplete={onGroupComplete}
      />
      <GiftClaimModal
        visible={giftModalVisible}
        giftCredits={giftCredits}
        onClose={closeGiftModal}
        onClaimed={onGiftClaimed}
        claim={claimGift}
      />
    </Container>
  );
};

export default OnboardingProfile;

const Styles = StyleSheet.create({
  screen: { backgroundColor: Colors.appBg, flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(8),
  },
  header: { paddingHorizontal: wp(4), paddingTop: hp(2), paddingBottom: hp(1) },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupNameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2.5),
    marginRight: wp(3),
  },
  headerEndRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2.5),
  },
  groupIconChip: {
    width: wp(8),
    height: wp(8),
    borderRadius: 9,
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: {
    flexShrink: 1,
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small3,
  },
  strengthLabel: {
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small1,
    minWidth: wp(9),
    textAlign: 'right',
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    marginTop: hp(1),
  },
  meterTrack: {
    flex: 1,
    height: hp(0.9),
    borderRadius: hp(0.45),
    backgroundColor: Colors.lavender,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: hp(0.45),
    backgroundColor: Colors.primary,
  },
  footer: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(2),
  },
  finishLaterText: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small2,
  },
  doneBadge: {
    width: wp(18),
    height: wp(18),
    borderRadius: wp(9),
    backgroundColor: Colors.verified,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2),
  },
  doneTitle: {
    color: Colors.ink,
    fontSize: Typography.large2,
    textAlign: 'center',
    alignSelf: 'center',
  },
  doneBody: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    textAlign: 'center',
    alignSelf: 'center',
    marginTop: hp(1),
  },
  introRewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    backgroundColor: Colors.lavender,
    borderRadius: 999,
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    marginTop: hp(2.5),
  },
  introRewardChipTxt: {
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small2,
  },
});
