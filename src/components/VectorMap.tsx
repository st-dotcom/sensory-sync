"use client";

import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

interface VectorPoint {
  id: number;
  filename: string;
  analysis: {
    tags: string[];
    description: string;
    dominant_color: string;
  };
  x: number;
  y: number;
}

interface VectorMapProps {
  data: VectorPoint[];
  onPointClick: (point: VectorPoint) => void;
}

const VectorMap: React.FC<VectorMapProps> = ({ data, onPointClick }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full h-[500px] glass-morphism rounded-3xl p-6 relative"
    >
      <div className="absolute top-6 left-6 z-10">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-widest">Sensory Vector Space</h3>
        <p className="text-xl font-semibold opacity-80">Embedding Analysis</p>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 80, right: 40, bottom: 40, left: 40 }}>
          <XAxis type="number" dataKey="x" hide domain={[0, 1]} />
          <YAxis type="number" dataKey="y" hide domain={[0, 1]} />
          <ZAxis type="number" range={[100, 400]} />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as VectorPoint;
                return (
                  <div className="glass-morphism p-3 rounded-xl border-none shadow-2xl">
                    <p className="text-xs font-bold text-indigo-500 mb-1">{item.filename}</p>
                    <p className="text-[10px] opacity-70 max-w-[150px]">{item.analysis.description}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter 
            name="Sensory Items" 
            data={data} 
            onClick={(e) => onPointClick(e.payload)}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.analysis.dominant_color || '#6366f1'} 
                className="cursor-pointer transition-all hover:opacity-100 opacity-60"
                style={{ filter: 'blur(1px)' }}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default VectorMap;
