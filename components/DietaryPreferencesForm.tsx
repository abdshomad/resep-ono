
import React from 'react';
import type { DietaryPreferences } from '../types';

interface DietaryPreferencesFormProps {
  preferences: DietaryPreferences;
  onPreferencesChange: (newPreferences: DietaryPreferences) => void;
}

const DietaryPreferencesForm: React.FC<DietaryPreferencesFormProps> = ({ preferences, onPreferencesChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    onPreferencesChange({
      ...preferences,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Preferensi Diet Anda</h3>
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="vegetarian"
            checked={preferences.vegetarian}
            onChange={handleChange}
            className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
          />
          <span className="ml-2 text-gray-700">Vegetarian</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            name="glutenFree"
            checked={preferences.glutenFree}
            onChange={handleChange}
            className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
          />
          <span className="ml-2 text-gray-700">Bebas Gluten</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            name="dairyFree"
            checked={preferences.dairyFree}
            onChange={handleChange}
            className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
          />
          <span className="ml-2 text-gray-700">Bebas Susu</span>
        </label>
        <div>
          <label htmlFor="lainnya" className="block text-sm font-medium text-gray-700 mb-1">Lainnya (mis: alergi kacang)</label>
          <input
            type="text"
            id="lainnya"
            name="lainnya"
            value={preferences.lainnya}
            onChange={handleChange}
            placeholder="Contoh: tidak suka pedas"
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default DietaryPreferencesForm;
