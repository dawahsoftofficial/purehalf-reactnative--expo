import { showMessage } from 'react-native-flash-message';

import { hp, Typography } from '../../global';
import { Colors, Fonts } from '../../res';
import { isIOS } from '../../services';

const FlashMessageFun = (props: any) => {
  // type => "success" (green), "warning" (orange), "danger" (red), "info" (blue) and "default" (gray).

  return showMessage({
    message: '',
    type: 'info',
    duration: 3000,
    style: { paddingTop: isIOS ? 0 : hp(props?.top || 2) },
    titleStyle: {
      fontSize: Typography.small3,
      color: Colors.color2,
      fontFamily: Fonts.APPFONT_B,
    },
    hideStatusBar: false,
    icon: props?.type || 'none',
    ...props,
  });
};

export default FlashMessageFun;
