import { getAnalytics, logEvent } from '@react-native-firebase/analytics';
import { getApp } from '@react-native-firebase/app';

const firebaseApp = getApp();
const analytics = getAnalytics(firebaseApp);

const addAnaylatics = async (title: string, obj: any) => {
  console.log('analytic msg-->', 'Click on ' + title);
  await logEvent(analytics, title.replace('-', ''), obj).then(() => {
    console.log('analytics added');
  });
};

export { addAnaylatics };
