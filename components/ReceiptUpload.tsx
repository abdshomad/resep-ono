
import React, { useRef, useState, useEffect } from 'react';
import { UploadIcon, TrashIcon, CameraIcon } from './icons';
import CameraView from './CameraView';

interface ReceiptUploadProps {
  onImagesUpload: (files: File[]) => void;
  isProcessing: boolean;
}

const ReceiptUpload: React.FC<ReceiptUploadProps> = ({ onImagesUpload, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  useEffect(() => {
    const newImagePreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(newImagePreviews);

    return () => {
      newImagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleCapture = (file: File) => {
    setSelectedFiles(prevFiles => [...prevFiles, file]);
    setIsCameraOpen(false);
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleConfirm = () => {
    if (selectedFiles.length > 0) {
      onImagesUpload(selectedFiles);
    }
  };

  return (
    <>
      {isCameraOpen && (
        <CameraView 
          onCapture={handleCapture}
          onClose={() => setIsCameraOpen(false)}
        />
      )}
      <div className="text-center p-6 bg-white rounded-lg shadow-md border border-gray-200">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ubah Isi Kulkas Jadi Rencana Masak</h2>
          <p className="text-gray-600 mb-6">Ambil foto atau unggah gambar bahan makanan di kulkas atau dapur Anda. Anda bisa menambahkan beberapa foto untuk hasil yang lebih akurat.</p>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
            multiple
          />
          
          {selectedFiles.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4 p-2 border border-dashed rounded-lg bg-gray-50">
              {imagePreviews.map((previewUrl, index) => (
                <div key={index} className="relative group">
                  <img src={previewUrl} alt={`preview ${index}`} className="w-full h-24 object-cover rounded-md"/>
                  <button 
                    onClick={() => handleRemoveFile(index)}
                    className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Hapus gambar"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="space-y-3">
              <button
                onClick={() => setIsCameraOpen(true)}
                disabled={isProcessing}
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-emerald-600 text-base font-medium rounded-md text-emerald-700 bg-white hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                <CameraIcon className="w-6 h-6 mr-3" />
                Ambil Foto
              </button>
              <button
                onClick={handleTriggerFileInput}
                disabled={isProcessing}
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-emerald-600 text-base font-medium rounded-md text-emerald-700 bg-white hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                <UploadIcon className="w-6 h-6 mr-3" />
                Unggah Gambar
              </button>
              <button
                  onClick={handleConfirm}
                  disabled={selectedFiles.length === 0 || isProcessing}
                  className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-transform transform hover:scale-105 disabled:bg-gray-400"
              >
                  {isProcessing ? 'Memproses...' : `Proses ${selectedFiles.length} Foto`}
              </button>
          </div>
          <p className="text-xs text-gray-500 mt-4">Pastikan foto bahan-bahan terlihat jelas.</p>
        </div>
      </div>
    </>
  );
};

export default ReceiptUpload;
