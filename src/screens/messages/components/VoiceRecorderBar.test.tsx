import { render } from '@testing-library/react-native';
import React from 'react';

jest.mock('../../../global', () => ({
  __esModule: true,
  wp: (value: number) => value,
  hp: (value: number) => value,
}));
jest.mock('../SingleChat.styles', () => ({
  __esModule: true,
  default: new Proxy({}, { get: () => ({}) }),
}));

import VoiceRecorderBar from './VoiceRecorderBar';

describe('VoiceRecorderBar', () => {
  it('renders timer and send action', () => {
    const view = render(
      <VoiceRecorderBar
        elapsedSeconds={7}
        isSending={false}
        onCancel={jest.fn()}
        onSend={jest.fn()}
      />
    );

    expect(JSON.stringify(view.toJSON())).toContain('0:07');
  });
});
