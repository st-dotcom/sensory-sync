"use client";

import React, { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  isLoading: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onFilesSelected, isLoading }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  }, []);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSync = () => {
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-3xl p-12 transition-all duration-300
          flex flex-col items-center justify-center text-center
          ${isDragActive ? 'border-indigo-500 bg-indigo-50/10' : 'border-gray-200'}
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
          <Upload className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Drop your sensory triggers</h2>
        <p className="text-gray-500 mb-8 max-w-xs">Upload images to analyze their sensory essence and map them in vector space.</p>
        
        <input 
          type="file" 
          multiple 
          accept="image/*"
          className="absolute inset-0 opacity-0 cursor-pointer" 
          onChange={(e) => {
            if (e.target.files) {
              const files = Array.from(e.target.files);
              setSelectedFiles(prev => [...prev, ...files]);
            }
          }}
        />
      </div>

      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {selectedFiles.map((file, i) => (
              <div key={i} className="group relative glass-morphism p-2 rounded-2xl">
                <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                   <ImageIcon className="w-6 h-6 text-gray-300" />
                </div>
                <p className="mt-2 text-[10px] truncate px-1">{file.name}</p>
                <button 
                  onClick={() => removeFile(i)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {selectedFiles.length > 0 && (
        <button 
          onClick={handleSync}
          disabled={isLoading}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
        >
          {isLoading ? 'Analyzing Essence...' : 'Sync Sensory Space'}
        </button>
      )}
    </div>
  );
};

export default UploadZone;
