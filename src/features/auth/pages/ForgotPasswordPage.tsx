import { useState } from 'react';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { LockOutlined, NumberOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useForgotPassword, useResetPassword } from '../hooks';
import { errorMessage } from '../../../shared/api/errors';

/**
 * Le serveur envoie un code à 6 chiffres, pas un lien cliquable : les deux
 * étapes tiennent donc dans la même page, et l'identifiant saisi à la
 * première est repris à la seconde — le redemander serait un piège, puisque
 * le serveur en a besoin pour vérifier le code.
 */
export function ForgotPasswordPage() {
  const [step, setStep] = useState<'demande' | 'code'>('demande');
  const [identifier, setIdentifier] = useState('');
  const [done, setDone] = useState(false);

  const navigate = useNavigate();
  const request = useForgotPassword();
  const reset = useResetPassword();

  if (done) {
    return (
      <Card>
        <Alert
          type="success"
          showIcon
          message="Mot de passe réinitialisé"
          description="Vous pouvez maintenant vous connecter. Les autres appareils déjà connectés à ce compte ont été déconnectés."
          style={{ marginBottom: 16 }}
        />
        <Button
          type="primary"
          block
          size="large"
          onClick={() => void navigate('/login', { replace: true })}
        >
          Aller à la connexion
        </Button>
      </Card>
    );
  }

  if (step === 'demande') {
    return (
      <Card title="Mot de passe oublié">
        {request.isError && (
          <Alert
            type="error"
            showIcon
            message={errorMessage(request.error)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Typography.Paragraph type="secondary">
          Saisissez l’email ou le téléphone de votre compte. Si un compte y
          correspond, un code à 6 chiffres vous y est envoyé.
        </Typography.Paragraph>

        <Form
          layout="vertical"
          requiredMark={false}
          onFinish={({ identifier: value }: { identifier: string }) =>
            request.mutate(value, {
              onSuccess: () => {
                setIdentifier(value);
                setStep('code');
              },
            })
          }
        >
          <Form.Item
            name="identifier"
            label="Email ou téléphone"
            initialValue={identifier}
            rules={[
              {
                required: true,
                message: 'Saisissez votre email ou téléphone.',
              },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              autoComplete="username"
              placeholder="awa@matelas-sankara.bj"
              autoFocus
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={request.isPending}
          >
            Envoyer le code
          </Button>
        </Form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Button type="link" onClick={() => setStep('code')}>
            J’ai déjà un code
          </Button>
          <br />
          <Link to="/login">Retour à la connexion</Link>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Nouveau mot de passe">
      {reset.isError && (
        <Alert
          type="error"
          showIcon
          message={errorMessage(reset.error)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Typography.Paragraph type="secondary">
        {identifier
          ? `Code envoyé à ${identifier}. Il est valable 15 minutes.`
          : 'Saisissez l’identifiant de votre compte et le code reçu.'}
      </Typography.Paragraph>

      <Form
        layout="vertical"
        requiredMark={false}
        // `confirmation` ne sert qu'ici : le serveur refuse les champs qu'il
        // ne connaît pas, il ne doit donc pas partir avec le reste.
        onFinish={({
          confirmation: _confirmation,
          ...values
        }: {
          identifier: string;
          code: string;
          password: string;
          confirmation: string;
        }) =>
          reset.mutate(values, {
            onSuccess: () => setDone(true),
          })
        }
      >
        <Form.Item
          name="identifier"
          label="Email ou téléphone"
          initialValue={identifier}
          rules={[
            { required: true, message: 'Saisissez votre email ou téléphone.' },
          ]}
        >
          <Input prefix={<UserOutlined />} autoComplete="username" />
        </Form.Item>

        <Form.Item
          name="code"
          label="Code reçu"
          rules={[
            { required: true, message: 'Saisissez le code reçu.' },
            { pattern: /^\d{6}$/, message: 'Le code comporte 6 chiffres.' },
          ]}
        >
          <Input
            prefix={<NumberOutlined />}
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            autoFocus
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Nouveau mot de passe"
          rules={[
            { required: true, message: 'Saisissez un mot de passe.' },
            { min: 8, message: 'Au moins 8 caractères.' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item
          name="confirmation"
          label="Confirmer le mot de passe"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Confirmez le mot de passe.' },
            // Une faute de frappe sur un mot de passe qu'on ne voit pas
            // enfermerait l'utilisateur dehors.
            ({ getFieldValue }) => ({
              validator: (_, value) =>
                !value || value === getFieldValue('password')
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error('Les deux mots de passe diffèrent.'),
                    ),
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            autoComplete="new-password"
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          block
          size="large"
          loading={reset.isPending}
        >
          Réinitialiser
        </Button>
      </Form>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Button type="link" onClick={() => setStep('demande')}>
          Renvoyer un code
        </Button>
      </div>
    </Card>
  );
}

export default ForgotPasswordPage;
