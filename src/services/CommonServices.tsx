import moment from 'moment';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

const checkEmpty = (value: any) => {
  if (typeof value === 'string') {
    return value.replace(/\s/g, '').length === 0 ? true : false;
  } else if (value && typeof value === 'object') {
    return Object.keys(value)?.length === 0 ? true : false;
  }
};

const emailValidation = (email: any) => {
  return String(email)
    ?.toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

const formatDate = (date: any) => {
  const inputDate = moment(date);
  const today = moment();

  const yesterday = moment().subtract(1, 'day');
  const thisWeek = moment().startOf('week');

  if (inputDate.isSame(today, 'day')) {
    return inputDate.format('h:mm A');
  } else if (inputDate.isSame(yesterday, 'day')) {
    return 'Yesterday';
  } else if (inputDate.isAfter(thisWeek)) {
    return inputDate.format('dddd');
  } else {
    return inputDate.format('DD MMM, YYYY');
  }
};

// first letter capitalize
const capitalize = (str: string) =>
  str?.charAt(0)?.toUpperCase() + str?.slice(1);

const setRevenueCat = (userID = null) => {
  try {
    const userIDString = JSON.stringify(userID) || null;
    if (userIDString) {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      if (Platform.OS === 'ios') {
        Purchases.configure({
          apiKey: 'appl_QVhBMyOFJKhfsiWaYPwcpMFLXQW',
          appUserID: userIDString,
        });
      } else if (Platform.OS === 'android') {
        Purchases.configure({
          apiKey: 'goog_bNKRQVnCPRZBhpImNqqFhIubskO',
          appUserID: userIDString,
        });
      }
    }
  } catch {
    // Silently handle errors
  }
};

const getTimeStamp = async (): Promise<number> => {
  // Always use device time for sending messages to avoid delay
  return Date.now();
};

const LOG = (data: any) => {
  console.log(JSON.stringify(data, null, 2));
};

const isIOS = Platform.OS === 'ios';

export {
  capitalize,
  checkEmpty,
  emailValidation,
  formatDate,
  getTimeStamp,
  isIOS,
  LOG,
  setRevenueCat,
};
