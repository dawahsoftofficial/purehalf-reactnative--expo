import { CommonActions } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';

import { Container, Header } from '../../components';
import { Colors } from '../../res';
import {
  flashErrorMessage,
  flashSuccessMessage,
  StorageManager,
  TesterApi,
  TesterDiagnostics,
  useGlobalContext,
} from '../../services';
import { useUserStatsStore } from '../../stores';

const Button = ({
  label,
  onPress,
  danger = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}) => (
  <TouchableOpacity
    disabled={disabled}
    onPress={onPress}
    style={[
      styles.button,
      danger && styles.danger,
      disabled && styles.disabled,
    ]}
  >
    <Text style={styles.buttonText}>{label}</Text>
  </TouchableOpacity>
);

export default function TesterConsole({ navigation, route }: any) {
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const sourceScreenName = route.params?.sourceScreenName || 'Unknown';
  const screenshotUri = route.params?.screenshotUri as string | null;
  const [busy, setBusy] = useState(false);
  const [gender, setGender] = useState(currentUser?.gender || 'male');
  const [dob, setDob] = useState(currentUser?.date_of_birth || '');
  const [creditAmount, setCreditAmount] = useState('50');
  const [notes, setNotes] = useState('');
  const setUserStats = useUserStatsStore((state) => state.setUserStats);
  const userStats = useUserStatsStore();
  const calls = useMemo(
    () => TesterDiagnostics.forScreen(sourceScreenName),
    [sourceScreenName]
  );

  useEffect(() => {
    TesterApi.status().catch(() => {
      flashErrorMessage('Tester access is no longer enabled.');
      navigation.goBack();
    });
  }, [navigation]);

  const mergeUser = async (updates: any) => {
    const merged = { ...currentUser, ...updates };
    updateCurrentUser(merged);
    await StorageManager.setData(StorageManager.storageKeys.USER, merged);
  };

  const run = async (operation: () => Promise<any>, success: string) => {
    setBusy(true);
    try {
      const state = await operation();
      if (state) await mergeUser(state);
      flashSuccessMessage(success);
    } catch (error: any) {
      flashErrorMessage(
        error?.response?.data?.message || 'Tester action failed.'
      );
    } finally {
      setBusy(false);
    }
  };

  const submitNote = async () => {
    setBusy(true);
    try {
      const form = new FormData();
      form.append('screen_name', sourceScreenName);
      form.append('notes', notes);
      form.append('api_calls', JSON.stringify(calls));
      form.append(
        'device_context',
        JSON.stringify({
          platform: Platform.OS,
          platform_version: Platform.Version,
          app_version: DeviceInfo.getVersion(),
          build_number: DeviceInfo.getBuildNumber(),
          device_id: DeviceInfo.getDeviceId(),
          system_name: DeviceInfo.getSystemName(),
          system_version: DeviceInfo.getSystemVersion(),
        })
      );
      if (screenshotUri) {
        form.append('screenshot', {
          uri: screenshotUri,
          type: 'image/jpeg',
          name: `tester-${Date.now()}.jpg`,
        } as any);
      }
      await TesterApi.submitNote(form);
      setNotes('');
      flashSuccessMessage('Snapshot and tester notes sent to admin.');
    } catch (error: any) {
      flashErrorMessage(
        error?.response?.data?.message || 'Could not send tester notes.'
      );
    } finally {
      setBusy(false);
    }
  };

  const goToBeginning = async () => {
    await StorageManager.deleteData(StorageManager.storageKeys.PRIMER_SEEN);
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'SignupPrimer' }] })
    );
  };

  const playSplash = () => navigation.navigate('TesterSplash');

  const deleteSelf = () =>
    Alert.alert(
      'Permanently delete test account?',
      'This permanently removes this user and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete completely',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await TesterApi.deleteSelf();
              await StorageManager.deleteAll();
              updateCurrentUser(null);
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'AuthWelcome' }],
                })
              );
            } catch (error: any) {
              flashErrorMessage(
                error?.response?.data?.message || 'Account deletion failed.'
              );
              setBusy(false);
            }
          },
        },
      ]
    );

  const parsedCredits = Number.parseInt(creditAmount, 10);

  const resetData = (
    type: 'daily_recommendations' | 'visits_to_me' | 'liked_by_me' | 'likes_me',
    label: string
  ) =>
    Alert.alert(label, 'This clears the selected test data from both sides.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            const result = await TesterApi.resetSelfData(type);
            if (type === 'visits_to_me') {
              setUserStats(
                userStats.like_count,
                0,
                userStats.photo_request_count
              );
            } else if (type === 'likes_me') {
              setUserStats(
                0,
                userStats.visit_count,
                userStats.photo_request_count
              );
            } else if (type === 'daily_recommendations') {
              await mergeUser({
                reviewed_top_picks: null,
                recommend_api_hit_at: null,
              });
            }
            flashSuccessMessage(
              `${label}: ${result.cleared_count} record${result.cleared_count === 1 ? '' : 's'} cleared.`
            );
          } catch (error: any) {
            flashErrorMessage(
              error?.response?.data?.message || 'Could not clear tester data.'
            );
          } finally {
            setBusy(false);
          }
        },
      },
    ]);

  return (
    <Container>
      <Header navigation={navigation} title="Tester tools" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.warning}>
          <Text style={styles.warningTitle}>Protected tester console</Text>
          <Text style={styles.warningText}>
            Every server action is authorized against your live tester flag.
            Changes affect real test data.
          </Text>
        </View>

        <Text style={styles.heading}>Snapshot and debugging</Text>
        <Text style={styles.meta}>Captured screen: {sourceScreenName}</Text>
        <TextInput
          multiline
          placeholder="What happened? Expected result, steps, account state..."
          placeholderTextColor={Colors.muted}
          value={notes}
          onChangeText={setNotes}
          style={[styles.input, styles.notes]}
        />
        <Button
          label={`Send snapshot + notes (${calls.length} APIs)`}
          onPress={submitNote}
          disabled={busy}
        />
        <Button
          label="Screen info / APIs hit"
          onPress={() =>
            navigation.navigate('TesterScreenInfo', {
              screenName: sourceScreenName,
            })
          }
        />

        <Text style={styles.heading}>Account state</Text>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.row}>
          {(['male', 'female'] as const).map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.choice, gender === value && styles.choiceSelected]}
              onPress={() => setGender(value)}
            >
              <Text
                style={
                  gender === value
                    ? styles.choiceTextSelected
                    : styles.choiceText
                }
              >
                {value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Button
          label="Save gender"
          onPress={() =>
            run(() => TesterApi.updateSelf({ gender }), 'Gender updated.')
          }
          disabled={busy}
        />

        <Text style={styles.label}>Date of birth (YYYY-MM-DD)</Text>
        <TextInput
          value={dob}
          onChangeText={setDob}
          style={styles.input}
          autoCapitalize="none"
        />
        <Button
          label="Save date of birth"
          onPress={() =>
            run(
              () => TesterApi.updateSelf({ date_of_birth: dob }),
              'Date of birth updated.'
            )
          }
          disabled={busy}
        />

        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.label}>Open all profile galleries</Text>
            <Text style={styles.meta}>
              Private media remains server protected until this is enabled.
            </Text>
          </View>
          <Switch
            value={!!currentUser?.tester_can_view_private_media}
            onValueChange={(value) =>
              run(
                () =>
                  TesterApi.updateSelf({
                    tester_can_view_private_media: value,
                  }),
                'Gallery override updated.'
              )
            }
            disabled={busy}
          />
        </View>

        <Text style={styles.label}>Chat credit amount (raw credits)</Text>
        <TextInput
          value={creditAmount}
          onChangeText={setCreditAmount}
          style={styles.input}
          keyboardType="number-pad"
        />
        <View style={styles.row}>
          <View style={styles.flex}>
            <Button
              label="Add credits"
              onPress={() =>
                run(
                  () => TesterApi.adjustCredits('add', parsedCredits),
                  'Credits added.'
                )
              }
              disabled={
                busy || !Number.isInteger(parsedCredits) || parsedCredits < 1
              }
            />
          </View>
          <View style={styles.flex}>
            <Button
              label="Remove credits"
              onPress={() =>
                run(
                  () => TesterApi.adjustCredits('remove', parsedCredits),
                  'Credits removed.'
                )
              }
              disabled={
                busy || !Number.isInteger(parsedCredits) || parsedCredits < 1
              }
            />
          </View>
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.label}>VIP</Text>
          <Switch
            value={!!currentUser?.membership_status}
            onValueChange={(value) =>
              run(
                () =>
                  TesterApi.updateSelf({ membership_status: value ? 1 : 0 }),
                `VIP ${value ? 'enabled' : 'disabled'}.`
              )
            }
            disabled={busy}
          />
        </View>

        <Text style={styles.heading}>Discovery and interactions</Text>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.label}>Invisible profile visits</Text>
            <Text style={styles.meta}>
              Opening another profile will not register a visit.
            </Text>
          </View>
          <Switch
            value={!!currentUser?.tester_is_invisible}
            onValueChange={(value) =>
              run(
                () => TesterApi.updateSelf({ tester_is_invisible: value }),
                `Invisible visits ${value ? 'enabled' : 'disabled'}.`
              )
            }
            disabled={busy}
          />
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.label}>Force recommendation heart</Text>
            <Text style={styles.meta}>
              Shows the header heart and bypasses the tester time window.
            </Text>
          </View>
          <Switch
            value={!!currentUser?.tester_force_recommendations}
            onValueChange={(value) =>
              run(
                () =>
                  TesterApi.updateSelf({
                    tester_force_recommendations: value,
                  }),
                `Recommendation override ${value ? 'enabled' : 'disabled'}.`
              )
            }
            disabled={busy}
          />
        </View>
        <Button
          label="Reset daily recommendation history"
          onPress={() =>
            resetData('daily_recommendations', 'Recommendation history')
          }
          disabled={busy}
        />
        <Button
          label="Clear visits to my profile"
          onPress={() => resetData('visits_to_me', 'Visits to my profile')}
          disabled={busy}
        />
        <Button
          label="Clear profiles liked by me"
          onPress={() => resetData('liked_by_me', 'Profiles liked by me')}
          disabled={busy}
        />
        <Button
          label="Clear people who like me"
          onPress={() => resetData('likes_me', 'People who like me')}
          disabled={busy}
        />

        <Text style={styles.heading}>Navigation</Text>
        <Button
          label="All app pages / screen directory"
          onPress={() => navigation.navigate('TesterScreenDirectory')}
        />

        <Text style={styles.heading}>App flow</Text>
        <Button
          label="Go to pre-registration beginning"
          onPress={goToBeginning}
        />
        <Button label="Play splash screen" onPress={playSplash} />

        <Text style={styles.heading}>Destructive</Text>
        <Button
          label="Delete myself completely"
          onPress={deleteSelf}
          danger
          disabled={busy}
        />
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 120, gap: 10 },
  warning: {
    backgroundColor: '#FFF3CD',
    borderColor: '#E6B800',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  warningTitle: { color: '#493A00', fontWeight: '700', fontSize: 16 },
  warningText: { color: '#493A00', marginTop: 4, lineHeight: 19 },
  heading: {
    color: Colors.ink,
    fontWeight: '800',
    fontSize: 18,
    marginTop: 14,
  },
  label: { color: Colors.ink, fontWeight: '700', fontSize: 14 },
  meta: { color: Colors.muted, fontSize: 12 },
  input: {
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    color: Colors.ink,
  },
  notes: { minHeight: 100, textAlignVertical: 'top' },
  button: {
    backgroundColor: Colors.primary,
    padding: 13,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  buttonText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  danger: { backgroundColor: Colors.attention },
  disabled: { opacity: 0.45 },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  choice: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 9,
  },
  choiceSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  choiceText: { color: Colors.ink, textTransform: 'capitalize' },
  choiceTextSelected: {
    color: '#fff',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  switchCopy: { flex: 1 },
});
