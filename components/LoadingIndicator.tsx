import React, { useState, useEffect } from 'react';

interface LoadingIndicatorProps {
  messages: string[];
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ messages }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    // Reset index when the component mounts or the set of messages changes.
    setCurrentMessageIndex(0);
    
    if (messages.length <= 1) {
        return; // No need for an interval if there's only one (or zero) messages.
    }

    const intervalId = setInterval(() => {
      setCurrentMessageIndex(prevIndex => {
        // If it's the last message, stop the interval and stay on it.
        if (prevIndex >= messages.length - 1) {
          clearInterval(intervalId);
          return prevIndex;
        }
        // Otherwise, move to the next message.
        return prevIndex + 1;
      });
    }, 2200); // Change message every 2.2 seconds.

    // Cleanup function to clear the interval when the component unmounts or messages change.
    return () => clearInterval(intervalId);
  }, [messages]);

  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <svg className="animate-spin h-12 w-12 text-emerald-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {/* Wrapper with fixed height to prevent layout shift if message text wraps to two lines */}
      <div className="h-14 flex items-center justify-center">
        <p className="text-lg font-medium text-gray-700">
          {messages[currentMessageIndex] || messages[0]}
        </p>
      </div>
      <p className="text-sm text-gray-500 mt-1">Ini mungkin memakan waktu sejenak...</p>
    </div>
  );
};

export default LoadingIndicator;
