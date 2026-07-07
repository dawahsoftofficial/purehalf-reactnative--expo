import { Sound } from 'react-native-nitro-sound';

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

  it('prefixes a bare Android path with file:// for the multipart upload', async () => {
    (Sound.stopRecorder as jest.Mock).mockResolvedValueOnce(
      '/data/user/0/com.purehalf/cache/sound_123.mp4'
    );

    const result = await chatAudioService.stopRecording(5);

    expect(result.uri).toBe(
      'file:///data/user/0/com.purehalf/cache/sound_123.mp4'
    );
  });
});
