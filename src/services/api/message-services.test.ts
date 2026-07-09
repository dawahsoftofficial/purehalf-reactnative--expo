import EndPoints from './EndPoints';
import messageServices from './message-services';
import { Api } from './Middleware';

jest.mock('./Middleware', () => ({
  Api: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

describe('messageServices audio messages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends text messages as JSON payloads', async () => {
    (Api.post as jest.Mock).mockResolvedValue({
      data: {
        error: false,
        results: {
          id: 1,
          conversation_id: 2,
          body: 'Assalamu alaikum',
          type: 'text',
          sender_type: 'User',
          sender_id: 3,
          created_at: '2026-07-05 10:00:00',
          statuses: [],
          audio: null,
        },
      },
    });

    await messageServices.sendConversationMessage(2, {
      type: 'text',
      body: 'Assalamu alaikum',
    });

    expect(Api.post).toHaveBeenCalledWith(
      EndPoints.sendConversationMessage(2),
      { type: 'text', body: 'Assalamu alaikum' }
    );
  });

  it('sends audio messages as form data', async () => {
    (Api.post as jest.Mock).mockResolvedValue({
      data: {
        error: false,
        results: {
          id: 1,
          conversation_id: 2,
          body: 'Voice message',
          type: 'audio',
          sender_type: 'User',
          sender_id: 3,
          created_at: '2026-07-05 10:00:00',
          statuses: [],
          audio: {
            path: 'pure-half/chat-audio/2/voice.m4a',
            duration_seconds: 12,
            mime: 'audio/mp4',
            size_bytes: 100,
          },
        },
      },
    });

    await messageServices.sendConversationMessage(2, {
      type: 'audio',
      audio: {
        uri: 'file:///tmp/voice.m4a',
        name: 'voice.m4a',
        type: 'audio/mp4',
      },
      duration_seconds: 12,
      waveform_peaks: [0.1, 0.5, 0.9],
    });

    const [, payload] = (Api.post as jest.Mock).mock.calls[0];
    expect(payload).toBeInstanceOf(FormData);
    const payloadEntries = (payload as any)._parts
      ? (payload as any)._parts
      : Array.from((payload as any).entries());
    expect(payloadEntries).toContainEqual([
      'waveform_peaks',
      JSON.stringify([0.1, 0.5, 0.9]),
    ]);
  });

  it('fetches a temporary audio playback url', async () => {
    (Api.get as jest.Mock).mockResolvedValue({
      data: {
        error: false,
        results: {
          url: 'https://signed.example.test/audio.m4a',
          expires_at: '2026-07-05 10:05:00',
        },
      },
    });

    const result = await messageServices.getMessageAudioUrl(55);

    expect(Api.get).toHaveBeenCalledWith(EndPoints.getMessageAudioUrl(55));
    expect(result.url).toBe('https://signed.example.test/audio.m4a');
  });
});
