import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, StarIcon } from '@heroicons/react/24/outline';
import { BACKUP_QB_HALL_OF_FAME } from '@/utils/backupQBs/backupQBClassification';

const BackupQBHallOfFame = () => {
  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/backup-qbs" 
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">
              Backup QB Hall of Fame
            </h1>
            <p className="text-white/70 mt-2">
              Honoring the legendary backup quarterbacks who made their mark on NFL history
            </p>
          </div>
        </div>

        {/* Hall of Fame Introduction */}
        <div className="mb-12 text-center">
          <div className="inline-block p-8 bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-xl border border-orange-500/30">
            <div className="text-6xl mb-4">🏛️</div>
            <h2 className="text-2xl font-bold mb-4">Welcome to the Hall of Fame</h2>
            <p className="text-white/80 max-w-2xl leading-relaxed">
              These quarterbacks may not have been full-time starters, but they've earned their place in backup QB lore 
              through clutch performances, veteran leadership, and unforgettable moments when their teams needed them most.
            </p>
          </div>
        </div>

        {/* Hall of Fame Members */}
        <div className="space-y-8">
          {BACKUP_QB_HALL_OF_FAME.map((qb, index) => (
            <div key={qb.id} className="group">
              <div className="bg-gradient-to-r from-neutral-800/50 to-neutral-700/50 rounded-xl border border-white/10 hover:border-orange-500/30 transition-all p-8">
                <div className="flex items-start gap-6">
                  {/* Player Image Placeholder */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 bg-neutral-700 rounded-full flex items-center justify-center border-2 border-orange-500/30">
                      <img
                        src={`/assets/headshots/${qb.id}.png`}
                        alt={qb.name}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-orange-400" style={{display: 'none'}}>
                        {qb.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    </div>
                  </div>

                  {/* Player Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold">{qb.name}</h3>
                      <span className="px-3 py-1 bg-orange-600/20 text-orange-400 rounded-full text-sm font-medium">
                        {qb.team}
                      </span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>

                    <p className="text-white/80 text-lg mb-4 leading-relaxed">
                      {qb.blurb}
                    </p>

                    {/* Accomplishments */}
                    <div>
                      <h4 className="text-lg font-semibold mb-3 text-orange-400">Career Highlights</h4>
                      <div className="grid md:grid-cols-2 gap-2">
                        {qb.accomplishments.map((accomplishment, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0"></div>
                            <span className="text-white/70">{accomplishment}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Hall of Fame Badge */}
                  <div className="flex-shrink-0">
                    <div className="text-center">
                      <div className="text-3xl mb-1">🏆</div>
                      <div className="text-xs text-orange-400 font-medium">HOF</div>
                      <div className="text-xs text-white/60">#{index + 1}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Coming Soon Section */}
        <div className="mt-12 text-center">
          <div className="inline-block p-6 bg-neutral-800/50 rounded-xl border border-white/10">
            <h3 className="text-xl font-bold mb-2">More Legends Coming Soon</h3>
            <p className="text-white/60">
              We're constantly evaluating more backup QB legends for induction into the Hall of Fame. 
              Stay tuned for future inductees!
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-neutral-800/30 rounded-xl border border-white/10">
            <div className="text-3xl font-bold text-orange-400 mb-2">{BACKUP_QB_HALL_OF_FAME.length}</div>
            <div className="text-white/80">Hall of Famers</div>
          </div>
          <div className="text-center p-6 bg-neutral-800/30 rounded-xl border border-white/10">
            <div className="text-3xl font-bold text-orange-400 mb-2">∞</div>
            <div className="text-white/80">Clutch Moments</div>
          </div>
          <div className="text-center p-6 bg-neutral-800/30 rounded-xl border border-white/10">
            <div className="text-3xl font-bold text-orange-400 mb-2">100%</div>
            <div className="text-white/80">Legendary Status</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupQBHallOfFame;