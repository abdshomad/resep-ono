import { GoogleGenAI, Type } from "@google/genai";
import type { DailyMeal, DietaryPreferences, Ingredient, Recipe } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

type ImagePart = { inlineData: { data: string; mimeType: string; } };

export const extractIngredientsFromImage = async (imageParts: ImagePart[]): Promise<Ingredient[]> => {
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

const singleRecipeSchema = {
  type: Type.OBJECT,
  properties: {
    namaResep: { type: Type.STRING, description: "Nama resep masakan" },
    deskripsi: { type: Type.STRING, description: "Deskripsi singkat dan menarik tentang resep" },
    bahan: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Daftar bahan yang dibutuhkan" },
    instruksi: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Langkah-langkah memasak" },
    waktuMasak: { type: Type.STRING, description: "Estimasi waktu memasak (misal: '30 menit')" },
    nutrisi: {
      type: Type.OBJECT,
      description: "Estimasi informasi gizi per porsi",
      properties: {
        kalori: { type: Type.STRING, description: "Jumlah kalori, contoh: '450 kcal'" },
        protein: { type: Type.STRING, description: "Jumlah protein, contoh: '30g'" },
        karbohidrat: { type: Type.STRING, description: "Jumlah karbohidrat, contoh: '40g'" },
        lemak: { type: Type.STRING, description: "Jumlah lemak, contoh: '15g'" }
      },
      required: ["kalori", "protein", "karbohidrat", "lemak"]
    },
    tips: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Satu atau dua tips memasak yang relevan dengan resep"
    },
    saranPenyajian: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Satu atau dua saran penyajian untuk resep, seperti lauk pendamping atau cara menghias."
    }
  },
  required: ["namaResep", "deskripsi", "bahan", "instruksi", "waktuMasak", "nutrisi", "tips", "saranPenyajian"],
};

const mealPlanSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        hari: { type: Type.STRING, description: "Hari dalam seminggu (Senin, Selasa, dst.)" },
        resep: singleRecipeSchema,
      },
      required: ["hari", "resep"],
    }
};

export const generateMealPlan = async (ingredients: Ingredient[], preferences: DietaryPreferences, useOnlyProvidedIngredients: boolean): Promise<DailyMeal[]> => {
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

    const strictInstruction = useOnlyProvidedIngredients
        ? "PENTING: Buat resep HANYA menggunakan bahan-bahan dari daftar yang diberikan. Jangan menyarankan bahan apa pun yang tidak ada dalam daftar."
        : "Pastikan resep memaksimalkan penggunaan bahan yang tersedia dan mempertimbangkan jumlahnya agar realistis. Anda boleh menyarankan beberapa bahan tambahan umum jika diperlukan untuk melengkapi resep.";

    const prompt = `
        Anda adalah seorang ahli gizi dan koki yang handal dari Indonesia. 
        Berdasarkan daftar bahan makanan dan jumlahnya berikut: ${ingredientListText}.
        ${preferenceText}
        Buatkan rencana makan malam untuk 7 hari (Senin sampai Minggu). Untuk setiap hari, berikan satu resep yang sederhana, lezat, dan cocok untuk keluarga. 
        ${strictInstruction}

        Untuk SETIAP resep, sertakan juga:
        1.  Estimasi informasi gizi per porsi (kalori, protein, karbohidrat, lemak).
        2.  Satu atau dua tips memasak yang relevan dan bermanfaat.
        3.  Satu atau dua saran penyajian (misalnya, lauk pendamping atau cara menghias).
        
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

export const regenerateRecipe = async (
    ingredients: Ingredient[], 
    preferences: DietaryPreferences, 
    useOnlyProvidedIngredients: boolean,
    currentMealPlan: DailyMeal[],
    dayToRegenerate: string,
): Promise<Recipe> => {
    const mealToReplace = currentMealPlan.find(m => m.hari === dayToRegenerate);
    const otherRecipes = currentMealPlan.filter(m => m.hari !== dayToRegenerate).map(m => m.resep.namaResep);

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

    const strictInstruction = useOnlyProvidedIngredients
        ? "PENTING: Buat resep HANYA menggunakan bahan-bahan dari daftar yang diberikan."
        : "Pastikan resep memaksimalkan penggunaan bahan yang tersedia. Anda boleh menyarankan beberapa bahan tambahan umum jika diperlukan untuk melengkapi resep.";

    const prompt = `
        Anda adalah seorang ahli gizi dan koki yang handal dari Indonesia.
        Berdasarkan daftar bahan makanan berikut: ${ingredientListText}.
        ${preferenceText}
        Buatkan satu resep makan malam BARU dan BERBEDA untuk hari ${dayToRegenerate}.
        Resep saat ini untuk hari itu adalah "${mealToReplace?.resep.namaResep}", jadi berikan sesuatu yang berbeda.
        Hindari membuat resep yang mirip dengan yang sudah ada di rencana makan minggu ini: ${otherRecipes.join(", ")}.
        Resep baru harus sederhana, lezat, dan cocok untuk keluarga.
        ${strictInstruction}

        Sertakan juga:
        1. Estimasi informasi gizi per porsi (kalori, protein, karbohidrat, lemak).
        2. Satu atau dua tips memasak yang bermanfaat.
        3. Satu atau dua saran penyajian.

        Jawab HANYA dalam format JSON sesuai skema yang diberikan untuk satu resep.
    `;

    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: singleRecipeSchema
        },
    });

    const text = result.text.trim();
    try {
        const recipe = JSON.parse(text);
        if (recipe && recipe.namaResep) {
            return recipe as Recipe;
        }
        throw new Error("Respon AI tidak valid.");
    } catch (e) {
        console.error("Gagal mem-parsing resep baru:", e);
        throw new Error("Gagal membuat resep baru. Silakan coba lagi.");
    }
};

export const generateRecipeImage = async (recipeName: string): Promise<string> => {
    try {
        const prompt = `Foto close-up yang fotorealistik dan sangat menggugah selera dari masakan Indonesia: ${recipeName}. Tampilkan di atas piring keramik yang bagus, dengan hiasan segar, pencahayaan studio yang lembut.`;
        
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '4:3',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        
        throw new Error("No image data found in response");
    } catch (error) {
        console.error("Error generating recipe image:", error);
        throw new Error("Gagal membuat gambar masakan.");
    }
};