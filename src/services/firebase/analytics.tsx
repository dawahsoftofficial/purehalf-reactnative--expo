import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import { getApp } from '@react-native-firebase/app';

const firebaseApp = getApp();
const analytics = getAnalytics(firebaseApp);

const addAnaylatics = async (title: string, obj: any) => {
  console.log('analytic msg-->', 'Click on ' + title);
  // Sanitize event name: replace spaces and hyphens with underscores, keep only alphanumeric and underscores
  const sanitizedTitle = title
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase()
    .substring(0, 40); // Firebase limit is 40 characters
  await logEvent(analytics, sanitizedTitle, obj).then(() => {
    console.log('analytics added');
  });
};

export { addAnaylatics };
