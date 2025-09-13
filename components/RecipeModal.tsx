import React from 'react';
import type { DailyMeal, Ingredient } from '../types';
import { CloseIcon } from './icons';

interface RecipeModalProps {
  meal: DailyMeal | null;
  onClose: () => void;
  ownedIngredients: Ingredient[];
  isGeneratingImage: boolean;
}

const ImagePlaceholder = () => (
    <div className="w-full h-64 bg-gray-200 rounded-t-xl flex flex-col items-center justify-center animate-pulse">
      <svg className="w-12 h-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
      </svg>
      <span className="text-gray-500 mt-2">Membuat gambar masakan...</span>
    </div>
);

const RecipeModal: React.FC<RecipeModalProps> = ({ meal, onClose, ownedIngredients, isGeneratingImage }) => {
  if (!meal) return null;

  const { resep } = meal;
  const { nutrisi, tips } = resep;
  
  const ownedIngredientsLower = ownedIngredients.map(i => i.name.toLowerCase());

  const isIngredientOwned = (ingredient: string) => {
    const ingredientLower = ingredient.toLowerCase();
    // Check if any owned ingredient name is included in the recipe ingredient string, or vice-versa
    return ownedIngredientsLower.some(owned => ingredientLower.includes(owned) || owned.includes(ingredientLower));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
        
        {isGeneratingImage && <ImagePlaceholder />}
        {!isGeneratingImage && resep.imageUrl && (
            <img src={resep.imageUrl} alt={resep.namaResep} className="w-full h-64 object-cover rounded-t-xl" />
        )}

        <div className="p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-white/50 rounded-full p-1">
            <CloseIcon className="h-6 w-6" />
          </button>
          
          <h2 className="text-3xl font-bold text-emerald-700 mb-2">{resep.namaResep}</h2>
          <p className="text-gray-500 mb-1">Resep untuk: <span className="font-semibold text-gray-700">{meal.hari}</span></p>
          <p className="text-sm text-gray-500 bg-emerald-50 inline-block px-2 py-1 rounded-full mb-4">
            <span className="font-semibold">Waktu Memasak:</span> {resep.waktuMasak}
          </p>
          <p className="text-gray-600 mb-6">{resep.deskripsi}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 border-b-2 border-emerald-200 pb-2">Bahan-bahan</h3>
              <ul className="space-y-2">
                {resep.bahan.map((item, index) => (
                  <li key={index} className={`flex items-start ${isIngredientOwned(item) ? 'text-gray-800' : 'text-red-600'}`}>
                    {isIngredientOwned(item) ? 
                      <span className="text-emerald-500 mr-2 mt-1">✓</span> :
                      <span className="text-red-500 mr-2 mt-1">!</span>
                    }
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-400 mt-2"><span className="text-emerald-500">✓</span> = Anda punya. <span className="text-red-500">!</span> = Mungkin perlu dibeli.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 border-b-2 border-emerald-200 pb-2">Instruksi</h3>
              <ol className="list-decimal list-inside space-y-3 text-gray-700">
                {resep.instruksi.map((step, index) => (
                  <li key={index} className="pl-2">{step}</li>
                ))}
              </ol>
            </div>
          </div>

          {(nutrisi || (tips && tips.length > 0)) && (
            <div className="mt-8 bg-emerald-50/60 p-4 rounded-lg">
                <div className="space-y-6">
                {nutrisi && (
                <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-3 border-b-2 border-emerald-200 pb-2">Estimasi Informasi Gizi</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="bg-sky-200/60 p-4 rounded-lg shadow-sm">
                        <p className="text-sm text-sky-800 font-semibold">Kalori</p>
                        <p className="text-xl font-bold text-sky-900 mt-1">{nutrisi.kalori}</p>
                    </div>
                    <div className="bg-rose-200/60 p-4 rounded-lg shadow-sm">
                        <p className="text-sm text-rose-800 font-semibold">Protein</p>
                        <p className="text-xl font-bold text-rose-900 mt-1">{nutrisi.protein}</p>
                    </div>
                    <div className="bg-amber-200/60 p-4 rounded-lg shadow-sm">
                        <p className="text-sm text-amber-800 font-semibold">Karbohidrat</p>
                        <p className="text-xl font-bold text-amber-900 mt-1">{nutrisi.karbohidrat}</p>
                    </div>
                    <div className="bg-lime-200/60 p-4 rounded-lg shadow-sm">
                        <p className="text-sm text-lime-800 font-semibold">Lemak</p>
                        <p className="text-xl font-bold text-lime-900 mt-1">{nutrisi.lemak}</p>
                    </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 text-center">Estimasi per porsi.</p>
                </div>
                )}

                {tips && tips.length > 0 && (
                <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-3 border-b-2 border-emerald-200 pb-2">Tips Memasak</h3>
                    <ul className="space-y-3">
                    {tips.map((tip, index) => (
                        <li key={index} className="flex items-start bg-white/50 p-3 rounded-md">
                        <span className="text-emerald-500 mr-3 mt-1 text-lg">💡</span>
                        <span className="text-gray-700">{tip}</span>
                        </li>
                    ))}
                    </ul>
                </div>
                )}
                </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default RecipeModal;
