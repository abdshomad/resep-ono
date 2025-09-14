import React, { useState, useCallback, useEffect } from 'react';
import type { DailyMeal, DietaryPreferences, Ingredient } from './types';
import { extractIngredientsFromImage, generateMealPlan, generateRecipeImage } from './services/geminiService';
import Header from './components/Header';
import ReceiptUpload from './components/ReceiptUpload';
import DietaryPreferencesForm from './components/DietaryPreferencesForm';
import IngredientEditor from './components/IngredientEditor';
import LoadingIndicator from './components/LoadingIndicator';
import MealPlanView from './components/MealPlanView';
import RecipeModal from './components/RecipeModal';

type AppState = 'initial' | 'processing_receipt' | 'editing_ingredients' | 'confirm_add_ingredients' | 'generating_plan' | 'showing_plan';

const loadingMessages = {
  processing_receipt: 'Menganalisis foto bahan makanan...',
  generating_plan: 'Menyusun rencana makan...',
};

const PREFERENCES_STORAGE_KEY = 'resep-ono-preferences';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('initial');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [mealPlan, setMealPlan] = useState<DailyMeal[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<DailyMeal | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [preferences, setPreferences] = useState<DietaryPreferences>(() => {
    try {
        const storedPreferences = localStorage.getItem(PREFERENCES_STORAGE_KEY);
        if (storedPreferences) {
            const parsed = JSON.parse(storedPreferences);
            // Validasi dasar untuk memastikan ini bukan string acak yang tersimpan
            if (typeof parsed === 'object' && parsed !== null && 'vegetarian' in parsed) {
               return parsed;
            }
        }
    } catch (e) {
        console.error("Gagal mem-parsing preferensi dari localStorage", e);
    }
    // Kembalikan default jika tidak ada di penyimpanan atau parsing gagal
    return {
        vegetarian: false,
        glutenFree: false,
        dairyFree: false,
        lainnya: '',
    };
  });

  useEffect(() => {
    try {
        localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
    } catch (e) {
        console.error("Gagal menyimpan preferensi ke localStorage", e);
    }
  }, [preferences]);


  const handleReset = () => {
    setAppState('initial');
    setIngredients([]);
    setMealPlan([]);
    setSelectedRecipe(null);
    setError(null);
  };
  
  const handleImagesUpload = useCallback(async (files: File[]) => {
    setError(null);

    const fileToGenerativePart = (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    const parts = reader.result.split(',');
                    if (parts.length === 2 && parts[1]) {
                        resolve({ inlineData: { data: parts[1], mimeType: file.type } });
                    } else {
                        reject(new Error(`Gagal memproses file: ${file.name}. Format tidak valid.`));
                    }
                } else {
                    reject(new Error(`Hasil pembacaan file bukan string untuk: ${file.name}.`));
                }
            };
            reader.onerror = () => {
                reject(reader.error || new Error(`Gagal membaca file: ${file.name}`));
            };
            reader.readAsDataURL(file);
        });
    };

    // Segera mulai membaca file untuk menghindari masalah izin.
    const imagePartsPromises = files.map(fileToGenerativePart);
    
    setAppState('processing_receipt');

    try {
      const imageParts = await Promise.all(imagePartsPromises);
      const extracted = await extractIngredientsFromImage(imageParts);
      
      if (extracted.length === 0) {
        throw new Error("Tidak ada bahan makanan yang dapat ditemukan. Coba lagi dengan gambar yang lebih jelas.");
      }
      setIngredients(extracted);
      setAppState('editing_ingredients');
    } catch (e: any) {
      setError(e.message || 'Terjadi kesalahan');
      setAppState('initial');
    }
  }, []);

  const handleInitialPlanGeneration = useCallback(async () => {
    setAppState('generating_plan');
    setError(null);
    try {
      const plan = await generateMealPlan(ingredients, preferences, true); // Strict dulu
      if (plan.length === 0) {
        setAppState('confirm_add_ingredients');
      } else {
        setMealPlan(plan);
        setAppState('showing_plan');
      }
    } catch (e: any) {
      console.error("Pembuatan rencana ketat gagal, menawarkan opsi fleksibel:", e);
      // Kembali ke meminta pengguna jika pembuatan ketat gagal karena alasan apa pun
      setAppState('confirm_add_ingredients');
    }
  }, [ingredients, preferences]);

  const handleFlexiblePlanGeneration = useCallback(async () => {
    setAppState('generating_plan');
    setError(null);
    try {
      const plan = await generateMealPlan(ingredients, preferences, false); // Tidak strict
      if (plan.length === 0) {
        throw new Error("Tidak dapat membuat rencana makan bahkan dengan bahan tambahan. Coba lagi dengan daftar bahan yang berbeda.");
      }
      setMealPlan(plan);
      setAppState('showing_plan');
    } catch (e: any) {
      setError(e.message || 'Terjadi kesalahan');
      setAppState('editing_ingredients');
    }
  }, [ingredients, preferences]);


  const handleSelectRecipe = useCallback(async (meal: DailyMeal) => {
    setSelectedRecipe(meal);
    if (meal.resep.imageUrl) {
      return; // Gambar sudah ada
    }
    
    setIsGeneratingImage(true);
    try {
      const imageUrl = await generateRecipeImage(meal.resep.namaResep);
      // Perbarui URL gambar di state mealPlan utama untuk caching
      setMealPlan(currentPlan =>
        currentPlan.map(m =>
          m.hari === meal.hari ? { ...m, resep: { ...m.resep, imageUrl } } : m
        )
      );
      // Perbarui resep yang dipilih untuk memicu render ulang di modal
      setSelectedRecipe(currentRecipe =>
        currentRecipe ? { ...currentRecipe, resep: { ...currentRecipe.resep, imageUrl } } : null
      );
    } catch (e: any) {
      console.error("Pembuatan gambar gagal:", e.message);
      // Anda bisa mengatur state error untuk gambar di sini jika diinginkan
    } finally {
      setIsGeneratingImage(false);
    }
  }, []);

  const renderContent = () => {
    const isProcessing = appState === 'processing_receipt' || appState === 'generating_plan';
    switch (appState) {
      case 'initial':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <ReceiptUpload onImagesUpload={handleImagesUpload} isProcessing={isProcessing} />
            <DietaryPreferencesForm preferences={preferences} onPreferencesChange={setPreferences} />
          </div>
        );
      case 'processing_receipt':
      case 'generating_plan':
        return <LoadingIndicator message={loadingMessages[appState]} />;
      case 'editing_ingredients':
        return (
          <div className="flex flex-col md:flex-row gap-8 items-start">
             <div className="flex-shrink-0 w-full md:w-1/3">
              <DietaryPreferencesForm preferences={preferences} onPreferencesChange={setPreferences} />
            </div>
            <div className="flex-grow">
              <IngredientEditor
                ingredients={ingredients}
                onIngredientsChange={setIngredients}
                onConfirm={handleInitialPlanGeneration}
                onBack={handleReset}
              />
            </div>
          </div>
        );
      case 'confirm_add_ingredients':
        return (
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md mx-auto text-center border border-gray-200">
                <div className="text-4xl mb-4">🤔</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">Bahan Kurang Mencukupi?</h2>
                <p className="text-gray-600 mb-8">
                    Kami kesulitan membuat rencana makan hanya dari bahan yang Anda berikan. Izinkan kami untuk mencoba membuat resep yang lebih fleksibel dengan menyarankan beberapa bahan tambahan?
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button
                        onClick={() => setAppState('editing_ingredients')}
                        className="w-full px-6 py-3 font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                    >
                        Tidak, Ubah Bahan
                    </button>
                    <button
                        onClick={handleFlexiblePlanGeneration}
                        className="w-full px-6 py-3 font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                        Ya, Buat Resep Fleksibel
                    </button>
                </div>
            </div>
        );
      case 'showing_plan':
        return <MealPlanView mealPlan={mealPlan} onSelectRecipe={handleSelectRecipe} onReset={handleReset} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Oops! </strong>
            <span className="block sm:inline">{error}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
            </span>
          </div>
        )}
        {renderContent()}
      </main>
      <footer className="text-center p-4 text-sm text-gray-500">
        Dibuat dengan ❤️ untuk mengurangi sisa makanan.
      </footer>
      <RecipeModal 
        meal={selectedRecipe} 
        onClose={() => setSelectedRecipe(null)} 
        ownedIngredients={ingredients}
        isGeneratingImage={isGeneratingImage} 
        />
    </div>
  );
};

export default App;