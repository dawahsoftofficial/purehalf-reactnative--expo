/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import Ripple from 'react-native-material-ripple';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Button, Container } from '../../components';
import { hp, Typography, wp } from '../../global';
import { Colors, Fonts } from '../../res';
import { ApiServices, StorageManager } from '../../services';
import { addAnaylatics } from '../../services/firebase/analytics';
import { useSettingsStore } from '../../stores';
import StepControl from './components/step-control';
import { journeyFor } from './journeys';
import {
  computeProgress,
  formatMatchCount,
  nextStepIndex,
  prevStepIndex,
  questionPosition,
} from './primer-logic';
import type { PrimerGender, PrimerStepDef } from './primer-types';

type Phase = 'gender' | 'questions' | 'loading' | 'reveal';

const isAnswered = (step: PrimerStepDef, value: any): boolean => {
  if (!step.required) return true;
  if (step.control === 'habits') return !!(value?.smoke && value?.drink);
  return value != null;
};

// Continuous twinkle for the reveal's star badge.
const TWINKLE = {
  0: { opacity: 0.7, scale: 0.9 },
  0.5: { opacity: 1, scale: 1.15 },
  1: { opacity: 0.7, scale: 0.9 },
};

// Counts up from 0 to `value` on mount (easeOut), formatted like the final
// number, so the reveal number "grows" into place.
const CountUp = ({ value, style }: { value: number; style: any }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start = 0;
    const duration = 1200;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setDisplay(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <RNText style={style}>{formatMatchCount(display)}</RNText>;
};

const SignupPrimer = ({ navigation }: any) => {
  const { setData, storageKeys } = StorageManager;
  const [phase, setPhase] = useState<Phase>('gender');
  const [gender, setGender] = useState<PrimerGender | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [count, setCount] = useState<number | null>(null);
  const [founding, setFounding] = useState(false);
  const enableMatchCountReveal = useSettingsStore().getEnableMatchCountReveal();

  const steps = useMemo(() => (gender ? journeyFor(gender) : []), [gender]);
  const current = steps[stepIndex];
  const progress = useMemo(
    () => computeProgress(steps, answers, stepIndex),
    [steps, answers, stepIndex]
  );
  const questionCount = useMemo(
    () => questionPosition(steps, answers, stepIndex),
    [steps, answers, stepIndex]
  );

  const markSeen = useCallback(() => {
    setData(storageKeys.PRIMER_SEEN, true);
  }, [setData, storageKeys.PRIMER_SEEN]);

  const persist = useCallback(
    (nextAnswers: Record<string, any>, g: PrimerGender | null) => {
      setData(storageKeys.PRIMER_ANSWERS, { gender: g, answers: nextAnswers });
    },
    [setData, storageKeys.PRIMER_ANSWERS]
  );

  const exitFlow = useCallback(() => {
    markSeen();
    navigation.reset({ index: 0, routes: [{ name: 'AuthWelcome' }] });
  }, [markSeen, navigation]);

  const onSelectGender = useCallback((g: PrimerGender) => {
    setGender(g);
    setPhase('questions');
    setStepIndex(0);
    addAnaylatics('primer_started', { gender: g });
  }, []);

  const onChange = useCallback(
    (value: any) => {
      if (!current) return;
      setAnswers((prev) => {
        const next = { ...prev, [current.id]: value };
        persist(next, gender);
        return next;
      });
    },
    [current, gender, persist]
  );

  const fetchCount = useCallback(async () => {
    if (!gender) return;
    const seeking = gender === 'female' ? 'male' : 'female';
    const age = answers.partner_age ?? {};
    try {
      const res: any = await ApiServices.getMatchCount({
        seeking,
        min_age: age.min,
        max_age: age.max,
      });
      const raw = Number(res?.count ?? res?.raw_count);
      if (res?.founding || !Number.isFinite(raw) || raw < 50) {
        setFounding(true);
      } else {
        setCount(raw);
      }
    } catch {
      setFounding(true); // graceful: number-free founding-member copy
    }
  }, [answers.partner_age, gender]);

  const advance = useCallback(async () => {
    if (!current) return;
    addAnaylatics('primer_step', { gender, step: current.id });
    const next = nextStepIndex(steps, answers, stepIndex);
    if (next === -1) {
      if (!enableMatchCountReveal) {
        exitFlow();
        return;
      }
      setPhase('loading');
      await fetchCount();
      setPhase('reveal');
      markSeen();
    } else {
      setStepIndex(next);
    }
  }, [
    answers,
    current,
    enableMatchCountReveal,
    exitFlow,
    fetchCount,
    gender,
    markSeen,
    stepIndex,
    steps,
  ]);

  // Step back to the previous visible question; from the first question, return
  // to the gender step so nothing is a dead end.
  const goBack = useCallback(() => {
    const prev = prevStepIndex(steps, answers, stepIndex);
    if (prev === -1) {
      setPhase('gender');
    } else {
      setStepIndex(prev);
    }
  }, [answers, stepIndex, steps]);

  // --- Gender select -------------------------------------------------------
  if (phase === 'gender') {
    return (
      <Container style={Styles.screen}>
        <View style={Styles.genderWrap}>
          <RNText style={Styles.title}>Let&apos;s start with you</RNText>
          <RNText style={Styles.subtitle}>I am a…</RNText>
          <View style={Styles.tiles}>
            <Ripple
              style={Styles.tile}
              onPress={() => onSelectGender('female')}
              rippleContainerBorderRadius={16}
            >
              <View style={Styles.tileIcon}>
                <Ionicons name="female" size={wp(7)} color={Colors.primary} />
              </View>
              <RNText style={Styles.tileTxt}>Woman</RNText>
            </Ripple>
            <Ripple
              style={Styles.tile}
              onPress={() => onSelectGender('male')}
              rippleContainerBorderRadius={16}
            >
              <View style={Styles.tileIcon}>
                <Ionicons name="male" size={wp(7)} color={Colors.primaryMid} />
              </View>
              <RNText style={Styles.tileTxt}>Man</RNText>
            </Ripple>
          </View>
        </View>
        <View style={Styles.footer}>
          <Ripple style={Styles.laterBtn} onPress={exitFlow}>
            <RNText style={Styles.laterTxt}>Maybe later</RNText>
          </Ripple>
        </View>
      </Container>
    );
  }

  // --- Loading -------------------------------------------------------------
  if (phase === 'loading') {
    return (
      <Container style={Styles.screen}>
        <View style={Styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </Container>
    );
  }

  // --- Reveal --------------------------------------------------------------
  if (phase === 'reveal') {
    const age = answers.partner_age ?? {};
    const lead =
      gender === 'female'
        ? "They're here, and they're serious. Your wali can be part of every conversation — you're always in control."
        : 'Start with respect. Every match keeps her family in the loop — the way it should be.';
    const subject =
      gender === 'female'
        ? 'practising, marriage-minded men match what you’re looking for'
        : 'sincere, marriage-minded women match what you’re looking for';
    return (
      <Container style={Styles.screen}>
        <View style={Styles.center}>
          <Animatable.View
            animation={TWINKLE}
            iterationCount="infinite"
            duration={1800}
            easing="ease-in-out"
            useNativeDriver
            style={Styles.sparkBadge}
          >
            <Ionicons name="sparkles" size={wp(8)} color={Colors.primary} />
          </Animatable.View>
          {founding || count == null ? (
            <>
              <RNText style={Styles.foundingTitle}>Be among the first</RNText>
              <RNText style={Styles.revealSub}>
                Early members get priority matching. Create your account and
                you&apos;ll be first in line for new members.
              </RNText>
            </>
          ) : (
            <>
              <CountUp value={count} style={Styles.revealNum} />
              <RNText style={Styles.revealSub}>{subject}</RNText>
              {age.min ? (
                <View style={Styles.revealChip}>
                  <RNText style={Styles.revealChipTxt}>
                    {`aged ${age.min}–${age.max}`}
                  </RNText>
                </View>
              ) : null}
              <RNText style={Styles.revealLead}>{lead}</RNText>
            </>
          )}
        </View>
        <View style={Styles.footer}>
          <Button
            text="Create your account to meet them"
            onPress={exitFlow}
            textStyle={Styles.revealBtnTxt}
          />
        </View>
      </Container>
    );
  }

  // --- Questions -----------------------------------------------------------
  const value = answers[current.id];
  const showSupport =
    !!current.support &&
    (current.supportIf ? current.supportIf(answers) : true);
  const continueDisabled = !isAnswered(current, value);

  return (
    <Container style={Styles.screen}>
      <View style={Styles.header}>
        <View style={Styles.headerRow}>
          <View style={Styles.headerLeft}>
            <Ripple
              onPress={goBack}
              style={Styles.backBtn}
              rippleContainerBorderRadius={999}
            >
              <Ionicons name="arrow-back" size={wp(5.6)} color={Colors.ink} />
            </Ripple>
            <RNText style={Styles.questionCount}>
              {`Question ${questionCount.current} of ${questionCount.total}`}
            </RNText>
          </View>
          <Ripple onPress={advance}>
            <RNText style={Styles.laterTxt}>Skip</RNText>
          </Ripple>
        </View>
        <View style={Styles.meterTrack}>
          <View style={[Styles.meterFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={Styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <RNText style={Styles.qTitle}>{current.question}</RNText>
        {current.subtitle ? (
          <RNText style={Styles.qSub}>{current.subtitle}</RNText>
        ) : null}
        <View style={Styles.controlWrap}>
          <StepControl
            key={current.id}
            step={current}
            value={value}
            onChange={onChange}
            onAdvance={advance}
          />
        </View>
        {showSupport ? (
          <View style={Styles.supportBox}>
            <RNText style={Styles.supportTxt}>{current.support}</RNText>
          </View>
        ) : null}
      </ScrollView>

      {current.control !== 'single' ? (
        <View style={Styles.footer}>
          <Button
            text={stepIndex >= steps.length - 1 ? 'See my matches' : 'Continue'}
            onPress={advance}
            disabled={continueDisabled}
          />
        </View>
      ) : null}
    </Container>
  );
};

export default SignupPrimer;

const Styles = StyleSheet.create({
  screen: { backgroundColor: Colors.appBg, flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(8),
  },
  header: { paddingHorizontal: wp(5), paddingTop: hp(1.5) },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
  },
  questionCount: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small1,
  },
  backBtn: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -wp(1.5),
  },
  meterTrack: {
    height: hp(0.7),
    borderRadius: 999,
    backgroundColor: Colors.lavender,
    overflow: 'hidden',
    marginTop: hp(1.2),
  },
  meterFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  body: { paddingHorizontal: wp(5), paddingTop: hp(2.5), paddingBottom: hp(2) },
  qTitle: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.large,
    lineHeight: wp(7),
  },
  qSub: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    marginTop: hp(0.7),
  },
  controlWrap: { marginTop: hp(2.5) },
  supportBox: {
    marginTop: hp(2),
    backgroundColor: 'rgba(46,158,91,0.12)',
    borderRadius: 12,
    padding: wp(4),
  },
  supportTxt: {
    color: Colors.verified,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small2,
    lineHeight: wp(5.2),
  },
  footer: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1.2),
    paddingBottom: hp(2),
  },
  laterBtn: { alignSelf: 'center', paddingVertical: hp(1.4) },
  laterTxt: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small2,
  },
  // gender
  genderWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: wp(5),
  },
  title: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.large2,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small3,
    textAlign: 'center',
    marginTop: hp(1),
    marginBottom: hp(4),
  },
  tiles: { flexDirection: 'row', gap: wp(3) },
  tile: {
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.hairline,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: hp(3),
    alignItems: 'center',
    gap: hp(1.2),
  },
  tileIcon: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(7.5),
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTxt: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small3,
  },
  // reveal
  sparkBadge: {
    width: wp(18),
    height: wp(18),
    borderRadius: wp(9),
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2),
  },
  revealNum: {
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_B,
    fontSize: wp(14),
  },
  foundingTitle: {
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.large2,
    textAlign: 'center',
  },
  revealSub: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small3,
    textAlign: 'center',
    marginTop: hp(1),
    lineHeight: wp(5.6),
  },
  revealChip: {
    marginTop: hp(1.8),
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 999,
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.8),
    backgroundColor: Colors.surface,
  },
  revealChipTxt: {
    color: Colors.primaryMid,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small1,
  },
  revealLead: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    textAlign: 'center',
    marginTop: hp(2),
    lineHeight: wp(5.4),
  },
  // Smaller than the default button text + a wider cap than the Button's
  // maxWidth:wp(60), so the CTA fits on one line.
  revealBtnTxt: {
    fontSize: Typography.small2,
    maxWidth: wp(85),
  },
});
