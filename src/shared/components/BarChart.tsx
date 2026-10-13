import { useState } from 'react';
import { formatXof } from '../utils/format';

export interface BarPoint {
  label: string;
  value: number;
}

interface Props {
  data: BarPoint[];
  height?: number;
  /** Formatage de l'info-bulle ; les montants par défaut. */
  format?: (value: number) => string;
}

/**
 * Histogramme en SVG, sans dépendance.
 *
 * Une bibliothèque de graphiques pèse ici plus de 400 Ko gzip pour une seule
 * courbe — inacceptable sur la 3G visée par le cahier des charges (§6). Le
 * besoin est simple : des barres, une échelle, une info-bulle.
 */
export function BarChart({ data, height = 240, format = formatXof }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (data.length === 0) return null;

  const max = Math.max(...data.map((point) => point.value), 1);
  const barWidth = 100 / data.length;

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height, display: 'block' }}
        role="img"
        aria-label="Ventes par jour"
      >
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1="0"
            x2="100"
            y1={height - height * ratio}
            y2={height - height * ratio}
            stroke="#eef2f7"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {data.map((point, index) => {
          const barHeight = (point.value / max) * (height - 12);
          return (
            <rect
              key={point.label}
              x={index * barWidth + barWidth * 0.15}
              y={height - barHeight}
              width={barWidth * 0.7}
              height={Math.max(barHeight, point.value > 0 ? 2 : 0)}
              fill={
                hovered === index
                  ? 'var(--sankara-navy)'
                  : 'var(--sankara-blue)'
              }
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
      </svg>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: '#8a98a8',
          marginTop: 4,
        }}
      >
        <span>{data[0].label}</span>
        <span>{data[Math.floor(data.length / 2)].label}</span>
        <span>{data[data.length - 1].label}</span>
      </div>

      {hovered !== null && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: `${(hovered + 0.5) * barWidth}%`,
            transform: 'translateX(-50%)',
            background: 'var(--sankara-navy)',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: 6,
            fontSize: 12,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {data[hovered].label} · {format(data[hovered].value)}
        </div>
      )}
    </div>
  );
}
