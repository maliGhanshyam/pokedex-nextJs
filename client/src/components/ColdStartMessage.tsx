'use client';

import { useEffect, useState } from 'react';

interface ColdStartMessageProps {
  onRetry?: () => void;
}

export default function ColdStartMessage({ onRetry }: ColdStartMessageProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (onRetry) {
      onRetry();
    }
  }, [countdown, onRetry]);

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <div className="text-2xl mr-3">⏳</div>
          <div className="flex-1">
            <h3 className="font-bold text-yellow-800 mb-1">
              Server is waking up (free tier)
            </h3>
            <p className="text-sm text-yellow-700 mb-2">
              This may take ~20 seconds. Please wait...
            </p>
            {countdown > 0 && (
              <p className="text-xs text-yellow-600">
                Auto-retrying in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

