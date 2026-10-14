import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

interface YearChartData {
  year: string;
  count: number;
}

export default function AreaChartCustom({ data }: { data: YearChartData[] }) {
  const chartData = {
    labels: data.map((d) => d.year),
    datasets: [
      {
        label: 'Miembros',
        data: data.map((d) => d.count),
        fill: true,
        backgroundColor: 'rgba(255, 169, 45, 0.18)', // warm
        borderColor: '#1c1b19', // ink
        pointBackgroundColor: '#1c1b19',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#5c5852' } },
      y: { beginAtZero: true, grid: { color: '#e8e3da' }, ticks: { color: '#5c5852' } },
    },
  };

  return <Line data={chartData} options={options} />;
}
