import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { Colors } from '../../res';
import {
  flashErrorMessage,
  flashSuccessMessage,
  TesterApi,
} from '../../services';
import type { TesterApiCall } from '../../services/tester/tester-diagnostics';

export type TesterSnapshotDraft = {
  screenName: string;
  screenshotUri: string | null;
  calls: TesterApiCall[];
  deviceContext: Record<string, string | number>;
};

type Props = {
  draft: TesterSnapshotDraft | null;
  onClose: () => void;
};

export default function TesterSnapshotModal({ draft, onClose }: Props) {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const deviceSummary = useMemo(() => {
    if (!draft) return '';
    return `${draft.deviceContext.platform || ''} ${draft.deviceContext.system_version || ''} · App ${draft.deviceContext.app_version || ''} (${draft.deviceContext.build_number || ''})`;
  }, [draft]);

  const close = () => {
    if (submitting) return;
    setNotes('');
    setShowDetails(false);
    onClose();
  };

  const submit = async () => {
    if (!draft || submitting) return;
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('screen_name', draft.screenName);
      form.append('notes', notes);
      form.append('api_calls', JSON.stringify(draft.calls));
      form.append('device_context', JSON.stringify(draft.deviceContext));
      if (draft.screenshotUri) {
        form.append('screenshot', {
          uri: draft.screenshotUri,
          type: 'image/jpeg',
          name: `tester-${Date.now()}.jpg`,
        } as any);
      }
      await TesterApi.submitNote(form);
      flashSuccessMessage('Snapshot and tester notes sent to admin.');
      setNotes('');
      setShowDetails(false);
      onClose();
    } catch (error: any) {
      flashErrorMessage(
        error?.response?.data?.message || 'Could not send tester snapshot.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={!!draft}
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>TESTER SNAPSHOT</Text>
              <Text numberOfLines={1} style={styles.title}>
                {draft?.screenName || 'Current screen'}
              </Text>
            </View>
            <TouchableOpacity
              accessibilityLabel="Close snapshot review"
              accessibilityRole="button"
              onPress={close}
              style={styles.closeButton}
            >
              <MaterialCommunityIcons
                name="close"
                size={21}
                color={Colors.ink}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {draft?.screenshotUri ? (
              <Image
                resizeMode="contain"
                source={{ uri: draft.screenshotUri }}
                style={styles.preview}
              />
            ) : (
              <View style={[styles.preview, styles.previewMissing]}>
                <MaterialCommunityIcons
                  name="image-off-outline"
                  size={34}
                  color={Colors.muted}
                />
                <Text style={styles.muted}>
                  Screenshot was blocked by this screen.
                </Text>
              </View>
            )}

            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <MaterialCommunityIcons
                  name="api"
                  size={15}
                  color={Colors.primary}
                />
                <Text style={styles.metaPillText}>
                  {draft?.calls.length || 0} API calls
                </Text>
              </View>
              <View style={styles.metaPill}>
                <MaterialCommunityIcons
                  name="cellphone"
                  size={15}
                  color={Colors.primary}
                />
                <Text numberOfLines={1} style={styles.metaPillText}>
                  {deviceSummary}
                </Text>
              </View>
            </View>

            <Text style={styles.label}>What happened?</Text>
            <TextInput
              multiline
              onChangeText={setNotes}
              placeholder="Expected result, what happened, and steps to reproduce…"
              placeholderTextColor={Colors.muted}
              style={styles.notes}
              textAlignVertical="top"
              value={notes}
            />

            <TouchableOpacity
              onPress={() => setShowDetails((value) => !value)}
              style={styles.detailsToggle}
            >
              <Text style={styles.detailsTitle}>
                Captured technical details
              </Text>
              <MaterialCommunityIcons
                name={showDetails ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={Colors.primary}
              />
            </TouchableOpacity>
            {showDetails && (
              <View style={styles.details}>
                <Text style={styles.detailHeading}>Recent API calls</Text>
                {(draft?.calls || []).length === 0 ? (
                  <Text style={styles.muted}>
                    No API calls captured for this screen.
                  </Text>
                ) : (
                  draft?.calls.slice(-12).map((call, index) => (
                    <View
                      key={`${call.timestamp}-${index}`}
                      style={styles.callRow}
                    >
                      <Text style={styles.method}>{call.method}</Text>
                      <View style={styles.callCopy}>
                        <Text numberOfLines={2} style={styles.callUrl}>
                          {call.url}
                        </Text>
                        <Text style={styles.muted}>
                          {call.status || '—'} · {call.duration_ms} ms
                        </Text>
                      </View>
                    </View>
                  ))
                )}
                <Text style={[styles.detailHeading, styles.deviceHeading]}>
                  Device context
                </Text>
                {Object.entries(draft?.deviceContext || {}).map(
                  ([key, value]) => (
                    <Text key={key} style={styles.deviceLine}>
                      {key}: {String(value)}
                    </Text>
                  )
                )}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              disabled={submitting}
              onPress={close}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={submitting}
              onPress={submit}
              style={styles.submitButton}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="send" color="#fff" size={17} />
                  <Text style={styles.submitText}>Send to admin</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Colors.blackRGBA50,
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.hairline,
    alignSelf: 'center',
    marginTop: 9,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  headerCopy: { flex: 1 },
  eyebrow: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  title: { color: Colors.ink, fontSize: 20, fontWeight: '800', marginTop: 2 },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.appBg,
  },
  content: { padding: 16, paddingBottom: 22 },
  preview: {
    width: '100%',
    height: 230,
    borderRadius: 15,
    backgroundColor: Colors.appBg,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  previewMissing: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  metaPill: {
    minWidth: 0,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.lavender,
  },
  metaPillText: {
    minWidth: 0,
    flexShrink: 1,
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  label: {
    color: Colors.ink,
    fontWeight: '800',
    marginTop: 17,
    marginBottom: 7,
  },
  notes: {
    minHeight: 105,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 13,
    padding: 12,
    color: Colors.ink,
    backgroundColor: '#fff',
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    marginTop: 4,
  },
  detailsTitle: { color: Colors.primary, fontWeight: '800' },
  details: { padding: 12, borderRadius: 12, backgroundColor: Colors.appBg },
  detailHeading: { color: Colors.ink, fontWeight: '800', marginBottom: 8 },
  deviceHeading: { marginTop: 14 },
  callRow: {
    flexDirection: 'row',
    gap: 9,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.hairline,
  },
  method: { width: 42, color: Colors.primary, fontWeight: '900', fontSize: 11 },
  callCopy: { flex: 1 },
  callUrl: { color: Colors.ink, fontSize: 12 },
  muted: { color: Colors.muted, fontSize: 11, marginTop: 2 },
  deviceLine: { color: Colors.muted, fontSize: 11, lineHeight: 17 },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    backgroundColor: Colors.surface,
  },
  cancelButton: {
    paddingHorizontal: 20,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: Colors.appBg,
  },
  cancelText: { color: Colors.ink, fontWeight: '800' },
  submitButton: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  submitText: { color: '#fff', fontWeight: '800' },
});
