import { Sound } from 'react-native-nitro-sound';

import chatAudioService from './chat-audio-service';

jest.mock('react-native-nitro-sound', () => ({
  Sound: {
    addPlayBackListener: jest.fn(),
    addRecordBackListener: jest.fn(),
    pausePlayer: jest.fn().mockResolvedValue('paused'),
    removePlayBackListener: jest.fn(),
    removeRecordBackListener: jest.fn(),
    resumePlayer: jest.fn().mockResolvedValue('resumed'),
    startRecorder: jest.fn().mockResolvedValue('file:///tmp/voice.m4a'),
    stopRecorder: jest.fn().mockResolvedValue('file:///tmp/voice.m4a'),
    startPlayer: jest.fn().mockResolvedValue('playing'),
    stopPlayer: jest.fn().mockResolvedValue('stopped'),
  },
}));

describe('chatAudioService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  it('captures normalized waveform peaks while recording with metering enabled', async () => {
    await chatAudioService.startRecording();

    const recordListener = (Sound.addRecordBackListener as jest.Mock).mock
      .calls[0][0];
    recordListener({ currentPosition: 100, currentMetering: -54 });
    recordListener({ currentPosition: 200, currentMetering: -18 });

    const result = await chatAudioService.stopRecording(2);

    expect(Sound.startRecorder).toHaveBeenCalledWith(
      undefined,
      undefined,
      true
    );
    expect(result.waveform_peaks).toEqual([0.1, 0.7]);
    expect(Sound.removeRecordBackListener).toHaveBeenCalled();
  });

  it('notifies live waveform peaks while recording', async () => {
    const onWaveformPeak = jest.fn();

    await chatAudioService.startRecording({ onWaveformPeak });

    const recordListener = (Sound.addRecordBackListener as jest.Mock).mock
      .calls[0][0];
    recordListener({ currentPosition: 100, currentMetering: -42 });

    expect(onWaveformPeak).toHaveBeenCalledWith(0.3);
  });

  it('passes playback progress through and stops at the end', async () => {
    const onProgress = jest.fn();
    const onPlaybackEnd = jest.fn();

    await chatAudioService.play('https://example.test/audio.m4a', {
      onProgress,
      onPlaybackEnd,
    });

    const playListener = (Sound.addPlayBackListener as jest.Mock).mock
      .calls[0][0];
    playListener({ currentPosition: 400, duration: 1000 });
    playListener({ currentPosition: 1000, duration: 1000 });

    expect(onProgress).toHaveBeenCalledWith({
      currentPosition: 400,
      duration: 1000,
    });
    expect(Sound.stopPlayer).toHaveBeenCalled();
    expect(onPlaybackEnd).toHaveBeenCalled();
  });

  it('pauses and resumes native playback without clearing the player', async () => {
    await chatAudioService.pausePlayback();
    await chatAudioService.resumePlayback();

    expect(Sound.pausePlayer).toHaveBeenCalled();
    expect(Sound.resumePlayer).toHaveBeenCalled();
    expect(Sound.stopPlayer).not.toHaveBeenCalled();
  });
});
