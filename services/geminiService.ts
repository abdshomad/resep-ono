import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { DailyMeal, DietaryPreferences, Ingredient } from './types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const ingredientSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "Nama bahan makanan, contoh: 'Dada Ayam'" },
            quantity: { type: Type.STRING, description: "Estimasi jumlah atau berat, contoh: 'sekitar 500g' atau '3 buah'" }
        },
        required: ["name", "quantity"]
    }
};

export const extractIngredientsFromImage = async (imageFiles: File[]): Promise<Ingredient[]> => {
    const imageParts = await Promise.all(
        imageFiles.map(file => fileToGenerativePart(file))
    );

    const prompt = `Anda adalah ahli pengenalan gambar makanan dan ahli gizi. Analisis semua gambar ini yang berisi bahan-bahan makanan di kulkas, dapur, atau meja. 
1.  Identifikasi setiap item makanan yang terlihat di SEMUA gambar.
2.  Perkirakan jumlah atau berat untuk setiap item (misalnya, "2 buah", "sekitar 250g", "1 ikat", "6 butir").
3.  Gabungkan hasilnya menjadi satu larik JSON objek yang unik. Setiap objek harus memiliki kunci "name" dan "quantity".
4.  Contoh output: [{"name": "Telur", "quantity": "sekitar 6 butir"}, {"name": "Wortel", "quantity": "2 buah"}, {"name": "Dada Ayam", "quantity": "sekitar 500g"}].
5.  Abaikan item non-makanan dan hanya kembalikan JSON yang valid.`;

    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [{ text: prompt }, ...imageParts]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: ingredientSchema
        }
    });

    const text = result.text.trim();
    try {
        const ingredients = JSON.parse(text);
        if (Array.isArray(ingredients)) {
            // Basic validation
            return ingredients.filter(i => i.name && i.quantity);
        }
        return [];
    } catch (e) {
        console.error("Failed to parse ingredients from image:", e);
        throw new Error("Gagal mengenali bahan makanan dari foto. Coba lagi dengan gambar yang lebih jelas.");
    }
};

const mealPlanSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        hari: { type: Type.STRING, description: "Hari dalam seminggu (Senin, Selasa, dst.)" },
        resep: {
          type: Type.OBJECT,
          properties: {
            namaResep: { type: Type.STRING, description: "Nama resep masakan" },
            deskripsi: { type: Type.STRING, description: "Deskripsi singkat dan menarik tentang resep" },
            bahan: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Daftar bahan yang dibutuhkan" },
            instruksi: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Langkah-langkah memasak" },
            waktuMasak: { type: Type.STRING, description: "Estimasi waktu memasak (misal: '30 menit')" }
          },
          required: ["namaResep", "deskripsi", "bahan", "instruksi", "waktuMasak"],
        }
      },
      required: ["hari", "resep"],
    }
};

export const generateMealPlan = async (ingredients: Ingredient[], preferences: DietaryPreferences): Promise<DailyMeal[]> => {
    let preferenceText = "Tidak ada preferensi khusus.";
    const activePreferences = [];
    if (preferences.vegetarian) activePreferences.push("vegetarian");
    if (preferences.glutenFree) activePreferences.push("bebas gluten");
    if (preferences.dairyFree) activePreferences.push("bebas susu");
    if (preferences.lainnya) activePreferences.push(preferences.lainnya);

    if (activePreferences.length > 0) {
        preferenceText = `Dengan mempertimbangkan preferensi diet berikut: ${activePreferences.join(", ")}.`;
    }

    const ingredientListText = ingredients.map(i => `${i.name} (${i.quantity})`).join(", ");

    const prompt = `
        Anda adalah seorang ahli gizi dan koki yang handal dari Indonesia. 
        Berdasarkan daftar bahan makanan dan jumlahnya berikut: ${ingredientListText}.
        ${preferenceText}
        Buatkan rencana makan malam untuk 7 hari (Senin sampai Minggu). Untuk setiap hari, berikan satu resep yang sederhana, lezat, dan cocok untuk keluarga. 
        Pastikan resep memaksimalkan penggunaan bahan yang tersedia dan mempertimbangkan jumlahnya agar realistis.
        Jawab HANYA dalam format JSON sesuai skema yang diberikan.
    `;

    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: mealPlanSchema
        },
    });

    const text = result.text.trim();
    try {
        const plan = JSON.parse(text);
        if (Array.isArray(plan)) {
             return plan as DailyMeal[];
        }
        return [];
    } catch (e) {
        console.error("Failed to parse meal plan:", e);
        throw new Error("Gagal membuat rencana makan. Silakan coba lagi.");
    }
};

export const generateRecipeImage = async (recipeName: string): Promise<string> => {
    try {
        const prompt = `Foto close-up yang fotorealistik dan sangat menggugah selera dari masakan Indonesia: ${recipeName}. Tampilkan di atas piring keramik yang bagus, dengan hiasan segar, pencahayaan studio yang lembut.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const mimeType = part.inlineData.mimeType;
                return `data:${mimeType};base64,${base64ImageBytes}`;
            }
        }
        throw new Error("No image data found in response");
    } catch (error) {
        console.error("Error generating recipe image:", error);
        throw new Error("Gagal membuat gambar masakan.");
    }
};
