import { api, http } from '../../shared/api/http';
import type {
  ExportFormat,
  ExportRecord,
  ReportResult,
  ReportType,
} from '../../shared/api/types';

export interface ReportFilters {
  from?: string;
  to?: string;
  siteId?: string;
  cashierId?: string;
  variantId?: string;
}

export const reportsApi = {
  build: (type: ReportType, filters: ReportFilters) =>
    api.get<ReportResult>(`/reports/${type}`, { params: filters }),

  requestExport: (
    type: ReportType,
    format: ExportFormat,
    filters: ReportFilters,
  ) =>
    api.post<ExportRecord>(`/reports/${type}/export`, { format, ...filters }),

  exportStatus: (id: string) => api.get<ExportRecord>(`/reports/exports/${id}`),

  /** Le fichier est protégé par le jeton : on le récupère en blob. */
  download: (id: string) =>
    http
      .get<Blob>(`/reports/exports/${id}/download`, { responseType: 'blob' })
      .then((response) => response.data),
};
