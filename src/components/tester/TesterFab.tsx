import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { captureScreen } from 'react-native-view-shot';

import { navigationRef } from '../../navigation/RootNavigation';
import { useGlobalContext } from '../../services';
import { TesterDiagnostics } from '../../services/tester';

export default function TesterFab() {
  const { currentUser } = useGlobalContext();
  const [opening, setOpening] = useState(false);

  if (!currentUser?.is_tester || currentUser?.id === 'guardian') return null;

  const open = async () => {
    if (opening || !navigationRef.isReady()) return;
    setOpening(true);
    const sourceScreenName =
      navigationRef.getCurrentRoute()?.name ||
      TesterDiagnostics.getCurrentScreen();
    let screenshotUri: string | null = null;
    try {
      screenshotUri = await captureScreen({ format: 'jpg', quality: 0.8 });
    } catch {
      // Notes and diagnostics remain available if a device blocks capture.
    }
    (navigationRef as any).navigate('TesterConsole', {
      sourceScreenName,
      screenshotUri,
    });
    setOpening(false);
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Open tester tools"
      activeOpacity={0.85}
      onPress={open}
      style={styles.fab}
    >
      <MaterialCommunityIcons name="flask" color="#fff" size={25} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 92,
    zIndex: 9999,
    elevation: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D34836',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
});
