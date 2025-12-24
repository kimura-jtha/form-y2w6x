import { RouterProvider } from 'react-router';

import { ErrorBoundary } from '@/components';

import router from './router';

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
