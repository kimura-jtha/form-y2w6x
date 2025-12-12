import { Center, Loader, Stack, Text } from '@mantine/core';

interface LoadingFallbackProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingFallback({ message, fullScreen = false }: LoadingFallbackProps) {
  const content = (
    <Stack align="center" gap="sm">
      <Loader size="md" />
      {message && (
        <Text size="sm" c="dimmed">
          {message}
        </Text>
      )}
    </Stack>
  );

  if (fullScreen) {
    return (
      <Center
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'var(--mantine-color-body)',
          zIndex: 9999,
        }}
      >
        {content}
      </Center>
    );
  }

  return (
    <Center py="xl" mih={200}>
      {content}
    </Center>
  );
}
