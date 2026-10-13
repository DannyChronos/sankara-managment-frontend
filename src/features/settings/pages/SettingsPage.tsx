import { useState } from 'react';
import {
  Button,
  Card,
  Flex,
  Form,
  Input,
  InputNumber,
  Switch,
  Typography,
} from 'antd';
import {
  ErrorState,
  MoneyInput,
  PageHeader,
  PageSkeleton,
} from '../../../shared/components';
import { useSettings, useUpdateSettings } from '../hooks';
import { SETTINGS, type SettingDefinition } from '../labels';
import type { SettingsMap } from '../api';

export function SettingsPage() {
  const settings = useSettings();
  const update = useUpdateSettings();
  // Seules les retouches vivent ici : elles se superposent aux valeurs du
  // serveur, qui restent la référence. Rien à resynchroniser après un
  // enregistrement ou un rechargement.
  const [edits, setEdits] = useState<SettingsMap>({});

  if (settings.isPending) return <PageSkeleton />;
  if (settings.isError) {
    return (
      <ErrorState
        error={settings.error}
        onRetry={() => void settings.refetch()}
      />
    );
  }

  const saved = settings.data;
  const draft: SettingsMap = { ...saved, ...edits };
  const changed = Object.keys(edits).filter(
    (key) => JSON.stringify(edits[key]) !== JSON.stringify(saved[key]),
  );

  const set = (key: string, value: unknown) =>
    setEdits((previous) => ({ ...previous, [key]: value }));

  return (
    <>
      <PageHeader
        title="Paramètres"
        subtitle="Ces réglages changent ce que le serveur accepte, pas seulement ce que l’écran affiche."
        actions={
          <Button
            type="primary"
            disabled={changed.length === 0}
            loading={update.isPending}
            onClick={() =>
              update.mutate(
                Object.fromEntries(changed.map((key) => [key, draft[key]])),
                { onSuccess: () => setEdits({}) },
              )
            }
          >
            Enregistrer {changed.length > 0 ? `(${changed.length})` : ''}
          </Button>
        }
      />

      <Flex vertical gap={16}>
        {SETTINGS.map((group) => (
          <Card key={group.group} title={group.group}>
            <Form layout="vertical" style={{ maxWidth: 560 }}>
              {group.items.map((item) => (
                <Form.Item
                  key={item.key}
                  label={item.label}
                  extra={item.hint}
                  validateStatus={
                    changed.includes(item.key) ? 'warning' : undefined
                  }
                >
                  <SettingField
                    definition={item}
                    value={draft[item.key]}
                    onChange={(value) => set(item.key, value)}
                  />
                </Form.Item>
              ))}
            </Form>
          </Card>
        ))}
      </Flex>

      {changed.length > 0 && (
        <Typography.Paragraph type="warning" style={{ marginTop: 16 }}>
          {changed.length} modification(s) non enregistrée(s).
        </Typography.Paragraph>
      )}
    </>
  );
}

function SettingField({
  definition,
  value,
  onChange,
}: {
  definition: SettingDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (definition.kind) {
    case 'boolean':
      return (
        <Switch
          checked={value === true}
          aria-label={definition.label}
          onChange={onChange}
        />
      );
    case 'money':
      return (
        <MoneyInput
          value={typeof value === 'number' ? value : 0}
          min={definition.min ?? 0}
          onChange={(next) => onChange(next ?? 0)}
        />
      );
    case 'time':
      return (
        <Input
          style={{ maxWidth: 160 }}
          placeholder="23:00"
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    default:
      return (
        <InputNumber
          style={{ width: 160 }}
          min={definition.min}
          max={definition.max}
          precision={0}
          addonAfter={definition.kind === 'percent' ? '%' : undefined}
          value={typeof value === 'number' ? value : 0}
          onChange={(next) => onChange(next ?? 0)}
        />
      );
  }
}

export default SettingsPage;
