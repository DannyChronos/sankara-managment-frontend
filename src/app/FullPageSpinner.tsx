import { Spin } from 'antd';

export function FullPageSpinner() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <Spin size="large" />
    </div>
  );
}
