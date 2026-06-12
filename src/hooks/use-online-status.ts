import { useEffect, useState } from 'react';

import { getIsOnline, subscribeOnline } from '@/api/network';

/** Reactive device connectivity, backed by the shared NetInfo listener. */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(getIsOnline);
  useEffect(() => subscribeOnline(setOnline), []);
  return online;
}
