import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import './index.css';
import { Providers } from './app/providers';
import { App } from './app/App';

// La locale dayjs est globale : les sélecteurs de dates d'Ant Design utilisent
// leur propre import, il faut la poser avant le premier rendu.
dayjs.locale('fr');

const container = document.getElementById('root');
if (!container) throw new Error('Élément #root introuvable dans index.html');

createRoot(container).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
);
