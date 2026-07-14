import {
  getCrashlytics,
  log,
  recordError,
} from '@react-native-firebase/crashlytics';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RNRestart from 'react-native-restart';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Top-level crash guard. A render-time exception anywhere below this boundary
 * would otherwise unmount the whole tree and leave a permanent white screen;
 * here we catch it, report to Crashlytics, and show a recoverable fallback with
 * a restart action.
 *
 * The fallback is intentionally dependency-free (no i18n / theme / context):
 * those providers may be the very thing that threw, so the crash screen must
 * render without them. This is one of the few places raw English is correct.
 */
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Never let the reporter itself throw and re-crash the boundary.
    try {
      const crashlytics = getCrashlytics();
      log(crashlytics, `ErrorBoundary: ${info?.componentStack ?? ''}`);
      recordError(crashlytics, error);
    } catch {
      // Crashlytics unavailable — swallow; the fallback UI still renders.
      console.error('ErrorBoundary caught (crashlytics unavailable):', error);
    }
  }

  handleRestart = (): void => {
    try {
      RNRestart.Restart();
    } catch {
      // If restart is unavailable, at least clear the error so a re-render is attempted.
      this.setState({ hasError: false });
    }
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            The app hit an unexpected error. Restarting usually fixes it.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={this.handleRestart}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Restart app</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
