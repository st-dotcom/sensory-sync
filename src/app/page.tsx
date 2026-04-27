"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UploadZone from '@/components/UploadZone';
import VectorMap from '@/components/VectorMap';
import { Sparkles, Loader2, Info } from 'lucide-react';

export default function SensorySyncPage() {
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'training' | 'completed'>('idle');
  const [data, setData] = useState<any[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<any | null>(null);

  const startAnalysis = async (files: File[]) => {
    setStatus('analyzing');
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      // Step 1: Gemini Analysis
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      const analyzedData = await res.json();
      
      // Step 2: SupCon Training
      setStatus('training');
      const trainRes = await fetch('/api/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analyzedData),
      });
      const finalData = await trainRes.json();
      
      setData(finalData);
      setStatus('completed');
    } catch (error) {
      console.error(error);
      setStatus('idle');
      alert('Analysis failed. Please check your API key.');
    }
  };

  return (
    <main className="min-h-screen bg-dot-pattern p-8 md:p-24 overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-16">
        
        {/* Header */}
        <header className="flex flex-col items-center text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200"
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.div>
          <h1 className="text-5xl font-black tracking-tight">
            Sensory<span className="sensory-gradient">Sync</span>
          </h1>
          <p className="text-gray-500 max-w-lg">
            Geminiによる画像解析と、教師あり対照学習（SupCon）によるベクトル空間の構築。
            画像の感性を同期し、新たなインスピレーションを発見。
          </p>
        </header>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 space-y-8">
            <UploadZone 
              onFilesSelected={startAnalysis} 
              isLoading={status === 'analyzing' || status === 'training'} 
            />
            
            {/* Status Indicator */}
            <AnimatePresence>
              {status !== 'idle' && status !== 'completed' && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass-morphism p-6 rounded-3xl flex items-center space-x-4"
                >
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                  <div>
                    <p className="font-bold">
                      {status === 'analyzing' ? 'Gemini Analyzing...' : 'SupCon Training...'}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {status === 'analyzing' ? 'Extracting features from pixels.' : 'Refining vector space labels.'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected Detail */}
            <AnimatePresence>
              {selectedPoint && (
                <motion.div 
                  key={selectedPoint.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-morphism p-8 rounded-[40px] space-y-6 relative border-t-[8px]"
                  style={{ borderTopColor: selectedPoint.analysis.dominant_color }}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-xl font-bold">{selectedPoint.filename}</h4>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Analyzed
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {selectedPoint.analysis.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPoint.analysis.tags.map((tag: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-semibold">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-7">
            {data.length > 0 ? (
              <VectorMap data={data} onPointClick={setSelectedPoint} />
            ) : (
              <div className="w-full h-[500px] bg-gray-50 rounded-[40px] border-2 border-dashed flex flex-col items-center justify-center text-gray-300 space-y-4">
                <Info className="w-12 h-12" />
                <p>Upload images to see the sensory map</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer Decoration */}
      <div className="fixed bottom-0 left-0 w-full h-1 sensory-gradient opacity-30" />
    </main>
  );
}
