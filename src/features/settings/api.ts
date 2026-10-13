import { api } from '../../shared/api/http';

export type SettingsMap = Record<string, unknown>;

export const settingsApi = {
  all: () => api.get<SettingsMap>('/settings'),

  update: (values: SettingsMap) =>
    api.patch<SettingsMap>('/settings', { values }),
};
