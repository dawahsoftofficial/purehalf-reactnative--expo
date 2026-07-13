import { PermissionsAndroid, Platform } from 'react-native';
import { type PlayBackType, Sound } from 'react-native-nitro-sound';

export type RecordedChatAudio = {
  uri: string;
  name: string;
  type: 'audio/mp4';
  duration_seconds: number;
  waveform_peaks?: number[];
};

type PlaybackProgress = Pick<PlayBackType, 'currentPosition' | 'duration'>;

type PlaybackOptions = {
  onProgress?: (progress: PlaybackProgress) => void;
  onPlaybackEnd?: () => void;
};

type RecordingOptions = {
  onWaveformPeak?: (peak: number) => void;
};

class ChatAudioService {
  private activeRecordingUri: string | null = null;
  private waveformPeaks: number[] = [];

  /**
   * Android's recorder returns a bare absolute path (no scheme). React Native's
   * multipart uploader needs a file:// (or content://) URI to read the file, or
   * the upload fails at the network layer (ERR_NETWORK) before it is sent.
   */
  private toFileUri = (uri: string): string => {
    if (/^(file|content|https?):\/\//i.test(uri)) return uri;
    return `file://${uri}`;
  };

  private normalizeMetering = (metering?: number): number => {
    if (typeof metering !== 'number' || Number.isNaN(metering)) return 0.05;

    // Native metering is usually dBFS: near 0 is loud, around -60 is quiet.
    const normalized = (metering + 60) / 60;
    return Number(Math.min(1, Math.max(0.05, normalized)).toFixed(2));
  };

  private compactWaveform = (peaks: number[], targetCount = 32): number[] => {
    if (peaks.length <= targetCount) return peaks;

    return Array.from({ length: targetCount }).map((_, index) => {
      const start = Math.floor((index * peaks.length) / targetCount);
      const end = Math.max(
        start + 1,
        Math.floor(((index + 1) * peaks.length) / targetCount)
      );
      const bucket = peaks.slice(start, end);
      return Number(Math.max(...bucket).toFixed(2));
    });
  };

  /**
   * Ensures the microphone runtime permission is granted before recording.
   * Android needs an explicit request (RECORD_AUDIO is a dangerous permission);
   * iOS prompts automatically on first record via NSMicrophoneUsageDescription.
   */
  requestRecordPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  };

  startRecording = async (options?: RecordingOptions): Promise<string> => {
    Sound.removeRecordBackListener();
    Sound.setSubscriptionDuration?.(0.08);
    this.waveformPeaks = [];

    const uri = await Sound.startRecorder(undefined, undefined, true);
    this.activeRecordingUri = uri;
    Sound.addRecordBackListener((meta) => {
      const peak = this.normalizeMetering(meta.currentMetering);
      this.waveformPeaks.push(peak);
      options?.onWaveformPeak?.(peak);
    });
    return uri;
  };

  stopRecording = async (
    durationSeconds: number
  ): Promise<RecordedChatAudio> => {
    const uri = await Sound.stopRecorder();
    Sound.removeRecordBackListener();
    this.activeRecordingUri = null;
    const waveformPeaks = this.compactWaveform(this.waveformPeaks);
    this.waveformPeaks = [];

    return {
      uri: this.toFileUri(uri),
      name: 'voice.m4a',
      type: 'audio/mp4',
      duration_seconds: durationSeconds,
      ...(waveformPeaks.length > 0 ? { waveform_peaks: waveformPeaks } : {}),
    };
  };

  cancelRecording = async (): Promise<void> => {
    if (!this.activeRecordingUri) return;
    await Sound.stopRecorder();
    Sound.removeRecordBackListener();
    this.activeRecordingUri = null;
    this.waveformPeaks = [];
  };

  play = async (
    url: string,
    optionsOrEnd?: PlaybackOptions | (() => void)
  ): Promise<void> => {
    const options =
      typeof optionsOrEnd === 'function'
        ? { onPlaybackEnd: optionsOrEnd }
        : optionsOrEnd;

    // Clear any stale listener before starting a fresh playback.
    Sound.removePlayBackListener();
    await Sound.startPlayer(url);
    Sound.addPlayBackListener((meta) => {
      options?.onProgress?.({
        currentPosition: meta.currentPosition,
        duration: meta.duration,
      });

      // currentPosition/duration are in ms; reset once playback reaches the end.
      if (meta.duration > 0 && meta.currentPosition >= meta.duration) {
        this.stopPlayback();
        options?.onPlaybackEnd?.();
      }
    });
  };

  pausePlayback = async (): Promise<void> => {
    await Sound.pausePlayer();
  };

  resumePlayback = async (): Promise<void> => {
    await Sound.resumePlayer();
  };

  stopPlayback = async (): Promise<void> => {
    Sound.removePlayBackListener();
    await Sound.stopPlayer();
  };
}

const chatAudioService = new ChatAudioService();
export default chatAudioService;
