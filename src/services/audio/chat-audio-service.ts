import { Sound } from 'react-native-nitro-sound';

export type RecordedChatAudio = {
  uri: string;
  name: string;
  type: 'audio/mp4';
  duration_seconds: number;
};

class ChatAudioService {
  private activeRecordingUri: string | null = null;

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

  play = async (url: string): Promise<void> => {
    await Sound.startPlayer(url);
  };

  stopPlayback = async (): Promise<void> => {
    await Sound.stopPlayer();
  };
}

const chatAudioService = new ChatAudioService();
export default chatAudioService;
