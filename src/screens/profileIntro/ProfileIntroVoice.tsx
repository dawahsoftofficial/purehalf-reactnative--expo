import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Container, Header, Text } from '../../components';
import { hp, Typography, wp } from '../../global';
import { LanguageKeys } from '../../languages';
import { Colors, Fonts } from '../../res';
import {
  ApiServices,
  flashErrorMessage,
  flashSuccessMessage,
  StorageManager,
  useGlobalContext,
} from '../../services';
import chatAudioService, {
  type RecordedChatAudio,
} from '../../services/audio/chat-audio-service';

const idlePeaks = [
  0.2, 0.38, 0.62, 0.32, 0.74, 0.5, 0.9, 0.44, 0.68, 0.28, 0.8, 0.56, 0.36, 0.7,
  0.46, 0.24,
];

const ProfileIntroVoice = ({ navigation }: any) => {
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const { setData, storageKeys } = StorageManager;
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [recorded, setRecorded] = useState<RecordedChatAudio | null>(null);
  const [playing, setPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const recordingRef = useRef(false);
  const elapsedRef = useRef(0);
  const stoppingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const finishRecording = useCallback(async () => {
    if (!recordingRef.current || stoppingRef.current) return;
    stoppingRef.current = true;
    clearTimer();
    try {
      const duration = Math.max(1, Math.min(10, Math.ceil(elapsedRef.current)));
      const result = await chatAudioService.stopRecording(duration);
      setRecorded(result);
      setPeaks(result.waveform_peaks ?? []);
    } catch {
      flashErrorMessage();
    } finally {
      recordingRef.current = false;
      stoppingRef.current = false;
      setRecording(false);
    }
  }, []);

  useEffect(
    () => () => {
      clearTimer();
      if (recordingRef.current) void chatAudioService.cancelRecording();
      void chatAudioService.stopPlayback().catch(() => undefined);
    },
    []
  );

  const startRecording = async () => {
    const granted = await chatAudioService.requestRecordPermission();
    if (!granted) {
      flashErrorMessage(LanguageKeys.microphonePermissionRequired);
      return;
    }

    setRecorded(null);
    setPeaks([]);
    setElapsed(0);
    elapsedRef.current = 0;
    try {
      await chatAudioService.startRecording({
        onWaveformPeak: (peak) =>
          setPeaks((current) => [...current.slice(-23), peak]),
      });
      recordingRef.current = true;
      setRecording(true);
      timerRef.current = setInterval(() => {
        elapsedRef.current = Number((elapsedRef.current + 0.1).toFixed(1));
        setElapsed(elapsedRef.current);
        if (elapsedRef.current >= 10) void finishRecording();
      }, 100);
    } catch {
      flashErrorMessage();
    }
  };

  const retake = async () => {
    if (playing) await chatAudioService.stopPlayback().catch(() => undefined);
    setPlaying(false);
    setRecorded(null);
    setPeaks([]);
    setElapsed(0);
  };

  const togglePlayback = async () => {
    if (!recorded?.uri) return;
    if (playing) {
      await chatAudioService.stopPlayback();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    await chatAudioService.play(recorded.uri, () => setPlaying(false));
  };

  const submit = async () => {
    if (!recorded || uploading) return;
    setUploading(true);
    try {
      const media = await ApiServices.imageUpload(recorded, 'intro_voice', []);
      const updatedUser = { ...currentUser, media };
      updateCurrentUser(updatedUser);
      await setData(storageKeys.USER, updatedUser);
      flashSuccessMessage(LanguageKeys.mediaSubmittedForReview);
      navigation.goBack();
    } catch (error: any) {
      flashErrorMessage(error?.message);
    } finally {
      setUploading(false);
    }
  };

  const shownPeaks = peaks.length > 0 ? peaks : idlePeaks;
  const secondsLeft = Math.max(0, 10 - elapsed);

  return (
    <Container style={Styles.screen} barBg={Colors.appBg}>
      <Header title={LanguageKeys.voiceIntroTitle} navigation={navigation} />
      <View style={Styles.content}>
        <View style={Styles.timerPill}>
          <View style={[Styles.liveDot, recording && Styles.liveDotActive]} />
          <Text style={Styles.timerText}>
            {recording
              ? `${secondsLeft.toFixed(1)}s`
              : LanguageKeys.tenSecondMaximum}
          </Text>
        </View>

        <View style={Styles.waveCard}>
          <View style={Styles.waveform}>
            {shownPeaks.map((peak, index) => (
              <View
                key={index}
                style={[
                  Styles.waveBar,
                  recording && Styles.waveBarRecording,
                  { height: hp(2 + Math.min(1, Math.max(0.05, peak)) * 11) },
                ]}
              />
            ))}
          </View>
          <Text style={Styles.stateLabel}>
            {recording
              ? LanguageKeys.recording
              : recorded
                ? LanguageKeys.playRecording
                : LanguageKeys.tapToRecord}
          </Text>
        </View>

        {!recorded ? (
          <Ripple
            style={[Styles.recordButton, recording && Styles.stopButton]}
            onPress={recording ? finishRecording : startRecording}
          >
            <View style={recording ? Styles.stopSquare : Styles.recordDot} />
          </Ripple>
        ) : (
          <Ripple
            style={Styles.playButton}
            onPress={togglePlayback}
            disabled={uploading}
          >
            <Ionicons
              name={playing ? 'stop' : 'play'}
              size={wp(9)}
              color={Colors.color2}
            />
          </Ripple>
        )}

        {recorded ? (
          <View style={Styles.actions}>
            <Ripple
              style={Styles.secondaryButton}
              onPress={retake}
              disabled={uploading}
            >
              <Ionicons name="refresh" size={wp(5)} color={Colors.primary} />
              <Text style={Styles.secondaryText}>{LanguageKeys.retake}</Text>
            </Ripple>
            <Ripple
              style={Styles.submitButton}
              onPress={submit}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={Colors.color2} />
              ) : (
                <Ionicons name="checkmark" size={wp(5)} color={Colors.color2} />
              )}
              <Text style={Styles.submitText}>
                {LanguageKeys.submitForReview}
              </Text>
            </Ripple>
          </View>
        ) : null}
      </View>
    </Container>
  );
};

