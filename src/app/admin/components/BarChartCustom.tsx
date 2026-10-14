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

interface ChartData {
  name: string;
  value: number;
}

export default function BarChartCustom({ data }: { data: ChartData[] }) {
  const chartData = {
    labels: data.map((d) => d.name),
    datasets: [
      {
        label: 'Solicitudes',
        data: data.map((d) => d.value),
        backgroundColor: '#ffa92d', // warm
        hoverBackgroundColor: '#f29a17',
        borderRadius: 8,
        maxBarThickness: 64,
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

  return <Bar data={chartData} options={options} />;
}
