import { Suspense } from 'react';

import { Outlet } from 'react-router';

import { Box, Center, Paper } from '@mantine/core';

import { LoadingFallback } from '@/components/LoadingFallback';

export function AuthLayout() {
  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--mantine-color-gray-0)',
      }}
    >
      <Center>
        <Paper shadow="md" p="xl" radius="md" w={400}>
          <Suspense fallback={<LoadingFallback />}>
            <Outlet />
          </Suspense>
        </Paper>
      </Center>
    </Box>
  );
}
