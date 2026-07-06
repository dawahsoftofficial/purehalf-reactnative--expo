import chatAudioService from './chat-audio-service';

jest.mock('react-native-nitro-sound', () => ({
  Sound: {
    startRecorder: jest.fn().mockResolvedValue('file:///tmp/voice.m4a'),
    stopRecorder: jest.fn().mockResolvedValue('file:///tmp/voice.m4a'),
    startPlayer: jest.fn().mockResolvedValue('playing'),
    stopPlayer: jest.fn().mockResolvedValue('stopped'),
  },
}));

describe('chatAudioService', () => {
  it('normalizes a stopped recording into upload file metadata', async () => {
    const result = await chatAudioService.stopRecording(12);

    expect(result).toEqual({
      uri: 'file:///tmp/voice.m4a',
      name: 'voice.m4a',
      type: 'audio/mp4',
      duration_seconds: 12,
    });
  });
});
