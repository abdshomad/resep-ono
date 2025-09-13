import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full bg-white shadow-md p-4">
      <div className="max-w-5xl mx-auto flex items-center">
        <img src="https://img.icons8.com/color/48/000000/carrot.png" alt="Carrot Icon" className="h-10 w-10 mr-3"/>
        <h1 className="text-2xl font-bold text-emerald-700 tracking-tight">Bahan Jadi Resep</h1>
      </div>
    </header>
  );
};

export default Header;