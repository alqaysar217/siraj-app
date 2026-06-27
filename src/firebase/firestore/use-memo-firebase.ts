'use client';

import { useMemo, useRef } from 'react';
import { Query, DocumentReference } from 'firebase/firestore';

/**
 * A hook to stabilize Firebase references and queries between renders.
 */
export function useMemoFirebase<T extends Query<any> | DocumentReference<any> | null>(
  factory: () => T,
  deps: any[]
): T {
  const lastDeps = useRef<any[]>(deps);
  const lastValue = useRef<T>(null as any);

  const depsChanged = deps.some((dep, i) => dep !== lastDeps.current[i]);

  if (depsChanged || !lastValue.current) {
    lastValue.current = factory();
    lastDeps.current = deps;
  }

  return lastValue.current;
}
