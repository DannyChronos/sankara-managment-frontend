import { useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Input, Modal, Radio } from 'antd';
import { IfuInput } from '../../../shared/components';
import { requiredIfuRule } from '../../../shared/utils/ifu';
import { antdFieldErrors } from '../../../shared/api/errors';
import {
  taxGroupLabel,
  defaultTaxGroup,
} from '../../../shared/constants/labels';
import { useUpdateFiscalProfile } from '../hooks';
import type {
  FiscalProfile,
  UpdateFiscalProfile,
  TaxRegime,
} from '../../../shared/api/types';

const FIELDS = [
  'legalName',
  'tradeName',
  'ifu',
  'rccm',
  'fiscalAddress',
  'fiscalPhone',
  'fiscalEmail',
  'taxRegime',
  'receiptFooter',
] as const;

/**
 * Identité fiscale de l'entreprise. Ces champs s'impriment sur chaque
 * facture normalisée : une erreur ici se retrouve sur tous les documents
 * déjà émis, et la DGI compare.
 */
export function FiscalProfileForm({
  profile,
}: {
  profile: FiscalProfile | null;
}) {
  const [form] = Form.useForm<UpdateFiscalProfile>();
  const update = useUpdateFiscalProfile();
  const [pendingRegime, setPendingRegime] = useState<TaxRegime | null>(null);

  useEffect(() => {
    form.setFieldsValue({
      legalName: profile?.legalName ?? '',
      tradeName: profile?.tradeName ?? '',
      ifu: profile?.ifu ?? '',
      rccm: profile?.rccm ?? '',
      fiscalAddress: profile?.fiscalAddress ?? '',
      fiscalPhone: profile?.fiscalPhone ?? '',
      fiscalEmail: profile?.fiscalEmail ?? '',
      taxRegime: profile?.taxRegime ?? 'VAT',
      receiptFooter: profile?.receiptFooter ?? '',
    });
  }, [form, profile]);

  const save = (values: UpdateFiscalProfile, switchProducts?: boolean) => {
    // Un champ facultatif vidé doit partir absent, pas en chaîne vide : le
    // serveur refuserait un email « ».
    const payload = {
      ...Object.fromEntries(
        Object.entries(values).filter(
          ([, value]) => !(typeof value === 'string' && value.trim() === ''),
        ),
      ),
      ifu: values.ifu,
      taxRegime: values.taxRegime,
      ...(switchProducts === undefined
        ? {}
        : { switchProductTaxGroups: switchProducts }),
    } as UpdateFiscalProfile;

    update.mutate(payload, {
      onError: (error) => {
        const fields = antdFieldErrors(error, FIELDS);
        if (fields.length > 0) form.setFields(fields);
      },
    });
  };

  const submit = () => {
    void form.validateFields().then((values) => {
      // Changer de régime ne bascule pas les produits d'office : c'est une
      // décision comptable. On demande, en annonçant combien sont concernés.
      if (profile && values.taxRegime !== profile.taxRegime) {
        setPendingRegime(values.taxRegime);
        return;
      }
      save(values);
    });
  };

  const regimeChange = (switchProducts: boolean) => {
    setPendingRegime(null);
    void form.validateFields().then((values) => save(values, switchProducts));
  };

  return (
    <Card
      title="Profil fiscal"
      extra={
        <Button type="primary" loading={update.isPending} onClick={submit}>
          Enregistrer
        </Button>
      }
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Ces informations s’impriment sur chaque facture normalisée."
        description="Elles doivent correspondre exactement à celles de la DGI."
      />

      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item
          name="legalName"
          label="Raison sociale"
          rules={[
            { required: true, message: 'La raison sociale est obligatoire.' },
          ]}
        >
          <Input maxLength={160} placeholder="MATELAS SANKARA SARL" />
        </Form.Item>

        <Form.Item name="tradeName" label="Nom commercial">
          <Input maxLength={160} placeholder="Matelas Sankara" />
        </Form.Item>

        <Form.Item
          name="ifu"
          label="IFU"
          extra="Identifiant fiscal unique, 13 chiffres."
          rules={[requiredIfuRule]}
        >
          <IfuInput />
        </Form.Item>

        <Form.Item name="rccm" label="RCCM">
          <Input maxLength={60} placeholder="RB/COT/24 B 1234" />
        </Form.Item>

        <Form.Item
          name="fiscalAddress"
          label="Adresse fiscale"
          rules={[
            { required: true, message: 'L’adresse fiscale est obligatoire.' },
          ]}
        >
          <Input maxLength={255} placeholder="Cotonou, Carrefour Toyota" />
        </Form.Item>

        <Form.Item
          name="fiscalPhone"
          label="Téléphone"
          rules={[{ required: true, message: 'Le téléphone est obligatoire.' }]}
        >
          <Input maxLength={30} placeholder="+22901970000" />
        </Form.Item>

        <Form.Item
          name="fiscalEmail"
          label="Email"
          rules={[{ type: 'email', message: 'Adresse email invalide.' }]}
        >
          <Input maxLength={180} placeholder="compta@matelas-sankara.bj" />
        </Form.Item>

        <Form.Item
          name="taxRegime"
          label="Régime d’imposition"
          rules={[{ required: true }]}
        >
          <Radio.Group
            options={[
              { value: 'VAT', label: 'TVA' },
              { value: 'TPS', label: 'TPS' },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="receiptFooter"
          label="Mention de pied de ticket"
          extra="Facultative : s’imprime sous le total."
        >
          <Input maxLength={255} placeholder="Merci de votre confiance." />
        </Form.Item>
      </Form>

      <Modal
        open={pendingRegime !== null}
        title="Changer de régime d’imposition"
        onCancel={() => setPendingRegime(null)}
        footer={
          <>
            <Button onClick={() => setPendingRegime(null)}>Annuler</Button>
            <Button onClick={() => regimeChange(false)}>Ne pas basculer</Button>
            <Button type="primary" onClick={() => regimeChange(true)}>
              Basculer les produits
            </Button>
          </>
        }
      >
        {pendingRegime && (
          <p>
            Les produits actuellement au groupe{' '}
            <strong>
              {
                taxGroupLabel[
                  defaultTaxGroup[pendingRegime === 'TPS' ? 'VAT' : 'TPS']
                ]
              }
            </strong>{' '}
            doivent-ils passer au groupe{' '}
            <strong>{taxGroupLabel[defaultTaxGroup[pendingRegime]]}</strong> ?
            C’est une décision comptable : en cas de doute, ne basculez pas et
            demandez au comptable.
          </p>
        )}
      </Modal>
    </Card>
  );
}
