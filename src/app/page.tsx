'use client';

import { useState, useEffect } from 'react';
import { Upload, Zap, Database, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import AuthForm from '@/components/AuthForm';
import CSVUpload from '@/components/CSVUpload';
import ProcessingStatus from '@/components/ProcessingStatus';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResults, setProcessingResults] = useState<any>(null);

  // Check for existing authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('shiphero_access_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('shiphero_access_token');
    localStorage.removeItem('shiphero_account_id');
    setIsAuthenticated(false);
    setProcessingResults(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg blur opacity-75"></div>
              <div className="relative bg-slate-800 p-4 rounded-lg">
                <Database className="w-12 h-12 text-cyan-400" />
              </div>
            </div>
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            Case and Alias Barcode Uploader
          </h1>
          <p className="text-xl text-slate-300 mb-2">ShipHero Product Case Barcode Generator</p>
          <p className="text-slate-400">Upload CSV • Map Headers • Generate Barcodes</p>
          
          {/* Logout Button */}
          {isAuthenticated && (
            <div className="mt-4">
              <button
                onClick={handleLogout}
                className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {!isAuthenticated ? (
            <AuthForm onAuthenticated={() => setIsAuthenticated(true)} />
          ) : (
            <div className="space-y-8">
              <CSVUpload 
                onProcessingStart={() => setIsProcessing(true)}
                onProcessingComplete={(results) => {
                  setIsProcessing(false);
                  setProcessingResults(results);
                }}
              />
              
              {isProcessing && <ProcessingStatus />}
              
              {processingResults && (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                  <h3 className="text-2xl font-bold text-cyan-400 mb-4 flex items-center">
                    <CheckCircle className="w-6 h-6 mr-2" />
                    Processing Complete
                  </h3>
                  <div className="space-y-4 text-slate-300">
                    <p>✅ Successfully processed {processingResults.successCount} products</p>
                    {processingResults.errorCount > 0 && (
                      <div>
                        <p className="text-red-400 mb-3">❌ {processingResults.errorCount} errors encountered</p>
                        {processingResults.errors && processingResults.errors.length > 0 && (
                          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                            <h4 className="text-red-400 font-semibold mb-2">Error Details:</h4>
                            <div className="space-y-1 text-sm">
                              {processingResults.errors.map((error: string, index: number) => (
                                <div key={index} className="text-red-300 font-mono">
                                  {error}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