export default ProfileIntroVoice;

const Styles = StyleSheet.create({
  screen: { backgroundColor: Colors.appBg },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingTop: hp(5),
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    backgroundColor: Colors.surface,
    borderRadius: 999,
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.9),
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  liveDot: {
    width: wp(2.2),
    height: wp(2.2),
    borderRadius: wp(1.1),
    backgroundColor: Colors.primaryLite,
  },
  liveDotActive: { backgroundColor: Colors.attention },
  timerText: {
    color: Colors.ink,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small2,
    alignSelf: 'center',
  },
  waveCard: {
    width: '100%',
    minHeight: hp(30),
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.hairline,
    marginTop: hp(4),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(5),
  },
  waveform: {
    height: hp(15),
    flexDirection: 'row',
    gap: wp(0.9),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  waveBar: {
    width: wp(1.1),
    borderRadius: 99,
    backgroundColor: Colors.primaryLite,
  },
  waveBarRecording: { backgroundColor: Colors.attention },
  stateLabel: {
    color: Colors.muted,
    fontFamily: Fonts.APPFONT_M,
    fontSize: Typography.small2,
    marginTop: hp(1),
    alignSelf: 'center',
  },
  recordButton: {
    width: wp(25),
    height: wp(25),
    borderRadius: wp(12.5),
    backgroundColor: Colors.surface,
    borderWidth: 4,
    borderColor: Colors.attention,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(5),
    shadowColor: Colors.attention,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  stopButton: { backgroundColor: 'rgba(211,72,54,0.08)' },
  recordDot: {
    width: wp(17),
    height: wp(17),
    borderRadius: wp(8.5),
    backgroundColor: Colors.attention,
  },
  stopSquare: {
    width: wp(10),
    height: wp(10),
    borderRadius: 5,
    backgroundColor: Colors.attention,
  },
  playButton: {
    width: wp(22),
    height: wp(22),
    borderRadius: wp(11),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(5),
  },
  actions: {
    flexDirection: 'row',
    gap: wp(3),
    width: '100%',
    marginTop: 'auto',
    marginBottom: hp(3),
  },
  secondaryButton: {
    flex: 1,
    minHeight: hp(6),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primaryLite,
    flexDirection: 'row',
    gap: wp(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    flex: 1.7,
    minHeight: hp(6),
    borderRadius: 16,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    gap: wp(2),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(2),
  },
  secondaryText: {
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small1,
  },
  submitText: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_SB,
    fontSize: Typography.small1,
  },
});
