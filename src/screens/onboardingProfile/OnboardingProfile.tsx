/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { ApiServices, StorageManager, useGlobalContext } from '../../services';
import ProfileQuestionWizard from '../profile/components/profile-question-wizard';
import Data from '../profile/Data';
import { updateDetails } from '../profile/Funtions';
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

type Phase = 'loading' | 'question' | 'checkpoint' | 'done';

const OnboardingProfile = ({ navigation, route }: any) => {
  const fromHome = route?.params?.from === 'Home';
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const { setData, storageKeys } = StorageManager;
  const gender = (currentUser as any)?.gender;

  const [phase, setPhase] = useState<Phase>('loading');
  const [groupIndex, setGroupIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [categoriesData, setCategoriesData] = useState<Record<string, any[]>>(
    {}
  );
  const [lastRewardChats, setLastRewardChats] = useState(0);

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

    const hydrateAll = (attribute: any) => {
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
      setPhase('question');
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
            setLastRewardChats(chats);
          } else {
            setLastRewardChats(0);
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
          setPhase('checkpoint');
        })
        .catch(() => setSaving(false));
    },
    [
      currentGroup.key,
      currentUser,
      setData,
      storageKeys.USER,
      updateCurrentUser,
    ]
  );

  const onContinueFromCheckpoint = useCallback(() => {
    if (isLastGroup) {
      setPhase('done');
      return;
    }
    setGroupIndex((i) => i + 1);
    setPhase('question');
  }, [isLastGroup]);

  if (phase === 'loading') {
    return (
      <Container style={Styles.screen}>
        <View style={Styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
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
          <Text style={Styles.strengthLabel}>{`${strengthPct}%`}</Text>
        </View>
        <View style={Styles.meterTrack}>
          <View style={[Styles.meterFill, { width: `${strengthPct}%` }]} />
        </View>
      </View>

      {phase === 'question' ? (
        <ProfileQuestionWizard
          key={currentGroup.key}
          fields={categoriesData[currentGroup.key] ?? []}
          gender={gender}
          saving={saving}
          finalLabel={LanguageKeys.continue}
          showSkip={false}
          onComplete={onGroupComplete}
        />
      ) : (
        <>
          <View style={Styles.checkpointBody}>
            <View style={Styles.checkpointCard}>
              {lastRewardChats > 0 ? (
                <View style={Styles.rewardChip}>
                  <Ionicons
                    name="chatbubbles"
                    size={wp(5)}
                    color={Colors.verified}
                  />
                  <Text style={Styles.rewardText}>
                    {`${LanguageKeys.youEarned} +${lastRewardChats} ${LanguageKeys.chatCredits}`}
                  </Text>
                </View>
              ) : null}
              <Text style={Styles.checkpointStrength}>{`${strengthPct}%`}</Text>
              <Text style={Styles.checkpointHint}>
                {LanguageKeys.matchQualityHint}
              </Text>
            </View>
          </View>
          <View style={Styles.footer}>
            <Button
              text={LanguageKeys.continue}
              onPress={onContinueFromCheckpoint}
            />
            <Ripple style={Styles.finishLaterBtn} onPress={bailFlow}>
              <Text style={Styles.finishLaterText}>
                {LanguageKeys.finishLater}
              </Text>
            </Ripple>
          </View>
        </>
      )}
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
  },
  meterTrack: {
    height: hp(0.9),
    borderRadius: hp(0.45),
    backgroundColor: Colors.lavender,
    overflow: 'hidden',
    marginTop: hp(1),
  },
  meterFill: {
    height: '100%',
    borderRadius: hp(0.45),
    backgroundColor: Colors.primary,
  },
  checkpointBody: { flex: 1, paddingHorizontal: wp(4), paddingTop: hp(2) },
  checkpointCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 16,
    padding: wp(5),
    alignItems: 'center',
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    backgroundColor: 'rgba(46,158,91,0.12)',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: 999,
    marginBottom: hp(2),
  },
  rewardText: {
    color: Colors.verified,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small2,
  },
  checkpointStrength: {
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_B,
    fontSize: wp(11),
  },
  checkpointHint: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    textAlign: 'center',
    marginTop: hp(1),
  },
  footer: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(2),
  },
  finishLaterBtn: {
    alignSelf: 'center',
    paddingVertical: hp(1.4),
    paddingHorizontal: wp(6),
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
});
