import React from 'react';

import { Welcome } from '../screens';

// The "BottomTab" route name is load-bearing across onboarding, paywall,
// and account-closure flows (navigation.navigate('BottomTab') /
// navigation.reset({ routes: [{ name: 'BottomTab' }] })). Renaming the route
// would mean updating every one of those call sites for no behavioral gain,
// so this stays registered as "BottomTab" and simply forwards to Welcome —
// there is no more tab bar to render.
const BottomTab = (props: Record<string, unknown>) => (
  <Welcome {...(props as any)} />
);

export default BottomTab;
