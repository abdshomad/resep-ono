import React, { useState } from 'react';
import { TrashIcon, PlusIcon, ArrowRightIcon } from './icons';
import type { Ingredient } from '../types';

interface IngredientEditorProps {
  ingredients: Ingredient[];
  onIngredientsChange: (newIngredients: Ingredient[]) => void;
  onConfirm: () => void;
  onBack: () => void;
}

const IngredientEditor: React.FC<IngredientEditorProps> = ({ ingredients, onIngredientsChange, onConfirm, onBack }) => {
  const [newItem, setNewItem] = useState<Ingredient>({ name: '', quantity: '' });

  const handleItemChange = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    onIngredientsChange(updated);
  };

  const handleRemoveItem = (index: number) => {
    onIngredientsChange(ingredients.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    if (newItem.name.trim() && newItem.quantity.trim()) {
      onIngredientsChange([...ingredients, newItem]);
      setNewItem({ name: '', quantity: '' });
    }
  };
  
  const handleNewItemChange = (field: keyof Ingredient, value: string) => {
    setNewItem(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifikasi Bahan Makanan</h2>
      <p className="text-gray-600 mb-6">Periksa daftar bahan dan estimasi jumlahnya. Tambah, ubah, atau hapus jika perlu untuk hasil resep terbaik.</p>
      
      <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-2">
        {ingredients.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <input
              type="text"
              value={item.name}
              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
              placeholder="Nama Bahan"
              className="flex-grow block w-2/3 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
            <input
              type="text"
              value={item.quantity}
              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
               placeholder="Jumlah"
              className="flex-grow block w-1/3 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
            <button onClick={() => handleRemoveItem(index)} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-100 flex-shrink-0">
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-2 mb-6 p-2 bg-gray-50 rounded-md">
        <input
          type="text"
          value={newItem.name}
          onChange={(e) => handleNewItemChange('name', e.target.value)}
          placeholder="Tambah nama bahan..."
          className="flex-grow block w-2/3 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
        />
         <input
          type="text"
          value={newItem.quantity}
          onChange={(e) => handleNewItemChange('quantity', e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
          placeholder="Jumlahnya..."
          className="flex-grow block w-1/3 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
        />
        <button onClick={handleAddItem} className="p-2 text-white bg-emerald-500 hover:bg-emerald-600 rounded-full flex-shrink-0">
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex justify-between items-center">
        <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
        >
            Ubah Foto
        </button>
        <button
          onClick={onConfirm}
          disabled={ingredients.length === 0}
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-gray-400"
        >
          Buat Rencana Makanan
          <ArrowRightIcon className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default IngredientEditor;
