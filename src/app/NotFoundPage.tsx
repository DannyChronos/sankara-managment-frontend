import { Button, Result } from 'antd';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <Result
      status="404"
      title="Page introuvable"
      subTitle="Cette adresse ne correspond à aucun écran."
      extra={
        <Link to="/">
          <Button type="primary">Retour à l’accueil</Button>
        </Link>
      }
    />
  );
}
