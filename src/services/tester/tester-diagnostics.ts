export type TesterApiCall = {
  method: string;
  url: string;
  status?: number;
  duration_ms: number;
  timestamp: string;
  screen_name: string;
};

const MAX_CALLS = 100;
let currentScreen = 'Unknown';
let calls: TesterApiCall[] = [];

export const TesterDiagnostics = {
  setCurrentScreen(name?: string) {
    currentScreen = name || 'Unknown';
  },
  getCurrentScreen() {
    return currentScreen;
  },
  record(call: Omit<TesterApiCall, 'screen_name'>) {
    calls = [...calls, { ...call, screen_name: currentScreen }].slice(
      -MAX_CALLS
    );
  },
  forScreen(screenName: string) {
    return calls.filter((call) => call.screen_name === screenName).slice(-50);
  },
  recent() {
    return calls.slice(-50);
  },
  clear() {
    calls = [];
  },
};
