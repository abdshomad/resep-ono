import React, { useEffect, useRef } from 'react';

// Let TypeScript know Chart.js is available globally from the CDN script
declare const Chart: any;

interface TotalNutrition {
  kalori: number;
  protein: number;
  karbohidrat: number;
  lemak: number;
}

interface NutritionSummaryChartProps {
  totalNutrition: TotalNutrition;
}

const NutritionSummaryChart: React.FC<NutritionSummaryChartProps> = ({ totalNutrition }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null); // To hold the chart instance

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        // Destroy the previous chart instance if it exists to prevent memory leaks
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        chartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Kalori', 'Protein', 'Karbohidrat', 'Lemak'],
            datasets: [{
              label: 'Total Nutrisi Mingguan',
              data: [
                totalNutrition.kalori,
                totalNutrition.protein,
                totalNutrition.karbohidrat,
                totalNutrition.lemak,
              ],
              backgroundColor: [
                'rgba(56, 189, 248, 0.6)',   // sky-400
                'rgba(244, 63, 94, 0.6)',    // rose-500
                'rgba(251, 191, 36, 0.6)',  // amber-400
                'rgba(132, 204, 22, 0.6)',   // lime-500
              ],
              borderColor: [
                'rgb(56, 189, 248)',
                'rgb(244, 63, 94)',
                'rgb(251, 191, 36)',
                'rgb(132, 204, 22)',
              ],
              borderWidth: 1,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false, // The labels on the x-axis are clear enough
              },
              title: {
                display: true,
                text: 'Ringkasan Gizi Mingguan',
                font: {
                  size: 18,
                  weight: '600'
                },
                color: '#374151', // text-gray-700
                padding: {
                  top: 10,
                  bottom: 20
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context: any) {
                      let label = context.dataset.label || '';
                      if (label) {
                          label += ': ';
                      }
                      if (context.parsed.y !== null) {
                          const unit = context.label.includes('Kalori') ? 'kcal' : 'g';
                          label += `${context.parsed.y} ${unit}`;
                      }
                      return label;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Jumlah'
                }
              },
              x: {
                ticks: {
                  font: {
                    size: 12
                  }
                }
              }
            }
          }
        });
      }
    }

    // Cleanup function to destroy chart on component unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [totalNutrition]); // Re-render chart if nutrition data changes

  return (
     <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
        <div className="relative h-80">
             <canvas ref={chartRef} role="img" aria-label="Grafik batang ringkasan gizi mingguan"></canvas>
        </div>
     </div>
  );
};

export default NutritionSummaryChart;
