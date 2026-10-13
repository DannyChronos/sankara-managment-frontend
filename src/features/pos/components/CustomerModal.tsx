import { useState } from 'react';
import { App, Button, Flex, Input, List, Modal, Typography } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { posApi } from '../api';
import { useCustomerSearch } from '../hooks';
import { errorMessage } from '../../../shared/api/errors';
import type { Customer } from '../../../shared/api/types';

interface Props {
  open: boolean;
  onCancel: () => void;
  onPick: (customer: Customer | null) => void;
}

/** Choix du client au comptoir : recherche par téléphone, création à la volée. */
export function CustomerModal({ open, onCancel, onPick }: Props) {
  const { message } = App.useApp();
  const [term, setTerm] = useState('');
  const [fullName, setFullName] = useState('');
  const { data, isFetching } = useCustomerSearch(term);

  const create = useMutation({
    mutationFn: () =>
      posApi.createCustomer({
        fullName,
        ...(/^\+?[0-9]{8,15}$/.test(term.trim()) ? { phone: term.trim() } : {}),
      }),
    onSuccess: (customer) => {
      setFullName('');
      onPick(customer);
    },
    onError: (error) => message.error(errorMessage(error)),
  });

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title="Client"
      footer={<Button onClick={() => onPick(null)}>Vente sans client</Button>}
      destroyOnHidden
    >
      <Input.Search
        autoFocus
        placeholder="Nom ou téléphone"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        loading={isFetching}
      />

      <List
        style={{ marginTop: 12 }}
        dataSource={data?.data ?? []}
        locale={{
          emptyText:
            term.length >= 2
              ? 'Aucun client trouvé'
              : 'Saisissez au moins 2 caractères',
        }}
        renderItem={(customer) => (
          <List.Item
            style={{ cursor: 'pointer' }}
            onClick={() => onPick(customer)}
          >
            <List.Item.Meta
              title={customer.fullName}
              description={customer.phone ?? customer.email ?? ''}
            />
          </List.Item>
        )}
      />

      {term.length >= 2 && (data?.data.length ?? 0) === 0 && (
        <Flex gap={8} style={{ marginTop: 12 }}>
          <Input
            placeholder="Nom du nouveau client"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
          <Button
            type="primary"
            disabled={fullName.trim().length < 2}
            loading={create.isPending}
            onClick={() => create.mutate()}
          >
            Créer
          </Button>
        </Flex>
      )}

      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        La fiche client est facultative en boutique, obligatoire pour une
        livraison.
      </Typography.Text>
    </Modal>
  );
}
