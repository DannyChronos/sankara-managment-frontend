import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import { ReportTable } from './ReportTable';
import type { ReportResult } from '../../../shared/api/types';

const report: ReportResult = {
  type: 'sales',
  title: 'Rapport des ventes',
  generatedAt: '2026-10-13T14:00:00.000Z',
  filters: {},
  columns: [
    { key: 'day', label: 'Jour' },
    { key: 'salesCount', label: 'Ventes' },
    { key: 'net', label: 'Net encaissé', money: true },
  ],
  rows: [
    { day: '2026-10-12', salesCount: 3, net: 450000 },
    { day: '2026-10-13', salesCount: 2, net: 100000 },
  ],
  totals: { salesCount: 5, net: 550000 },
};

function renderTable(override: Partial<ReportResult> = {}) {
  render(
    <ConfigProvider locale={frFR}>
      <ReportTable report={{ ...report, ...override }} />
    </ConfigProvider>,
  );
}

describe('tableau de rapport', () => {
  it('se construit à partir des colonnes annoncées par l’API', () => {
    renderTable();

    expect(screen.getAllByText('Jour').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Net encaissé').length).toBeGreaterThan(0);
    expect(screen.getByText('2026-10-12')).toBeInTheDocument();
  });

  it('formate en FCFA les seules colonnes monétaires', () => {
    renderTable();

    expect(screen.getByText(/450\s*000\s*FCFA/)).toBeInTheDocument();
    // Un nombre de ventes n'est pas un montant.
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('affiche la ligne de total renvoyée par l’API', () => {
    renderTable();

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/550\s*000\s*FCFA/)).toBeInTheDocument();
  });

  it('le dit quand la période ne contient rien', () => {
    renderTable({ rows: [], totals: {} });

    expect(
      screen.getByText(/aucune donnée sur cette période/i),
    ).toBeInTheDocument();
  });
});
