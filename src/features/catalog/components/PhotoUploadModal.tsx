import { useEffect, useRef, useState } from 'react';
import { Alert, Form, Input, Modal, Select, Typography, Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { ALLOWED_IMAGE_MIME, MAX_IMAGE_BYTES, MAX_IMAGE_MB } from '../labels';
import type { ProductImagePayload } from '../api';
import type { ProductVariantView } from '../../../shared/api/types';

/** Une vignette de 300 octets ne doit pas s'afficher « 0 Ko ». */
function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} octets`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

interface Picked {
  file: File;
  preview: string;
}

interface Props {
  open: boolean;
  pending: boolean;
  variants: ProductVariantView[];
  onCancel: () => void;
  onSubmit: (payload: ProductImagePayload) => void;
}

/**
 * Le texte alternatif et la variante ne se modifient pas après coup : le
 * serveur n'expose que l'ajout et la suppression. On les demande donc ici,
 * au moment où la photo est choisie.
 */
export function PhotoUploadModal({
  open,
  pending,
  variants,
  onCancel,
  onSubmit,
}: Props) {
  const [form] = Form.useForm<{ alt?: string; variantId?: string }>();
  const [picked, setPicked] = useState<Picked | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);

  // L'URL d'objet immobilise le fichier tant qu'on ne la libère pas ; la
  // référence sert à retrouver la dernière en quittant la modale.
  const pickedRef = useRef<Picked | null>(null);
  useEffect(
    () => () => {
      if (pickedRef.current) URL.revokeObjectURL(pickedRef.current.preview);
    },
    [],
  );

  const accept = (candidate: File) => {
    if (!ALLOWED_IMAGE_MIME.includes(candidate.type)) {
      setRefusal('Formats acceptés : JPEG, PNG, WebP ou AVIF.');
      return;
    }
    if (candidate.size > MAX_IMAGE_BYTES) {
      setRefusal(`La photo dépasse ${MAX_IMAGE_MB} Mo.`);
      return;
    }

    if (pickedRef.current) URL.revokeObjectURL(pickedRef.current.preview);
    const next = {
      file: candidate,
      preview: URL.createObjectURL(candidate),
    };
    pickedRef.current = next;
    setRefusal(null);
    setPicked(next);
  };

  return (
    <Modal
      open={open}
      width={520}
      title="Ajouter une photo"
      okText="Envoyer"
      cancelText="Annuler"
      okButtonProps={{ loading: pending, disabled: !picked }}
      onCancel={onCancel}
      onOk={() => {
        if (!picked) return;
        const { alt, variantId } = form.getFieldsValue();
        onSubmit({
          file: picked.file,
          ...(alt ? { alt } : {}),
          ...(variantId ? { variantId } : {}),
        });
      }}
    >
      <Upload.Dragger
        accept={ALLOWED_IMAGE_MIME.join(',')}
        multiple={false}
        showUploadList={false}
        // L'envoi passe par la mutation, pas par le composant.
        beforeUpload={(candidate) => {
          accept(candidate);
          return false;
        }}
        style={{ marginBottom: 16 }}
      >
        {picked ? (
          <img
            src={picked.preview}
            alt="Aperçu"
            style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 8 }}
          />
        ) : (
          <>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Déposez une photo ou cliquez pour la choisir
            </p>
            <p className="ant-upload-hint">
              JPEG, PNG, WebP ou AVIF — {MAX_IMAGE_MB} Mo au plus.
            </p>
          </>
        )}
      </Upload.Dragger>

      {picked && (
        <Typography.Paragraph type="secondary">
          {picked.file.name} — {fileSize(picked.file.size)}
        </Typography.Paragraph>
      )}

      {refusal && (
        <Alert
          type="error"
          showIcon
          message={refusal}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="alt"
          label="Texte alternatif"
          extra="Décrit la photo pour la boutique en ligne et les lecteurs d’écran."
        >
          <Input maxLength={160} placeholder="Matelas vu de trois quarts" />
        </Form.Item>

        <Form.Item
          name="variantId"
          label="Variante concernée"
          extra="Laissez vide si la photo vaut pour tout le produit."
        >
          <Select
            allowClear
            placeholder="Tout le produit"
            options={variants.map((variant) => ({
              value: variant.id,
              label: `${variant.sku} — ${variant.name}`,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
