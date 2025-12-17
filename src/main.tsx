import { StrictMode } from 'react';

import { MantineProvider } from '@mantine/core';
import { createRoot } from 'react-dom/client';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/tiptap/styles.css';
import App from './App';
import './i18n';
import { theme } from './theme';

const rootElement = document.querySelector('#root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <MantineProvider theme={theme} forceColorScheme="light">
      <App />
    </MantineProvider>
  </StrictMode>,
);
