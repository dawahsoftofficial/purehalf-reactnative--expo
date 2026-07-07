import { PermissionsAndroid, Platform } from 'react-native';
import { Sound } from 'react-native-nitro-sound';

export type RecordedChatAudio = {
  uri: string;
  name: string;
  type: 'audio/mp4';
  duration_seconds: number;
};

class ChatAudioService {
  private activeRecordingUri: string | null = null;

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

  startRecording = async (): Promise<string> => {
    const uri = await Sound.startRecorder();
    this.activeRecordingUri = uri;
    return uri;
  };

  stopRecording = async (
    durationSeconds: number
  ): Promise<RecordedChatAudio> => {
    const uri = await Sound.stopRecorder();
    this.activeRecordingUri = null;

    return {
      uri,
      name: 'voice.m4a',
      type: 'audio/mp4',
      duration_seconds: durationSeconds,
    };
  };

  cancelRecording = async (): Promise<void> => {
    if (!this.activeRecordingUri) return;
    await Sound.stopRecorder();
    this.activeRecordingUri = null;
  };

  play = async (url: string, onPlaybackEnd?: () => void): Promise<void> => {
    // Clear any stale listener before starting a fresh playback.
    Sound.removePlayBackListener();
    await Sound.startPlayer(url);
    Sound.addPlayBackListener((meta) => {
      // currentPosition/duration are in ms; reset once playback reaches the end.
      if (meta.duration > 0 && meta.currentPosition >= meta.duration) {
        this.stopPlayback();
        onPlaybackEnd?.();
      }
    });
  };

  stopPlayback = async (): Promise<void> => {
    Sound.removePlayBackListener();
    await Sound.stopPlayer();
  };
}

const chatAudioService = new ChatAudioService();
export default chatAudioService;
