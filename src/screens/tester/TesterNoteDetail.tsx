import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Container, Header } from '../../components';
import { Colors } from '../../res';
import {
  flashErrorMessage,
  flashSuccessMessage,
  TesterApi,
  type TesterNote,
  type TesterNoteStatus,
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

export default function TesterNoteDetail({ navigation, route }: any) {
  const noteId = Number(route.params?.noteId);
  const [note, setNote] = useState<TesterNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [reply, setReply] = useState('');

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        setNote(await TesterApi.note(noteId));
      } catch (error: any) {
        flashErrorMessage(
          error?.response?.data?.message || 'Could not load tester note.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [noteId]
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const sendReply = async () => {
    const body = reply.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      setNote(await TesterApi.replyToNote(noteId, body));
      setReply('');
      flashSuccessMessage('Reply sent.');
    } catch (error: any) {
      flashErrorMessage(
        error?.response?.data?.message || 'Could not send reply.'
      );
    } finally {
      setSending(false);
    }
  };

  const refreshAction = () => (
    <TouchableOpacity
      accessibilityLabel="Refresh tester note"
      disabled={refreshing}
      onPress={() => void load(true)}
      style={styles.headerRefresh}
    >
      {refreshing ? (
        <ActivityIndicator color={Colors.primary} size="small" />
      ) : (
        <Ionicons name="refresh" color={Colors.primary} size={23} />
      )}
    </TouchableOpacity>
  );

  if (loading && !note) {
    return (
      <Container>
        <Header
          navigation={navigation}
          title="Tester note"
          customConponent={refreshAction}
        />
        <ActivityIndicator color={Colors.primary} style={styles.pageLoader} />
      </Container>
    );
  }

  if (!note) {
    return (
      <Container>
        <Header
          navigation={navigation}
          title="Tester note"
          customConponent={refreshAction}
        />
        <Text style={styles.notFound}>
          This tester note could not be loaded.
        </Text>
      </Container>
    );
  }

  const palette = statusColors[note.status] || statusColors.open;

  return (
    <Container>
      <Header
        navigation={navigation}
        title={`Note #${note.id}`}
        customConponent={refreshAction}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <Text style={styles.screenName}>{note.screen_name}</Text>
            <Text style={styles.date}>{formatDate(note.created_at)}</Text>
          </View>
          <View
            style={[styles.status, { backgroundColor: palette.background }]}
          >
            <Text style={[styles.statusText, { color: palette.text }]}>
              {note.status_label}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tester notes</Text>
          <Text style={styles.bodyText}>
            {note.notes || 'No written notes.'}
          </Text>
        </View>

        {note.screenshot_url ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Screenshot</Text>
            <Image
              resizeMode="contain"
              source={{ uri: note.screenshot_url }}
              style={styles.screenshot}
            />
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Conversation ({note.comments.length})
          </Text>
          {note.comments.length === 0 ? (
            <Text style={styles.emptyThread}>
              No replies yet. Send a message to start the thread.
            </Text>
          ) : (
            <View style={styles.thread}>
              {note.comments.map((comment) => {
                const own = comment.author_type === 'tester';
                return (
                  <View
                    key={comment.id}
                    style={[
                      styles.bubble,
                      own ? styles.ownBubble : styles.replyBubble,
                    ]}
                  >
                    <View style={styles.authorRow}>
                      <Ionicons
                        name={
                          comment.author_type === 'ai'
                            ? 'sparkles-outline'
                            : comment.author_type === 'admin'
                              ? 'shield-checkmark-outline'
                              : 'person-outline'
                        }
                        color={own ? '#fff' : Colors.primary}
                        size={15}
                      />
                      <Text style={[styles.author, own && styles.ownText]}>
                        {comment.author_name}
                      </Text>
                    </View>
                    <Text style={[styles.commentBody, own && styles.ownText]}>
                      {comment.body}
                    </Text>
                    <Text style={[styles.commentDate, own && styles.ownDate]}>
                      {formatDate(comment.created_at)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
          <TextInput
            multiline
            maxLength={5000}
            onChangeText={setReply}
            placeholder="Reply to admin or AI..."
            placeholderTextColor={Colors.muted}
            style={styles.replyInput}
            value={reply}
          />
          <TouchableOpacity
            disabled={!reply.trim() || sending}
            onPress={() => void sendReply()}
            style={[
              styles.sendButton,
              (!reply.trim() || sending) && styles.disabled,
            ]}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send" color="#fff" size={17} />
                <Text style={styles.sendText}>Send reply</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            API calls ({note.api_calls.length})
          </Text>
          {note.api_calls.length === 0 ? (
            <Text style={styles.emptyThread}>No API calls captured.</Text>
          ) : (
            note.api_calls.map((call, index) => (
              <View
                key={`${call.timestamp || 'call'}-${index}`}
                style={styles.apiCall}
              >
                <View style={styles.apiCallTop}>
                  <Text style={styles.method}>{call.method || '—'}</Text>
                  <Text style={styles.apiStatus}>{call.status ?? '—'}</Text>
                  <Text style={styles.apiDuration}>
                    {call.duration_ms === undefined
                      ? '—'
                      : `${call.duration_ms} ms`}
                  </Text>
                </View>
                <Text selectable style={styles.apiUrl}>
                  {call.url || '—'}
                </Text>
                <Text style={styles.apiTime}>{call.timestamp || ''}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Device context</Text>
          <Text selectable style={styles.jsonText}>
            {JSON.stringify(note.device_context || {}, null, 2)}
          </Text>
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  headerRefresh: {
    marginLeft: 'auto',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageLoader: { flex: 1 },
  notFound: { color: Colors.muted, textAlign: 'center', padding: 30 },
  content: { padding: 16, paddingBottom: 100, gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  titleCopy: { flex: 1 },
  screenName: { color: Colors.ink, fontSize: 21, fontWeight: '900' },
  date: { color: Colors.muted, fontSize: 11, marginTop: 4 },
  status: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { fontSize: 11, fontWeight: '800' },
  card: {
    backgroundColor: '#fff',
    borderColor: Colors.hairline,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  sectionTitle: {
    color: Colors.ink,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 9,
  },
  bodyText: { color: Colors.ink, fontSize: 13, lineHeight: 20 },
  screenshot: {
    width: '100%',
    height: 420,
    backgroundColor: Colors.appBg,
    borderRadius: 10,
  },
  emptyThread: { color: Colors.muted, fontSize: 12, lineHeight: 18 },
  thread: { gap: 9 },
  bubble: { maxWidth: '91%', borderRadius: 12, padding: 11 },
  ownBubble: { backgroundColor: Colors.primary, alignSelf: 'flex-end' },
  replyBubble: { backgroundColor: Colors.appBg, alignSelf: 'flex-start' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  author: { color: Colors.primary, fontSize: 11, fontWeight: '800' },
  ownText: { color: '#fff' },
  commentBody: {
    color: Colors.ink,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  commentDate: { color: Colors.muted, fontSize: 9, marginTop: 6 },
  ownDate: { color: 'rgba(255,255,255,0.72)' },
  replyInput: {
    minHeight: 86,
    maxHeight: 180,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 10,
    color: Colors.ink,
    textAlignVertical: 'top',
    padding: 11,
    marginTop: 13,
  },
  sendButton: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 9,
  },
  sendText: { color: '#fff', fontWeight: '800' },
  disabled: { opacity: 0.45 },
  apiCall: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    paddingVertical: 9,
  },
  apiCallTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  method: { color: Colors.primary, fontSize: 11, fontWeight: '900' },
  apiStatus: { color: Colors.ink, fontSize: 11, fontWeight: '700' },
  apiDuration: { color: Colors.muted, fontSize: 10, marginLeft: 'auto' },
  apiUrl: { color: Colors.ink, fontSize: 11, marginTop: 5 },
  apiTime: { color: Colors.muted, fontSize: 9, marginTop: 4 },
  jsonText: {
    color: Colors.ink,
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
});
