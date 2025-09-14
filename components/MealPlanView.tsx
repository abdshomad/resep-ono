import React from 'react';
import type { DailyMeal, Recipe } from '../types';
import { RefreshIcon, ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from './icons';

// Memberi tahu TypeScript tentang variabel global jsPDF dari CDN
declare const jspdf: any;

interface MealPlanViewProps {
  mealPlan: DailyMeal[];
  onSelectRecipe: (meal: DailyMeal) => void;
  onReset: () => void;
  onRegenerate: (day: string) => void;
  isRegenerating: string | null;
  recipeOptions: { [day: string]: Recipe[] };
  activeRecipeIndexes: { [day: string]: number };
  onRecipeSwipe: (day: string, newIndex: number) => void;
}

const MealPlanView: React.FC<MealPlanViewProps> = ({ 
  mealPlan, 
  onSelectRecipe, 
  onReset,
  onRegenerate,
  isRegenerating,
  recipeOptions,
  activeRecipeIndexes,
  onRecipeSwipe
}) => {
  const handleDownloadPdf = () => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    let y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Rencana Makan Mingguan Anda", doc.internal.pageSize.width / 2, y, { align: "center" });
    y += 15;

    mealPlan.forEach((meal, mealIndex) => {
        const { hari, resep } = meal;
        const pageContentHeight = 250; // Perkiraan kasar tinggi konten per resep

        if (y + pageContentHeight > pageHeight - margin && mealIndex > 0) {
            doc.addPage();
            y = margin;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(`${hari}: ${resep.namaResep}`, margin, y);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const descriptionLines = doc.splitTextToSize(resep.deskripsi, 180);
        doc.text(descriptionLines, margin, y);
        y += descriptionLines.length * 4 + 5;
        
        doc.setFontSize(10);
        doc.text(`Waktu Masak: ${resep.waktuMasak}`, margin, y);
        y += 8;

        // Fungsi untuk menggambar bagian dengan judul
        const drawSection = (title: string, items: string[] | undefined, listPrefix = "- ") => {
            if (!items || items.length === 0) return;
            
            const sectionText = items.map(item => `${listPrefix}${item}`).join('\n');
            const lines = doc.splitTextToSize(sectionText, 180);
            const sectionHeight = lines.length * 5 + 10;
            
            if (y + sectionHeight > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }

            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text(title, margin, y);
            y += 6;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(lines, margin, y);
            y += lines.length * 5 + 5;
        };

        drawSection("Bahan-bahan:", resep.bahan);
        drawSection("Instruksi:", resep.instruksi, ""); // Tidak perlu tanda hubung untuk instruksi bernomor
        drawSection("Tips Memasak:", resep.tips, "💡 ");
        drawSection("Saran Penyajian:", resep.saranPenyajian, "🍽️ ");

        if(resep.nutrisi) {
            const nutrisiText = `Kalori: ${resep.nutrisi.kalori}, Protein: ${resep.nutrisi.protein}, Karbohidrat: ${resep.nutrisi.karbohidrat}, Lemak: ${resep.nutrisi.lemak}`;
            const nutrisiLines = doc.splitTextToSize(`Estimasi Gizi: ${nutrisiText}`, 180);
            const nutrisiHeight = nutrisiLines.length * 5 + 10;
            if (y + nutrisiHeight > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
             drawSection("Estimasi Gizi:", [nutrisiText], "");
        }


        y += 10; // Spasi antar hari
        if (mealIndex < mealPlan.length -1) {
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, y, doc.internal.pageSize.width - margin, y);
          y += 10;
        }
    });

    doc.save("Rencana-Makan.pdf");
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="text-center mb-8 relative">
        <h2 className="text-3xl font-bold text-gray-800">Rencana Makanan Mingguan Anda</h2>
        <p className="text-gray-600 mt-2">Berikut adalah resep-resep yang disiapkan khusus untuk Anda. Ganti resep jika kurang suka, atau klik untuk melihat detailnya.</p>
        <button
          onClick={handleDownloadPdf}
          className="absolute top-0 right-0 -mt-2 inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 shadow-sm"
          aria-label="Unduh rencana makan sebagai PDF"
        >
          <DownloadIcon className="w-5 h-5" />
          <span>Unduh PDF</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mealPlan.map((meal) => {
          const isLoading = isRegenerating === meal.hari;
          const options = recipeOptions[meal.hari] || [];
          const activeIndex = activeRecipeIndexes[meal.hari] || 0;
          const hasOptions = options.length > 1;

          return (
            <div
              key={meal.hari}
              className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              <div className="bg-emerald-600 text-white text-center py-2 font-bold">
                {meal.hari}
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <div className="flex-grow">
                  <div className="relative">
                    {hasOptions && (
                      <button 
                        onClick={() => onRecipeSwipe(meal.hari, activeIndex - 1)} 
                        disabled={activeIndex === 0}
                        className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-white/50 hover:bg-white disabled:opacity-0 disabled:cursor-not-allowed transition-opacity"
                        aria-label="Resep sebelumnya"
                      >
                        <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                      </button>
                    )}

                    <div className="transition-opacity duration-300 ease-in-out" key={meal.resep.namaResep}>
                      <h3 className="text-lg font-semibold text-gray-800 h-14">{meal.resep.namaResep}</h3>
                      <p className="text-sm text-gray-500 mt-2 h-16 overflow-hidden">{meal.resep.deskripsi}</p>
                    </div>

                    {hasOptions && (
                      <button 
                        onClick={() => onRecipeSwipe(meal.hari, activeIndex + 1)} 
                        disabled={activeIndex === options.length - 1}
                        className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-white/50 hover:bg-white disabled:opacity-0 disabled:cursor-not-allowed transition-opacity"
                        aria-label="Resep berikutnya"
                      >
                        <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                      </button>
                    )}
                  </div>
                  
                  {hasOptions && (
                    <div className="flex justify-center items-center space-x-2 h-4 mt-2">
                      {options.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => onRecipeSwipe(meal.hari, index)}
                          className={`w-2 h-2 rounded-full transition-colors ${index === activeIndex ? 'bg-emerald-600' : 'bg-gray-300 hover:bg-gray-400'}`}
                          aria-label={`Pilih resep ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mt-3 border-t pt-2">
                    <span className="font-semibold">Waktu:</span> {meal.resep.waktuMasak}
                  </div>
                </div>

                <div className="mt-4 h-10 flex items-center">
                  {isLoading ? (
                      <div className="flex items-center justify-center text-gray-600 w-full">
                           <svg className="animate-spin h-5 w-5 text-emerald-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                           <span>Mencari resep baru...</span>
                      </div>
                  ) : (
                      <div className="flex gap-2 items-center w-full">
                          <button onClick={() => onSelectRecipe(meal)} className="flex-grow text-center py-2 px-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200">
                            Lihat Resep
                          </button>
                          <button onClick={() => onRegenerate(meal.hari)} className="flex-shrink-0 p-2 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors" aria-label="Ganti Resep">
                            <RefreshIcon className="w-5 h-5" />
                          </button>
                      </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
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