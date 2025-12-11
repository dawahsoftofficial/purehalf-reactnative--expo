import { isIOS } from '../services';
import { wp } from './Scalling';
const Constants = {
  fontFamilyMarginBottom: !isIOS ? wp(-1) : 0,
  btnActiveOpacity: 0.8,
  FCM_AUTH_TOKEN: '',
};
export default Constants;
