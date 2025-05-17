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
        backgroundColor: '#e36520', // Naranja institucional
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return <Bar data={chartData} options={options} />;
}
