import { useState } from 'react';
import { App, Button } from 'antd';
import { FilePdfOutlined, PrinterOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import { http } from '../api/http';
import { errorMessage } from '../api/errors';

interface Props {
  /** Chemin relatif à l'API, par exemple `/sales/:id/receipt`. */
  path: string;
  fileName: string;
  children: ReactNode;
  /** Ouvre la fenêtre d'impression au lieu de télécharger. */
  print?: boolean;
  type?: 'default' | 'primary';
}

/**
 * Les PDF sont générés par l'API et protégés par le jeton : on ne peut pas les
 * ouvrir dans un simple lien. Le fichier est récupéré en blob, puis téléchargé
 * ou envoyé à l'impression.
 */
export function PdfButton({ path, fileName, children, print, type }: Props) {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const fetchPdf = async () => {
    setLoading(true);
    try {
      const response = await http.get<Blob>(path, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);

      if (print) {
        printInHiddenFrame(url);
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        // Le navigateur a le temps de démarrer le téléchargement.
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
    } catch (error) {
      message.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type={type}
      icon={print ? <PrinterOutlined /> : <FilePdfOutlined />}
      loading={loading}
      onClick={() => void fetchPdf()}
    >
      {children}
    </Button>
  );
}

/** Impression sans ouvrir d'onglet : le ticket part sur l'imprimante 80 mm. */
function printInHiddenFrame(url: string): void {
  const frame = document.createElement('iframe');
  frame.style.display = 'none';
  frame.src = url;
  frame.onload = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
  };
  document.body.appendChild(frame);
}
