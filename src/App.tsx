import { RouterProvider } from 'react-router';

import { ErrorBoundary } from '@/components';

import { Affix, Center, Text } from '@mantine/core';
import { useState } from 'react';
import router from './router';

export default function App() {
  const [hide, setHide] = useState(false);
  const isProd = window.location.hostname === 'form.jppa.jp';
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      {!isProd && !hide && (
        <Affix position={{ bottom: 0, left: 0 }}>
          <Center w="100vw" bg="red.1" p="xs" onClick={() => setHide(true)} style={{ cursor: 'pointer' }}>
            <Text c="red" fw={600}>
              NON PRODUCTION ENVIRONMENT
            </Text>
            <Text c="red" size="xs" style={{ fontStyle: 'italic' }}>
              {'  '}(Click to hide)
            </Text>
          </Center>
        </Affix>
      )}
    </ErrorBoundary>
  );
}
