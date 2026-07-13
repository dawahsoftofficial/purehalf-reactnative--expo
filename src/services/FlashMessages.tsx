import { t } from 'i18next';

import { FlashMessage } from '../components';
import { LanguageKeys } from '../languages';

const flashErrorMessage = (message = LanguageKeys.commonErrorMessage) => {
  return FlashMessage({
    type: 'danger',
    message: t(message),
  });
};

const flashSuccessMessage = (message = LanguageKeys.dataUpdateSuccess) => {
  return FlashMessage({
    type: 'success',
    message: t(message),
  });
};

const flashInfoMessage = (message = '') => {
  return FlashMessage({
    type: 'default',
    message: t(message),
  });
};

export { flashErrorMessage, flashInfoMessage, flashSuccessMessage };
