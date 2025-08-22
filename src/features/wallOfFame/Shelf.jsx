import React from 'react';
import CrystalBall from './CrystalBall';

const Shelf = ({ title, qbs = [], className = '' }) => {
  return (
    <div className={`mb-8 ${className}`}>
      {/* Shelf Title */}
      {title && (
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white/90 mb-1">{title}</h3>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
        </div>
      )}
      
      {/* Shelf Structure */}
      <div className="relative">
        {/* Shelf Surface */}
        <div className="relative bg-gradient-to-b from-amber-900/40 to-amber-800/60 border border-amber-700/50 rounded-lg shadow-2xl overflow-hidden">
          {/* Wood grain effect */}
          <div className="absolute inset-0 opacity-20 bg-repeat-x" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='20' viewBox='0 0 60 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Cpath d='M0 0h60v20H0V0zm30 2c8.84 0 16 3.58 16 8s-7.16 8-16 8-16-3.58-16-8 7.16-8 16-8z'/%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
          
          {/* Crystal balls on shelf */}
          <div className="relative p-6 flex flex-wrap gap-6 justify-center items-end min-h-[140px]">
            {qbs.length > 0 ? (
              qbs.map((qb, index) => (
                <div key={qb.id || index} className="flex-shrink-0">
                  <CrystalBall qb={qb} size="md" />
                </div>
              ))
            ) : (
              <div className="text-white/40 text-center py-8">
                <div className="text-4xl mb-2">🔮</div>
                <div className="text-sm">No predictions yet</div>
              </div>
            )}
          </div>
        </div>
        
        {/* Shelf Edge/Shadow */}
        <div className="absolute -bottom-2 left-2 right-2 h-3 bg-gradient-to-b from-amber-800/30 to-transparent rounded-b-lg blur-sm"></div>
      </div>
    </div>
  );
};

export default Shelf;