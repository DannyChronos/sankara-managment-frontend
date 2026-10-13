import { Alert, App, Button, Card, Form, Input } from 'antd';
import { antdFieldErrors, errorMessage } from '../../../shared/api/errors';
import { useChangePassword } from '../hooks';

interface Fields {
  currentPassword: string;
  newPassword: string;
  confirmation: string;
}

const FIELDS = ['currentPassword', 'newPassword'] as const;

export function ChangePasswordCard() {
  const [form] = Form.useForm<Fields>();
  const { message } = App.useApp();
  const change = useChangePassword();

  return (
    <Card title="Mot de passe">
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Vos autres sessions restent ouvertes"
        description="Changer de mot de passe ne déconnecte pas les appareils déjà connectés. Si vous pensez que votre compte est compromis, demandez à un administrateur de le désactiver."
      />

      <Form<Fields>
        form={form}
        layout="vertical"
        style={{ maxWidth: 420 }}
        onFinish={(values) =>
          change.mutate(
            {
              currentPassword: values.currentPassword,
              newPassword: values.newPassword,
            },
            {
              onSuccess: () => {
                form.resetFields();
                message.success(
                  'Mot de passe modifié. Il servira à la prochaine connexion.',
                );
              },
              onError: (error) => {
                // Le serveur désigne le champ fautif quand il le peut ; sinon
                // on retombe sur un message général.
                const fields = antdFieldErrors(error, FIELDS);
                if (fields.length > 0) form.setFields(fields);
                else message.error(errorMessage(error));
              },
            },
          )
        }
      >
        <Form.Item
          name="currentPassword"
          label="Mot de passe actuel"
          rules={[
            { required: true, message: 'Saisissez votre mot de passe actuel.' },
          ]}
        >
          <Input.Password autoComplete="current-password" />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="Nouveau mot de passe"
          rules={[
            { required: true, message: 'Saisissez le nouveau mot de passe.' },
            { min: 8, message: 'Au moins 8 caractères.' },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>

        <Form.Item
          name="confirmation"
          label="Confirmation"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Confirmez le nouveau mot de passe.' },
            // Une faute de frappe sur un mot de passe ne se voit jamais :
            // c'est la seule protection avant de se verrouiller dehors.
            ({ getFieldValue }) => ({
              validator: (_, value: string) =>
                !value || getFieldValue('newPassword') === value
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error('Les deux saisies ne correspondent pas.'),
                    ),
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={change.isPending}>
          Changer le mot de passe
        </Button>
      </Form>
    </Card>
  );
}
