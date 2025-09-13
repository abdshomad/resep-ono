
export interface DietaryPreferences {
  vegetarian: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  lainnya: string;
}

export interface Ingredient {
  name: string;
  quantity: string;
}

export interface NutritionInfo {
  kalori: string;
  protein: string;
  karbohidrat: string;
  lemak: string;
}

export interface Recipe {
  namaResep: string;
  deskripsi: string;
  bahan: string[];
  instruksi: string[];
  waktuMasak: string;
  imageUrl?: string;
  nutrisi?: NutritionInfo;
  tips?: string[];
}

export interface DailyMeal {
  hari: string;
  resep: Recipe;
}