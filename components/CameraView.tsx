
import React, { useRef, useEffect, useState } from 'react';
import { CloseIcon } from './icons';

interface CameraViewProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const enableStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }, // Prefer rear camera
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          activeStream = stream;
          setStream(stream);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Tidak dapat mengakses kamera. Pastikan Anda telah memberikan izin.");
      }
    };

    enableStream();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && stream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const fileName = `capture-${new Date().toISOString()}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            onCapture(file);
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 z-20" aria-label="Tutup kamera">
        <CloseIcon className="h-8 w-8" />
      </button>
      
      <div className="relative w-full h-full">
        {error ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-white text-center p-4">
            <p className="text-xl font-bold">Error</p>
            <p>{error}</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-emerald-600 rounded-md">Tutup</button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {!error && (
        <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center z-10">
            <button 
                onClick={handleCapture} 
                className="w-20 h-20 bg-white rounded-full border-4 border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white"
                aria-label="Ambil foto"
            />
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraView;
