'use client';

import { useState, useEffect } from 'react';
import { Loader2, Database } from 'lucide-react';

export default function ProcessingStatus() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 text-center">
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full blur opacity-75 animate-pulse"></div>
          <div className="relative bg-slate-800 p-4 rounded-full">
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
          </div>
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-cyan-400 mb-4">
        Processing Products{dots}
      </h3>
      
      <div className="space-y-4 text-slate-300">
        <div className="flex items-center justify-center space-x-2">
          <Database className="w-5 h-5 text-cyan-400" />
          <span>Updating ShipHero with case barcodes</span>
        </div>
        
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <span>Batch processing in progress</span>
            <span className="text-cyan-400">Please wait...</span>
          </div>
          <div className="mt-2 w-full bg-slate-600 rounded-full h-2">
            <div className="bg-gradient-to-r from-cyan-400 to-purple-500 h-2 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <p className="text-sm text-slate-400">
          This may take a few moments depending on the number of products
        </p>
      </div>
    </div>
  );
}
