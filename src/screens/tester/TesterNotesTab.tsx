import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Colors } from '../../res';
import {
  flashErrorMessage,
  TesterApi,
  type TesterNoteStatus,
  type TesterNoteSummary,
} from '../../services';

const statusColors: Record<
  TesterNoteStatus,
  { background: string; text: string }
> = {
  open: { background: '#FDECEC', text: '#A12B26' },
  in_progress: { background: '#E8F2FF', text: '#215EA8' },
  resolved: { background: '#E8F7EE', text: '#237A45' },
  human_required: { background: '#FFF3CD', text: '#705800' },
  wont_fix: { background: '#EEEEF2', text: '#5E5968' },
};

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export default function TesterNotesTab({ navigation }: any) {
  const [notes, setNotes] = useState<TesterNoteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      setNotes((await TesterApi.notes()) || []);
    } catch (error: any) {
      flashErrorMessage(
        error?.response?.data?.message || 'Could not load tester notes.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>My tester notes</Text>
          <Text style={styles.subtitle}>
            Open a note to view its status, diagnostics, and reply thread.
          </Text>
        </View>
        <TouchableOpacity
          accessibilityLabel="Refresh tester notes"
          disabled={refreshing}
          onPress={() => void load(true)}
          style={styles.refreshButton}
        >
          {refreshing ? (
            <ActivityIndicator color={Colors.primary} size="small" />
          ) : (
            <Ionicons name="refresh" color={Colors.primary} size={23} />
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      ) : notes.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons
            name="document-text-outline"
            color={Colors.primaryLite}
            size={32}
          />
          <Text style={styles.emptyTitle}>No tester notes yet</Text>
          <Text style={styles.emptyText}>
            Notes submitted with the tester snapshot button will appear here.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {notes.map((note) => {
            const palette = statusColors[note.status] || statusColors.open;
            return (
              <TouchableOpacity
                key={note.id}
                accessibilityRole="button"
                onPress={() =>
                  navigation.navigate('TesterNoteDetail', { noteId: note.id })
                }
                style={styles.row}
              >
                <View style={styles.rowTop}>
                  <Text numberOfLines={1} style={styles.screenName}>
                    {note.screen_name}
                  </Text>
                  <View
                    style={[
                      styles.status,
                      { backgroundColor: palette.background },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: palette.text }]}>
                      {note.status_label}
                    </Text>
                  </View>
                </View>
                {note.notes ? (
                  <Text numberOfLines={2} style={styles.notePreview}>
                    {note.notes}
                  </Text>
                ) : null}
                <View style={styles.rowBottom}>
                  <Text style={styles.meta}>{formatDate(note.created_at)}</Text>
                  <View style={styles.commentMeta}>
                    <Ionicons
                      name="chatbubble-outline"
                      color={Colors.muted}
                      size={14}
                    />
                    <Text style={styles.meta}>{note.comment_count}</Text>
                    <Ionicons
                      name="chevron-forward"
                      color={Colors.primary}
                      size={18}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 12, paddingTop: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headerCopy: { flex: 1 },
  title: { color: Colors.ink, fontSize: 18, fontWeight: '800' },
  subtitle: { color: Colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: { paddingVertical: 50 },
  list: { gap: 10 },
  row: {
    backgroundColor: '#fff',
    borderColor: Colors.hairline,
    borderWidth: 1,
    borderRadius: 13,
    padding: 13,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  screenName: { color: Colors.ink, fontSize: 15, fontWeight: '800', flex: 1 },
  status: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '800' },
  notePreview: {
    color: Colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 7,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 9,
  },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { color: Colors.muted, fontSize: 11 },
  emptyCard: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 14,
    backgroundColor: '#fff',
    padding: 28,
  },
  emptyTitle: { color: Colors.ink, fontWeight: '800', marginTop: 8 },
  emptyText: {
    color: Colors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
