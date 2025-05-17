import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } from 'chart.js';

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
        backgroundColor: 'rgba(75, 32, 127, 0.2)', // Morado institucional con transparencia
        borderColor: '#4b207f',
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
      y: { beginAtZero: true },
    },
  };

  return <Line data={chartData} options={options} />;
}