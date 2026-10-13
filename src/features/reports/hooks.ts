import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { App } from 'antd';
import { errorMessage } from '../../shared/api/errors';
import { reportsApi, type ReportFilters } from './api';
import type {
  ExportFormat,
  ExportRecord,
  ReportType,
} from '../../shared/api/types';

export function useReport(type: ReportType, filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', type, filters],
    queryFn: () => reportsApi.build(type, filters),
    // Un rapport est une photo : on la refait sur demande, pas en arrière-plan.
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Un export est généré en file d'attente (F-35) : on demande, puis on
 * interroge l'état jusqu'à ce que le fichier soit prêt. Quelques milliers de
 * lignes ne tiennent pas dans une requête HTTP.
 */
export function useExport(type: ReportType) {
  const { message, notification } = App.useApp();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [format, setFormat] = useState<ExportFormat | null>(null);

  const request = useMutation({
    mutationFn: ({
      format: wanted,
      filters,
    }: {
      format: ExportFormat;
      filters: ReportFilters;
    }) => reportsApi.requestExport(type, wanted, filters),
    onSuccess: (record) => {
      setFormat(record.format);
      setPendingId(record.id);
      message.loading({
        key: record.id,
        content: 'Export en préparation…',
        duration: 0,
      });
    },
    onError: (error) => message.error(errorMessage(error)),
  });

  const status = useQuery({
    queryKey: ['reports', 'exports', pendingId],
    queryFn: () => reportsApi.exportStatus(pendingId as string),
    enabled: Boolean(pendingId),
    refetchInterval: (query) =>
      query.state.data?.status === 'PENDING' ? 1500 : false,
  });

  const record: ExportRecord | undefined = status.data;
  // Un export ne se conclut qu'une fois : sans ce garde, un rendu de plus
  // relancerait le téléchargement.
  const settled = useRef<string | null>(null);

  useEffect(() => {
    if (!record || record.status === 'PENDING') return;
    if (settled.current === record.id) return;
    settled.current = record.id;

    message.destroy(record.id);
    setPendingId(null);

    if (record.status === 'READY') {
      void download(record).catch((error: unknown) =>
        message.error(errorMessage(error)),
      );
      notification.success({
        message: 'Export prêt',
        description: `${record.fileName} — ${record.rowCount ?? 0} ligne(s). Le téléchargement démarre.`,
        duration: 6,
      });
    } else {
      notification.error({
        message: 'L’export a échoué',
        description: record.error ?? 'Réessayez dans un instant.',
        duration: 8,
      });
    }
  }, [record, message, notification]);

  return {
    run: (wanted: ExportFormat, filters: ReportFilters) =>
      request.mutate({ format: wanted, filters }),
    pending: request.isPending || Boolean(pendingId),
    /** Format en cours de génération, pour n'animer que le bon bouton. */
    runningFormat: pendingId ? format : null,
  };
}

async function download(record: ExportRecord): Promise<void> {
  const blob = await reportsApi.download(record.id);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = record.fileName ?? `export.${record.format}`;
  link.click();
  // Le navigateur a le temps de démarrer le téléchargement.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
