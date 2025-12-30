import {
  type FlashMessageProps,
  showMessage,
} from 'react-native-flash-message';

import { hp, Typography } from '../../global';
import { Colors, Fonts } from '../../res';
import { isIOS } from '../../services';
interface FlashMsgProps extends FlashMessageProps {
  top?: number;
}
const FlashMessageFun = (props: FlashMsgProps) => {
  return showMessage({
    message: '',
    type: 'info',
    duration: 3000,
    style: { paddingTop: isIOS ? 0 : hp(props?.top || 2) },
    titleStyle: {
      color: Colors.color2,
      includeFontPadding: false,
      fontSize: Typography.small,
      fontFamily: Fonts.APPFONT_SB,
    },
    hideStatusBar: false,
    icon: props?.type || 'none',
    ...props,
  });
};

export default FlashMessageFun;
