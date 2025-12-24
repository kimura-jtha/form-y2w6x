import { createTheme } from '@mantine/core';

import type { MantineColorsTuple } from '@mantine/core';

// Custom primary color palette
const primary: MantineColorsTuple = [
  '#e6f7ff',
  '#bae7ff',
  '#91d5ff',
  '#69c0ff',
  '#40a9ff',
  '#1890ff',
  '#096dd9',
  '#0050b3',
  '#003a8c',
  '#002766',
];

export const theme = createTheme({
  // Color scheme
  primaryColor: 'primary',
  colors: {
    primary,
  },

  // Typography - Noto Sans JP with Meiryo UI fallback for Japanese text
  fontFamily:
    '"Noto Sans JP", "Meiryo UI", Meiryo, "Hiragino Kaku Gothic ProN", "Hiragino Sans", sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  headings: {
    fontFamily:
      '"Noto Sans JP", "Meiryo UI", Meiryo, "Hiragino Kaku Gothic ProN", "Hiragino Sans", sans-serif',
    fontWeight: '600',
  },

  // Radius
  defaultRadius: 'sm',
  radius: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },

  // Spacing
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },

  // Shadows
  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
  },

  // Other
  cursorType: 'pointer',
  focusRing: 'auto',

  // Component overrides
  components: {
    Button: {
      defaultProps: {
        size: 'sm',
      },
    },
    TextInput: {
      defaultProps: {
        size: 'sm',
      },
    },
    Select: {
      defaultProps: {
        size: 'sm',
      },
    },
    Modal: {
      defaultProps: {
        centered: true,
      },
    },
  },
});
