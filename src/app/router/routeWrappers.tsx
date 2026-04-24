import { Suspense, type ReactElement } from 'react';

export function withSuspense(
  element: ReactElement,
  fallback: ReactElement = <div />,
) {
  return <Suspense fallback={fallback}>{element}</Suspense>;
}
