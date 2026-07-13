import React, { useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { captureScreen } from 'react-native-view-shot';

import { navigationRef } from '../../navigation/RootNavigation';
import { useGlobalContext } from '../../services';
import { TesterDiagnostics } from '../../services/tester';
import type { TesterSnapshotDraft } from './TesterSnapshotModal';
import TesterSnapshotModal from './TesterSnapshotModal';

export default function TesterFab() {
  const { currentUser } = useGlobalContext();
  const [capturing, setCapturing] = useState(false);
  const [draft, setDraft] = useState<TesterSnapshotDraft | null>(null);

  if (
    currentUser?.tester_mode_enabled !== true ||
    !currentUser?.is_tester ||
    currentUser?.id === 'guardian'
  )
    return null;

  const capture = async () => {
    if (capturing || !navigationRef.isReady()) return;
    setCapturing(true);
    const sourceScreenName =
      navigationRef.getCurrentRoute()?.name ||
      TesterDiagnostics.getCurrentScreen();
    let screenshotUri: string | null = null;
    try {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 80));
      screenshotUri = await captureScreen({ format: 'jpg', quality: 0.8 });
    } catch {
      // The review modal still allows notes when a secure screen blocks capture.
    }
    setDraft({
      screenName: sourceScreenName,
      screenshotUri,
      calls: TesterDiagnostics.forScreen(sourceScreenName),
      deviceContext: {
        platform: Platform.OS,
        platform_version: String(Platform.Version),
        app_version: DeviceInfo.getVersion(),
        build_number: DeviceInfo.getBuildNumber(),
        device_id: DeviceInfo.getDeviceId(),
        system_name: DeviceInfo.getSystemName(),
        system_version: DeviceInfo.getSystemVersion(),
      },
    });
    setCapturing(false);
  };

  const openTools = () => {
    if (!navigationRef.isReady()) return;
    (navigationRef as any).navigate('TesterConsole');
  };

  return (
    <>
      <View style={[styles.rail, capturing && styles.hidden]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Capture tester snapshot"
          activeOpacity={0.85}
          onPress={capture}
          style={[styles.iconButton, styles.captureButton]}
        >
          <MaterialCommunityIcons name="camera-plus" color="#fff" size={18} />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open tester tools"
          activeOpacity={0.85}
          onPress={openTools}
          style={[styles.iconButton, styles.toolsButton]}
        >
          <MaterialCommunityIcons name="flask-outline" color="#fff" size={17} />
        </TouchableOpacity>
      </View>
      <TesterSnapshotModal draft={draft} onClose={() => setDraft(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  rail: {
    position: 'absolute',
    right: 10,
    bottom: 88,
    zIndex: 9999,
    elevation: 20,
    gap: 7,
  },
  hidden: { opacity: 0 },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  captureButton: { backgroundColor: '#D34836' },
  toolsButton: { backgroundColor: '#4B2E83' },
});
