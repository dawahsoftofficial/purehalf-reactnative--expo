import { render } from '@testing-library/react-native';
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

describe('AudioMessageBubble', () => {
  it('renders duration and play control for an audio message', () => {
    const { toJSON } = render(
      <AudioMessageBubble
        item={{
          id: 1,
          type: 'audio',
          body: 'Voice message',
          created_at: '2026-07-05 10:00:00',
          audio: {
            path: 'pure-half/chat-audio/1/voice.m4a',
            duration_seconds: 18,
            mime: 'audio/mp4',
            size_bytes: 100,
          },
        }}
        isCurrentUser={true}
        textColour="#ffffff"
        isRead={false}
        messageStatus="sent"
        isBlockedYou={false}
        Styles={{
          audioBubbleContent: {},
          audioPlayButton: {},
          audioWaveTrack: {},
          audioWaveBar: {},
          audioDuration: {},
          messageTimeAndStatusWrapper: {},
          messageTimeInline: {},
        }}
      />
    );

    expect(JSON.stringify(toJSON())).toContain('0:18');
  });
});
