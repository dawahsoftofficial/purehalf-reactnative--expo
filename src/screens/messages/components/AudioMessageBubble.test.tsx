import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

jest.mock('../../../services/api/message-services', () => ({
  __esModule: true,
  default: {
    getMessageAudioUrl: jest
      .fn()
      .mockResolvedValue({ url: '', expires_at: '' }),
  },
}));
jest.mock('../../../services/audio/chat-audio-service', () => ({
  __esModule: true,
  default: { play: jest.fn(), stopPlayback: jest.fn() },
}));
jest.mock('../../../global', () => ({
  __esModule: true,
  wp: (value: number) => value,
  hp: (value: number) => value,
}));

import AudioMessageBubble from './AudioMessageBubble';

const baseMessage = {
  id: 1,
  type: 'audio',
  body: 'Voice message',
  created_at: '2026-07-05 10:00:00',
  audio: {
    path: 'pure-half/chat-audio/1/voice.m4a',
    duration_seconds: 18,
    mime: 'audio/mp4',
    size_bytes: 100,
    waveform_peaks: [0.2, 0.6, 1],
  },
};

const baseStyles = {
  audioBubbleContent: {},
  audioPlayButton: {},
  audioWaveTrack: {},
  audioWaveBar: {},
  audioDuration: {},
  audioProgressText: {},
  messageTimeAndStatusWrapper: {},
  messageTimeInline: {},
};

describe('AudioMessageBubble', () => {
  it('renders duration and play control for an audio message', () => {
    const { toJSON } = render(
      <AudioMessageBubble
        item={baseMessage}
        isCurrentUser={true}
        textColour="#ffffff"
        isRead={false}
        messageStatus="sent"
        isBlockedYou={false}
        playback={{
          status: 'idle',
          positionMillis: 0,
          durationMillis: 0,
          isActive: false,
        }}
        onTogglePlayback={jest.fn()}
        Styles={baseStyles}
      />
    );

    expect(JSON.stringify(toJSON())).toContain('0:18');
  });

  it('renders pause and playback timeline when this audio is active', () => {
    render(
      <AudioMessageBubble
        item={baseMessage}
        isCurrentUser={true}
        textColour="#ffffff"
        isRead={false}
        messageStatus="sent"
        isBlockedYou={false}
        playback={{
          status: 'playing',
          positionMillis: 6500,
          durationMillis: 18000,
          isActive: true,
        }}
        onTogglePlayback={jest.fn()}
        Styles={baseStyles}
      />
    );

    expect(screen.getByTestId('audio-pause-icon')).toBeTruthy();
    expect(screen.getByText('0:06 / 0:18')).toBeTruthy();
  });

  it('delegates play presses to the screen-owned playback controller', () => {
    const onTogglePlayback = jest.fn();
    render(
      <AudioMessageBubble
        item={baseMessage}
        isCurrentUser={true}
        textColour="#ffffff"
        isRead={false}
        messageStatus="sent"
        isBlockedYou={false}
        playback={{
          status: 'idle',
          positionMillis: 0,
          durationMillis: 0,
          isActive: false,
        }}
        onTogglePlayback={onTogglePlayback}
        Styles={baseStyles}
      />
    );

    fireEvent.press(screen.getByTestId('audio-playback-toggle'));

    expect(onTogglePlayback).toHaveBeenCalledWith(baseMessage);
  });

  it('shows a spinner while audio is loading', () => {
    render(
      <AudioMessageBubble
        item={baseMessage}
        isCurrentUser={true}
        textColour="#ffffff"
        isRead={false}
        messageStatus="sent"
        isBlockedYou={false}
        playback={{
          status: 'loading',
          positionMillis: 0,
          durationMillis: 0,
          isActive: true,
        }}
        onTogglePlayback={jest.fn()}
        Styles={baseStyles}
      />
    );

    expect(screen.getByTestId('audio-loading-spinner')).toBeTruthy();
  });
});
