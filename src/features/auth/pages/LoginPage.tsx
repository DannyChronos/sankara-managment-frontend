import { Alert, Button, Card, Form, Input } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from '../hooks';
import { errorMessage } from '../../../shared/api/errors';
import { roleHomePath } from '../../../shared/constants/labels';
import type { LoginPayload } from '../../../shared/api/types';

export function LoginPage() {
  const login = useLogin();
  const navigate = useNavigate();

  const onFinish = (values: LoginPayload) => {
    login.mutate(values, {
      onSuccess: (data) => {
        void navigate(roleHomePath[data.user.roleCode], { replace: true });
      },
    });
  };

  return (
    <Card>
      <img
        src="/logo-matelas-sankara.svg"
        alt="Matelas Sankara"
        style={{
          display: 'block',
          width: '100%',
          maxWidth: 240,
          margin: '0 auto 20px',
        }}
      />

      {login.isError && (
        <Alert
          type="error"
          showIcon
          message={errorMessage(login.error)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          name="identifier"
          label="Email ou téléphone"
          rules={[
            { required: true, message: 'Saisissez votre email ou téléphone.' },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            autoComplete="username"
            placeholder="awa@matelas-sankara.bj"
            autoFocus
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Mot de passe"
          rules={[{ required: true, message: 'Saisissez votre mot de passe.' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            autoComplete="current-password"
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          block
          size="large"
          loading={login.isPending}
        >
          Se connecter
        </Button>
      </Form>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Link to="/forgot-password">Mot de passe oublié ?</Link>
      </div>
    </Card>
  );
}

export default LoginPage;
