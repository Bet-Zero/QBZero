import React from 'react';
import { Link } from 'react-router-dom';
import { TrophyIcon, FireIcon } from '@heroicons/react/24/outline';

const BackupQBsHome = () => {
  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">
            Backup QBs
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Dedicated to the unsung heroes of the NFL - the backup quarterbacks who may never be full-time starters, 
            but are legends in their own right. Here's where they get the recognition they deserve.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Tournament Card */}
          <Link 
            to="/backup-qbs/tournament" 
            className="group block p-8 bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-xl border border-white/10 hover:border-white/30 transition-all transform hover:scale-105 hover:shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-600/20 rounded-lg group-hover:bg-blue-600/30 transition-colors">
                <TrophyIcon className="h-8 w-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold">Backup QB Tournament</h2>
            </div>
            <p className="text-white/70 text-lg leading-relaxed mb-4">
              Create a randomized tournament bracket with backup QBs and vote your way to crowning 
              the ultimate backup quarterback. Seed randomly, then battle through head-to-head matchups!
            </p>
            <div className="flex items-center text-blue-400 font-semibold group-hover:text-blue-300">
              Start Tournament
              <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Hall of Fame Card */}
          <Link 
            to="/backup-qbs/hall-of-fame" 
            className="group block p-8 bg-gradient-to-br from-orange-900/50 to-red-900/50 rounded-xl border border-white/10 hover:border-white/30 transition-all transform hover:scale-105 hover:shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-orange-600/20 rounded-lg group-hover:bg-orange-600/30 transition-colors">
                <FireIcon className="h-8 w-8 text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold">Backup QB Hall of Fame</h2>
            </div>
            <p className="text-white/70 text-lg leading-relaxed mb-4">
              Honor the legendary backup quarterbacks who made their mark on the NFL. 
              From clutch playoff performances to veteran leadership - these QBs earned their place in backup history.
            </p>
            <div className="flex items-center text-orange-400 font-semibold group-hover:text-orange-300">
              View Hall of Fame
              <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* About Section */}
        <div className="bg-neutral-800/50 rounded-xl p-8 border border-white/10">
          <h3 className="text-2xl font-bold mb-4 text-center">Why Backup QBs Matter</h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl mb-2">🎯</div>
              <h4 className="font-semibold mb-2">Ready When Called</h4>
              <p className="text-white/70 text-sm">
                Backup QBs must stay prepared to step in at any moment and lead the team.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">🧠</div>
              <h4 className="font-semibold mb-2">Football IQ</h4>
              <p className="text-white/70 text-sm">
                Often the smartest players on the field, they serve as coaches on the sideline.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">❤️</div>
              <h4 className="font-semibold mb-2">Team Chemistry</h4>
              <p className="text-white/70 text-sm">
                Great backups keep the locker room together and provide veteran leadership.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupQBsHome;