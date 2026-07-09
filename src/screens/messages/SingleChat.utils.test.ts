import {
  getLastSeenMessageIndex,
  getMessageParticipantStatus,
  isLastMessageReadByParticipant,
} from './SingleChat.utils';

describe('SingleChat utils read receipts', () => {
  it('finds the last seen outgoing message when participant ids use different primitive types', () => {
    const messages = [
      {
        id: 10,
        sender_id: 5,
        created_at: '2026-07-09 10:00:00',
        statuses: [{ participant_id: 7, read_at: '2026-07-09 10:01:00' }],
      },
      {
        id: 11,
        sender_id: 5,
        created_at: '2026-07-09 10:02:00',
        statuses: [{ participant_id: 7, read_at: null }],
      },
    ];

    expect(getLastSeenMessageIndex(messages, '5', '7')).toBe(0);
  });

  it('returns participant status when ids are equivalent but not the same type', () => {
    const message = {
      statuses: [
        {
          participant_id: 7,
          delivered_at: '2026-07-09 10:00:30',
          read_at: '2026-07-09 10:01:00',
        },
      ],
    };

    expect(getMessageParticipantStatus(message, '7')?.read_at).toBe(
      '2026-07-09 10:01:00'
    );
  });

  it('keeps list-screen seen ticks when either read cursor or status shows the last message was read', () => {
    const lastMessage = {
      id: 20,
      sender_id: 5,
      statuses: [{ participant_id: 7, read_at: '2026-07-09 10:01:00' }],
    };

    expect(isLastMessageReadByParticipant(lastMessage, { id: '7' }, '5')).toBe(
      true
    );
    expect(
      isLastMessageReadByParticipant(
        { ...lastMessage, statuses: [] },
        { id: 7, last_read_message_id: '20' },
        5
      )
    ).toBe(true);
  });
});
