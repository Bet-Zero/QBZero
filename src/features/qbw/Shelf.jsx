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
        {/* 3D Shelf with proper perspective and depth */}
        <div className="relative perspective-1000">
          {/* Shelf base - the main horizontal surface */}
          <div className="relative bg-gradient-to-b from-amber-600/90 to-amber-800/95 h-6 rounded-lg shadow-2xl border-2 border-amber-700/80 transform rotateX-5">
            {/* Top surface - where items sit */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-amber-400/95 to-amber-500/90 rounded-t-lg border-b border-amber-600/60"></div>

            {/* Front face of shelf - visible 3D edge */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-b from-amber-800/90 to-amber-900/95 rounded-b-lg"></div>

            {/* Side shadow for depth */}
            <div className="absolute right-0 top-1 bottom-1 w-1 bg-gradient-to-b from-amber-900/60 to-black/40 rounded-r-lg"></div>

            {/* Wood grain texture */}
            <div
              className="absolute inset-0 opacity-20 bg-repeat-x rounded-lg"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='20' viewBox='0 0 80 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='0.15'%3E%3Cpath d='M0 0h80v2H0V0zm0 4h80v1H0V5zm0 6h80v2H0V8zm0 6h80v1H0V14z'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            ></div>
          </div>

          {/* Shelf brackets for extra 3D realism */}
          <div className="absolute -bottom-1 left-8 w-2 h-8 bg-gradient-to-r from-gray-600/80 to-gray-700/90 rounded-sm shadow-lg transform rotateY-10"></div>
          <div className="absolute -bottom-1 right-8 w-2 h-8 bg-gradient-to-r from-gray-600/80 to-gray-700/90 rounded-sm shadow-lg transform -rotateY-10"></div>

          {/* Under-shelf shadow with perspective */}
          <div className="absolute -bottom-3 left-2 right-2 h-4 bg-gradient-to-b from-black/40 to-transparent rounded-xl blur-lg transform rotateX-3"></div>

          {/* Crystal balls positioned ON TOP of the shelf surface */}
          <div className="absolute -top-20 left-0 right-0 flex flex-wrap gap-6 justify-center px-6 z-20">
            {qbs.length > 0 ? (
              qbs.map((qb, index) => (
                <div
                  key={qb.id || index}
                  className="flex-shrink-0 relative z-30"
                >
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
      </div>
    </div>
  );
};

export default Shelf;
