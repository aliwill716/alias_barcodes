'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, MapPin, Play, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

interface CSVUploadProps {
  onProcessingStart: () => void;
  onProcessingComplete: (results: any) => void;
}

interface CSVRow {
  [key: string]: string;
}

interface HeaderMapping {
  sku: string;
  caseBarcode: string;
  caseQuantity: string;
}

export default function CSVUpload({ onProcessingStart, onProcessingComplete }: CSVUploadProps) {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [headerMapping, setHeaderMapping] = useState<HeaderMapping>({
    sku: '',
    caseBarcode: '',
    caseQuantity: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const parseFile = useCallback((file: File) => {

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('Error parsing CSV: ' + results.errors[0].message);
          return;
        }

        const data = results.data as CSVRow[];
        const csvHeaders = Object.keys(data[0] || {});
        
        setCsvData(data);
        setHeaders(csvHeaders);
        setError('');
        
        // Auto-map common header names
        const autoMapping: HeaderMapping = {
          sku: '',
          caseBarcode: '',
          caseQuantity: ''
        };

        csvHeaders.forEach(header => {
          const lowerHeader = header.toLowerCase();
          if (lowerHeader.includes('sku') || lowerHeader.includes('product')) {
            autoMapping.sku = header;
          } else if (lowerHeader.includes('barcode') || lowerHeader.includes('case_barcode')) {
            autoMapping.caseBarcode = header;
          } else if (lowerHeader.includes('quantity') || lowerHeader.includes('qty') || lowerHeader.includes('case_quantity')) {
            autoMapping.caseQuantity = header;
          }
        });

        setHeaderMapping(autoMapping);
      },
      error: (error) => {
        setError('Error reading file: ' + error.message);
      }
    });
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    parseFile(file);
  }, [parseFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      parseFile(files[0]);
    }
  }, [parseFile]);

  const handleProcess = async () => {
    if (!csvData.length) {
      setError('Please upload a CSV file first');
      return;
    }

    if (!headerMapping.sku || !headerMapping.caseBarcode || !headerMapping.caseQuantity) {
      setError('Please map all required fields');
      return;
    }

    setIsProcessing(true);
    onProcessingStart();
    setError('');

    try {
      const accessToken = localStorage.getItem('shiphero_access_token');
      if (!accessToken) {
        throw new Error('No access token found. Please authenticate first.');
      }

            const accountId = localStorage.getItem('shiphero_account_id');
            
            const response = await fetch('/api/process-csv', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                data: csvData,
                mapping: headerMapping,
                accountId: accountId || undefined
              }),
            });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Processing failed');
      }

      const results = await response.json();
      onProcessingComplete(results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Processing failed';
      setError(errorMessage);
      onProcessingComplete({ 
        successCount: 0, 
        errorCount: csvData.length,
        errors: [`General error: ${errorMessage}`]
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isMappingComplete = headerMapping.sku && headerMapping.caseBarcode && headerMapping.caseQuantity;

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center">
          <Upload className="w-6 h-6 mr-2" />
          Upload CSV File
        </h3>
        
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver 
              ? 'border-cyan-400 bg-cyan-400/10' 
              : 'border-slate-600 hover:border-cyan-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="cursor-pointer flex flex-col items-center space-y-4"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg blur opacity-75"></div>
              <div className="relative bg-slate-800 p-4 rounded-lg">
                <FileText className="w-12 h-12 text-cyan-400" />
              </div>
            </div>
            <div>
              <p className="text-lg font-medium text-slate-300">Click to upload CSV</p>
              <p className="text-sm text-slate-400">or drag and drop your file here</p>
            </div>
          </label>
        </div>

        {csvData.length > 0 && (
          <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
            <p className="text-slate-300">
              ✅ Loaded {csvData.length} rows from CSV file
            </p>
          </div>
        )}
      </div>

      {/* Header Mapping */}
      {headers.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center">
            <MapPin className="w-6 h-6 mr-2" />
            Map CSV Headers
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                SKU Field *
              </label>
              <select
                value={headerMapping.sku}
                onChange={(e) => setHeaderMapping(prev => ({ ...prev, sku: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              >
                <option value="">Select SKU field</option>
                {headers.map(header => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Case Barcode Field *
              </label>
              <select
                value={headerMapping.caseBarcode}
                onChange={(e) => setHeaderMapping(prev => ({ ...prev, caseBarcode: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              >
                <option value="">Select case barcode field</option>
                {headers.map(header => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Case Quantity Field *
              </label>
              <select
                value={headerMapping.caseQuantity}
                onChange={(e) => setHeaderMapping(prev => ({ ...prev, caseQuantity: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              >
                <option value="">Select case quantity field</option>
                {headers.map(header => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
          <span className="text-red-300">{error}</span>
        </div>
      )}

      {/* Process Button */}
      {csvData.length > 0 && (
        <div className="text-center">
          <button
            onClick={handleProcess}
            disabled={!isMappingComplete || isProcessing}
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 mx-auto"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Process {csvData.length} Products</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
