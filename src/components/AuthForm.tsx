'use client';

import { useState } from 'react';
import { Key, Eye, EyeOff, Zap } from 'lucide-react';

interface AuthFormProps {
  onAuthenticated: () => void;
}

export default function AuthForm({ onAuthenticated }: AuthFormProps) {
  const [showToken, setShowToken] = useState(false);
  const [formData, setFormData] = useState({
    refreshToken: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/shiphero/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: formData.refreshToken
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const data = await response.json();
      localStorage.setItem('shiphero_access_token', data.accessToken);
      
      onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg blur opacity-75"></div>
            <div className="relative bg-slate-800 p-3 rounded-lg">
              <Key className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-cyan-400 mb-2">Authentication</h2>
        <p className="text-slate-300">Connect to ShipHero API</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Refresh Token */}
        <div>
          <label htmlFor="refreshToken" className="block text-sm font-medium text-slate-300 mb-2">
            Refresh Token <span className="text-gray-500">(if 3PL use child account refresh token)</span>
          </label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              id="refreshToken"
              value={formData.refreshToken}
              onChange={(e) => setFormData(prev => ({ ...prev, refreshToken: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              placeholder="Enter your ShipHero refresh token"
              required
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>


        {/* Error Message */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span>Connect to ShipHero</span>
            </>
          )}
        </button>
      </form>

    </div>
  );
}
