import React from 'react';
import type { DailyMeal } from '../types';

interface MealPlanViewProps {
  mealPlan: DailyMeal[];
  onSelectRecipe: (meal: DailyMeal) => void;
  onReset: () => void;
}

const MealPlanView: React.FC<MealPlanViewProps> = ({ mealPlan, onSelectRecipe, onReset }) => {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Rencana Makanan Mingguan Anda</h2>
        <p className="text-gray-600 mt-2">Berikut adalah resep-resep yang disiapkan khusus untuk Anda. Klik pada resep untuk melihat detailnya.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mealPlan.map((meal) => (
          <div
            key={meal.hari}
            onClick={() => onSelectRecipe(meal)}
            className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform hover:-translate-y-1 transition-all duration-300"
          >
            <div className="bg-emerald-600 text-white text-center py-2 font-bold">
              {meal.hari}
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 h-14">{meal.resep.namaResep}</h3>
              <p className="text-sm text-gray-500 mt-2 h-16 overflow-hidden">{meal.resep.deskripsi}</p>
              <div className="text-xs text-gray-500 mt-3 border-t pt-2">
                <span className="font-semibold">Waktu:</span> {meal.resep.waktuMasak}
              </div>
            </div>
          </div>
        ))}
         <div 
          onClick={onReset}
          className="bg-gray-100 hover:bg-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-center p-4 cursor-pointer transition-colors duration-300">
          <p className="text-4xl">🔄</p>
          <p className="font-semibold text-gray-700 mt-2">Mulai Lagi</p>
          <p className="text-sm text-gray-500">Buat rencana baru dengan foto lain.</p>
        </div>
      </div>
    </div>
  );
};

export default MealPlanView;