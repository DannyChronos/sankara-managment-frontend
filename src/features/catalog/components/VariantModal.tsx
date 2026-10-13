import { useState } from 'react';
import {
  Alert,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Segmented,
  Select,
  Tag,
  Typography,
} from 'antd';
import { MoneyInput } from '../../../shared/components';
import { COMMON_SIZES, FIRMNESS_OPTIONS } from '../labels';
import type { GenerateVariantsPayload, VariantPayload } from '../api';
import type { Firmness } from '../../../shared/api/types';

interface Props {
  open: boolean;
  pending: boolean;
  onCancel: () => void;
  onCreateOne: (payload: VariantPayload) => void;
  onGenerate: (payload: GenerateVariantsPayload) => void;
}

/**
 * Deux façons d'ajouter des déclinaisons : une à une, ou en croisant les
 * dimensions et les épaisseurs. Un matelas se décline exactement comme ça,
 * et saisir dix variantes à la main est une perte de temps.
 */
export function VariantModal({
  open,
  pending,
  onCancel,
  onCreateOne,
  onGenerate,
}: Props) {
  const [mode, setMode] = useState<'une' | 'série'>('série');
  const [single] = Form.useForm<VariantPayload>();
  const [series] = Form.useForm<{
    thicknesses: string;
    densityKgM3?: number;
    firmness?: Firmness;
    price?: number;
  }>();
  const [sizes, setSizes] = useState<{ widthCm: number; lengthCm: number }[]>(
    [],
  );

  const toggleSize = (size: { widthCm: number; lengthCm: number }) =>
    setSizes((previous) =>
      previous.some(
        (item) =>
          item.widthCm === size.widthCm && item.lengthCm === size.lengthCm,
      )
        ? previous.filter(
            (item) =>
              !(
                item.widthCm === size.widthCm && item.lengthCm === size.lengthCm
              ),
          )
        : [...previous, size],
    );

  return (
    <Modal
      open={open}
      width={620}
      title="Ajouter des variantes"
      okText={mode === 'une' ? 'Ajouter' : 'Générer'}
      cancelText="Annuler"
      // Sans dimension, le serveur refuse : autant ne pas laisser cliquer.
      okButtonProps={{
        loading: pending,
        disabled: mode === 'série' && sizes.length === 0,
      }}
      onCancel={onCancel}
      onOk={() => {
        if (mode === 'une') {
          single
            .validateFields()
            .then((values) => onCreateOne(values))
            .catch(() => undefined);
          return;
        }

        series
          .validateFields()
          .then((values) => {
            const thicknesses = values.thicknesses
              .split(/[\s,;]+/)
              .map((part) => Number(part))
              .filter((value) => Number.isInteger(value) && value > 0);

            onGenerate({
              dimensions: sizes,
              thicknesses,
              ...(values.densityKgM3
                ? { densityKgM3: values.densityKgM3 }
                : {}),
              ...(values.firmness ? { firmness: values.firmness } : {}),
              ...(values.price ? { price: values.price } : {}),
            });
          })
          .catch(() => undefined);
      }}
    >
      <Segmented
        block
        value={mode}
        onChange={(value) => setMode(value as 'une' | 'série')}
        options={[
          { value: 'série', label: 'Par série' },
          { value: 'une', label: 'Une seule' },
        ]}
        style={{ marginBottom: 16 }}
      />

      {mode === 'série' ? (
        <>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Dimensions × épaisseurs"
            description="Chaque croisement devient une variante, avec son SKU. Les combinaisons déjà existantes sont ignorées, pas dupliquées."
          />

          <Typography.Text strong>Dimensions</Typography.Text>
          <Flex gap={8} wrap style={{ margin: '8px 0 16px' }}>
            {COMMON_SIZES.map((size) => {
              const picked = sizes.some(
                (item) =>
                  item.widthCm === size.widthCm &&
                  item.lengthCm === size.lengthCm,
              );
              return (
                <Tag.CheckableTag
                  key={`${size.widthCm}x${size.lengthCm}`}
                  checked={picked}
                  onChange={() => toggleSize(size)}
                >
                  {size.widthCm}×{size.lengthCm}
                </Tag.CheckableTag>
              );
            })}
          </Flex>

          <Form form={series} layout="vertical">
            <Form.Item
              name="thicknesses"
              label="Épaisseurs (cm)"
              extra="Séparez par des virgules : 18, 22, 25"
              rules={[{ required: true, message: 'Au moins une épaisseur.' }]}
            >
              <Input placeholder="18, 22, 25" />
            </Form.Item>

            <Flex gap={12} wrap>
              <Form.Item name="densityKgM3" label="Densité (kg/m³)">
                <InputNumber min={1} max={200} style={{ width: 140 }} />
              </Form.Item>
              <Form.Item name="firmness" label="Fermeté">
                <Select
                  allowClear
                  style={{ width: 160 }}
                  options={FIRMNESS_OPTIONS}
                />
              </Form.Item>
              <Form.Item
                name="price"
                label="Prix boutique"
                extra="Appliqué à toutes les variantes générées."
              >
                <MoneyInput />
              </Form.Item>
            </Flex>
          </Form>

          {sizes.length === 0 ? (
            <Typography.Text type="danger">
              Choisissez au moins une dimension.
            </Typography.Text>
          ) : (
            <Typography.Text type="secondary">
              {sizes.length} dimension(s) sélectionnée(s).
            </Typography.Text>
          )}
        </>
      ) : (
        <Form form={single} layout="vertical">
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Le SKU et le libellé se déduisent des dimensions"
            description="Laissez-les vides sauf si vous avez une référence imposée."
          />

          <Flex gap={12} wrap>
            <Form.Item name="widthCm" label="Largeur (cm)">
              <InputNumber min={1} max={400} style={{ width: 130 }} />
            </Form.Item>
            <Form.Item name="lengthCm" label="Longueur (cm)">
              <InputNumber min={1} max={400} style={{ width: 130 }} />
            </Form.Item>
            <Form.Item name="thicknessCm" label="Épaisseur (cm)">
              <InputNumber min={1} max={100} style={{ width: 130 }} />
            </Form.Item>
          </Flex>

          <Flex gap={12} wrap>
            <Form.Item name="densityKgM3" label="Densité (kg/m³)">
              <InputNumber min={1} max={200} style={{ width: 140 }} />
            </Form.Item>
            <Form.Item name="firmness" label="Fermeté">
              <Select
                allowClear
                style={{ width: 160 }}
                options={FIRMNESS_OPTIONS}
              />
            </Form.Item>
          </Flex>

          <Form.Item name="sku" label="SKU">
            <Input placeholder="MS-ORTHO-140190-25" />
          </Form.Item>

          <Form.Item name="barcode" label="Code-barres">
            <Input maxLength={40} />
          </Form.Item>

          <Flex gap={12} wrap>
            <Form.Item name="costPrice" label="Prix de revient">
              <MoneyInput />
            </Form.Item>
            <Form.Item name="price" label="Prix boutique">
              <MoneyInput />
            </Form.Item>
          </Flex>
        </Form>
      )}
    </Modal>
  );
}
