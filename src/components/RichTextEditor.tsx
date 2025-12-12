import { useState } from 'react';

import StarterKit from '@tiptap/starter-kit';

import { Box, Button, Group, Paper, SegmentedControl, Stack, Text } from '@mantine/core';
import { RichTextEditor as MantineRTE } from '@mantine/tiptap';
import { IconDeviceFloppy, IconEye, IconPencil } from '@tabler/icons-react';
import { useEditor } from '@tiptap/react';
import { useTranslation } from 'react-i18next';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  isSaving?: boolean;
  label?: string;
}

export function RichTextEditor({
  content,
  onChange,
  onSave,
  isSaving = false,
  label,
}: RichTextEditorProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor: updatedEditor }) => {
      onChange(updatedEditor.getHTML());
    },
  });

  return (
    <Stack gap="md">
      <Group justify="space-between">
        {label && (
          <Text size="sm" fw={800} fz="xl">
            {label}
          </Text>
        )}
        <Group>
          <SegmentedControl
            value={mode}
            onChange={(value) => setMode(value as 'edit' | 'preview')}
            data={[
              {
                value: 'edit',
                label: (
                  <Group gap="xs" w="100px">
                    <IconPencil size={16} />
                    <span>{t('admin.services.editor.edit')}</span>
                  </Group>
                ),
              },
              {
                value: 'preview',
                label: (
                  <Group gap="xs" w="100px">
                    <IconEye size={16} />
                    <span>{t('admin.services.editor.preview')}</span>
                  </Group>
                ),
              },
            ]}
          />
          <Group justify="flex-end">
            <Button
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={onSave}
              loading={isSaving}
            >
              {t('common.save')}
            </Button>
          </Group>
        </Group>
      </Group>

      {mode === 'edit' ? (
        <MantineRTE editor={editor}>
          <MantineRTE.Toolbar sticky stickyOffset={60}>
            <MantineRTE.ControlsGroup>
              <MantineRTE.Bold />
              <MantineRTE.Italic />
              <MantineRTE.Underline />
              <MantineRTE.Strikethrough />
              <MantineRTE.ClearFormatting />
            </MantineRTE.ControlsGroup>

            <MantineRTE.ControlsGroup>
              <MantineRTE.H1 />
              <MantineRTE.H2 />
              <MantineRTE.H3 />
              <MantineRTE.H4 />
            </MantineRTE.ControlsGroup>

            <MantineRTE.ControlsGroup>
              <MantineRTE.Blockquote />
              <MantineRTE.Hr />
              <MantineRTE.BulletList />
              <MantineRTE.OrderedList />
            </MantineRTE.ControlsGroup>

            <MantineRTE.ControlsGroup>
              <MantineRTE.Link />
              <MantineRTE.Unlink />
            </MantineRTE.ControlsGroup>

            <MantineRTE.ControlsGroup>
              <MantineRTE.AlignLeft />
              <MantineRTE.AlignCenter />
              <MantineRTE.AlignJustify />
              <MantineRTE.AlignRight />
            </MantineRTE.ControlsGroup>

            <MantineRTE.ControlsGroup>
              <MantineRTE.Undo />
              <MantineRTE.Redo />
            </MantineRTE.ControlsGroup>
          </MantineRTE.Toolbar>

          <MantineRTE.Content
            style={{
              minHeight: '400px',
              maxHeight: '55vh',
              overflow: 'auto',
            }}
          />
        </MantineRTE>
      ) : (
        <Paper shadow="xs" p="md" withBorder>
          <Box
            style={{
              minHeight: '400px',
              maxHeight: '55vh',
              overflow: 'auto',
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </Paper>
      )}
    </Stack>
  );
}
