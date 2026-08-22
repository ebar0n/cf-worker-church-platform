'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export interface SurveyBar {
  name: string;
  yes: number;
  no: number;
  unanswered: number;
}

interface Props {
  data: SurveyBar[];
  total: number;
  color: string;
  /**
   * Stacked shows Sí / No / Sin responder over the same total, so a low bar
   * cannot be confused with a question nobody answered. Checkbox questions have
   * no "unanswered" state, so they use a single series.
   */
  stacked?: boolean;
}

// Horizontal bars: the questions are long sentences, unreadable as vertical
// axis labels.
export default function SurveyBarChart({ data, total, color, stacked = false }: Props) {
  const datasets = stacked
    ? [
        { label: 'Sí', data: data.map((d) => d.yes), backgroundColor: color },
        { label: 'No', data: data.map((d) => d.no), backgroundColor: '#9ca3af' },
        {
          label: 'Sin responder',
          data: data.map((d) => d.unanswered),
          backgroundColor: '#e5e7eb',
        },
      ]
    : [{ label: 'Personas', data: data.map((d) => d.yes), backgroundColor: color }];

  return (
    <Bar
      data={{ labels: data.map((d) => d.name), datasets }}
      options={{
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: stacked, position: 'bottom', labels: { boxWidth: 12 } },
          tooltip: {
            callbacks: {
              label: (item) => {
                const value = Number(item.raw ?? 0);
                const pct = total === 0 ? 0 : Math.round((value / total) * 100);
                return `${item.dataset.label}: ${value} de ${total} (${pct}%)`;
              },
            },
          },
        },
        scales: {
          x: {
            stacked,
            beginAtZero: true,
            ticks: { precision: 0 },
            suggestedMax: Math.max(total, 1),
          },
          y: { stacked, ticks: { autoSkip: false, font: { size: 11 } } },
        },
      }}
    />
  );
}
