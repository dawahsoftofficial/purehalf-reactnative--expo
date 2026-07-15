import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import React from 'react';

import TesterNotesTab from './TesterNotesTab';

const mockNotes = jest.fn();

jest.mock('@react-navigation/native', () => {
  const ReactActual = jest.requireActual('react') as typeof React;

  return {
    useFocusEffect: (callback: () => void) =>
      ReactActual.useEffect(callback, [callback]),
  };
});

jest.mock('../../services', () => ({
  flashErrorMessage: jest.fn(),
  TesterApi: {
    notes: (...args: unknown[]) => mockNotes(...args),
  },
}));

const note = (
  id: number,
  status: 'open' | 'in_progress' | 'resolved',
  statusLabel: string,
  notes: string
) => ({
  id,
  screen_name: `Screen ${id}`,
  notes,
  status,
  status_label: statusLabel,
  comment_count: 0,
  has_screenshot: false,
  created_at: '2026-07-15T10:00:00Z',
  updated_at: '2026-07-15T10:00:00Z',
});

describe('TesterNotesTab', () => {
  beforeEach(() => {
    mockNotes
      .mockReset()
      .mockResolvedValue([
        note(1, 'open', 'Open', 'Open task'),
        note(2, 'in_progress', 'In progress', 'Active task'),
        note(3, 'resolved', 'Resolved', 'Resolved task'),
      ]);
  });

  it('shows status counts and filters tester notes', async () => {
    render(<TesterNotesTab navigation={{ navigate: jest.fn() }} />);

    await waitFor(() => {
      expect(screen.getByText('Open task')).toBeTruthy();
    });

    expect(screen.getByLabelText('All, 3 notes')).toBeTruthy();
    expect(screen.getByLabelText('Open, 1 note')).toBeTruthy();
    expect(screen.getByLabelText('Resolved, 1 note')).toBeTruthy();

    fireEvent.press(screen.getByTestId('tester-note-status-resolved'));

    expect(screen.getByText('Resolved task')).toBeTruthy();
    expect(screen.queryByText('Open task')).toBeNull();
    expect(screen.queryByText('Active task')).toBeNull();
  });

  it('shows a helpful empty state for a status without notes', async () => {
    render(<TesterNotesTab navigation={{ navigate: jest.fn() }} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Needs review, 0 notes')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('tester-note-status-human_required'));

    expect(screen.getByText('No notes with this status')).toBeTruthy();
    expect(
      screen.getByText(
        'Choose another status tab to see your other tester notes.'
      )
    ).toBeTruthy();
  });
});
