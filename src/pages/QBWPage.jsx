import React from 'react';
import Shelf from '@/features/qbw/Shelf';
import TakeBoard from '@/features/qbw/TakeBoard';
import useTakes from '@/features/qbw/useTakes';
import { takeStats } from '@/utils/qbw/takes';

const QBWPage = () => {
  const { takes, loading, reload } = useTakes();
  const stats = takeStats(takes);

  // Sample data for crystal ball QBs (successful predictions)
  // All 5 good crystal balls go to Elite Tier Predictions
  const successfulPredictions = [
    {
      id: '1',
      name: 'Baker Mayfield',
      imageUrl: '/assets/crystal-balls/good/Baker.png',
      predictionText: 'Comeback Player of the Year',
    },
    {
      id: '2',
      name: 'Sam Darnold',
      imageUrl: '/assets/crystal-balls/good/Darnold.png',
      predictionText: 'Breakout season in Minnesota',
    },
    {
      id: '3',
      name: 'Geno Smith',
      imageUrl: '/assets/crystal-balls/good/Geno.png',
      predictionText: 'Veteran resurgence',
    },
    {
      id: '4',
      name: 'Jared Goff',
      imageUrl: '/assets/crystal-balls/good/Goff.png',
      predictionText: 'Elite',
    },
    {
      id: '5',
      name: 'Matthew Stafford',
      imageUrl: '/assets/crystal-balls/good/Stafford.png',
      predictionText: 'Super Bowl champion',
    },
  ];

  // Bad predictions as placeholders for Breakout Star Calls
  const breakoutPredictions = [
    {
      id: '6',
      name: 'Kirk Cousins',
      imageUrl: '/assets/crystal-balls/bad/Cousins.png',
      predictionText: 'Playoff breakthrough',
    },
    {
      id: '7',
      name: 'Russell Wilson',
      imageUrl: '/assets/crystal-balls/bad/Russ.png',
      predictionText: 'MVP season in Denver',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-neutral-900 border-b border-white/10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Main hero content */}
          <div className="text-center mb-12 relative z-10">
            <div className="text-8xl mb-4">🔮</div>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              My crystal ball QB predictions and takes that stood the test of
              time
            </p>
          </div>

          {/* Stats row */}
          <div className="flex justify-center items-center gap-8 text-white/50 relative z-10">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {loading ? '–' : stats.correct}
              </div>
              <div className="text-sm">Correct Takes</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {successfulPredictions.length + breakoutPredictions.length}
              </div>
              <div className="text-sm">Crystal Ball QBs</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">
                {loading || stats.accuracy === null
                  ? '–'
                  : `${stats.accuracy}%`}
              </div>
              <div className="text-sm">Accuracy Rate</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Crystal Ball Collection */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white/90 mb-4">
              🔮 Crystal Ball Collection
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto mb-20">
              Quarterbacks I had strong predictions about that came true. Each
              crystal ball represents a successful call.
            </p>
          </div>

          <div className="space-y-20">
            <Shelf title="The Whisperer" qbs={successfulPredictions} />

            <Shelf title="Told You He's Garbage" qbs={breakoutPredictions} />
          </div>
        </section>
      </div>

      {/* Take Board Section with distinct background */}
      <div className="bg-gradient-to-b from-neutral-900 via-[#141429] to-[#1a1a2e] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <section>
            <TakeBoard takes={takes} loading={loading} onChanged={reload} />
          </section>
        </div>
      </div>
    </div>
  );
};

export default QBWPage;
