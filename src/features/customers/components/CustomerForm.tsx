import { useState } from 'react';
import { Form, Input, Modal, Radio } from 'antd';
import { IfuInput } from '../../../shared/components';
import { optionalIfuRule } from '../../../shared/utils/ifu';
import type { CustomerPayload } from '../api';
import type { Customer } from '../../../shared/api/types';

interface Props {
  /** Absent : création. Présent : modification de cette fiche. */
  customer?: Customer;
  open: boolean;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (payload: CustomerPayload) => void;
}

/**
 * Seul le nom est obligatoire : au comptoir, on n'a pas toujours plus. Le
 * téléphone, lui, est unique côté serveur — c'est la clé de reconnaissance
 * d'un client qui revient.
 */
export function CustomerForm({
  customer,
  open,
  pending,
  onCancel,
  onSubmit,
}: Props) {
  const [form] = Form.useForm<CustomerPayload>();
  // Un client entreprise porte une raison sociale et un IFU : ce sont eux qui
  // figurent sur la facture normalisée, pas le nom de la personne venue au
  // comptoir. Le type n'est pas enregistré : il n'est qu'un aiguillage de
  // saisie, l'IFU suffit à distinguer les deux.
  const [kind, setKind] = useState<'person' | 'company'>(
    customer?.ifu || customer?.companyName ? 'company' : 'person',
  );

  return (
    <Modal
      open={open}
      title={customer ? `Modifier ${customer.fullName}` : 'Nouveau client'}
      okText={customer ? 'Enregistrer' : 'Créer'}
      cancelText="Annuler"
      okButtonProps={{ loading: pending }}
      onCancel={onCancel}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            // Un champ vidé doit partir absent, pas en chaîne vide : la
            // validation du serveur refuserait un email ou un téléphone « ».
            const payload = Object.fromEntries(
              Object.entries(values).filter(
                ([, value]) => typeof value === 'string' && value.trim() !== '',
              ),
            ) as unknown as CustomerPayload;
            onSubmit(payload);
          })
          .catch(() => undefined);
      }}
      afterOpenChange={(opened) => {
        if (opened) {
          setKind(
            customer?.ifu || customer?.companyName ? 'company' : 'person',
          );
          form.setFieldsValue({
            fullName: customer?.fullName ?? '',
            companyName: customer?.companyName ?? '',
            ifu: customer?.ifu ?? '',
            phone: customer?.phone ?? '',
            email: customer?.email ?? '',
            address: customer?.address ?? '',
            city: customer?.city ?? '',
            notes: customer?.notes ?? '',
          });
        }
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item label="Type de client">
          <Radio.Group
            value={kind}
            onChange={(event) => {
              const next = event.target.value as 'person' | 'company';
              setKind(next);
              // Ant Design conserve la valeur d'un champ démonté : sans ce
              // nettoyage, repasser en « particulier » laisserait partir la
              // raison sociale et l'IFU saisis juste avant.
              if (next === 'person') {
                form.setFieldsValue({ companyName: '', ifu: '' });
              }
            }}
            options={[
              { value: 'person', label: 'Particulier' },
              { value: 'company', label: 'Entreprise' },
            ]}
          />
        </Form.Item>

        {kind === 'company' && (
          <>
            <Form.Item
              name="companyName"
              label="Raison sociale"
              extra="S’imprime sur la facture normalisée."
            >
              <Input maxLength={160} placeholder="SARL Hôtel du Lac" />
            </Form.Item>

            <Form.Item name="ifu" label="IFU" rules={[optionalIfuRule]}>
              <IfuInput />
            </Form.Item>
          </>
        )}

        <Form.Item
          name="fullName"
          label="Nom complet"
          rules={[
            { required: true, message: 'Le nom est obligatoire.' },
            { min: 2, message: 'Au moins 2 caractères.' },
          ]}
        >
          <Input maxLength={120} placeholder="Afi Kodjo" />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Téléphone"
          extra="Obligatoire pour une livraison, et seul moyen de retrouver un client au comptoir."
          rules={[
            {
              pattern: /^\+?[0-9]{8,15}$/,
              message: 'Numéro invalide (8 à 15 chiffres).',
            },
          ]}
        >
          <Input maxLength={16} placeholder="+22997000000" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[{ type: 'email', message: 'Adresse email invalide.' }]}
        >
          <Input maxLength={180} />
        </Form.Item>

        <Form.Item name="address" label="Adresse">
          <Input maxLength={255} />
        </Form.Item>

        <Form.Item name="city" label="Ville">
          <Input maxLength={80} placeholder="Cotonou" />
        </Form.Item>

        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={2} maxLength={1000} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
