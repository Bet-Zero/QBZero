import React from 'react';
import Shelf from '@/features/qbw/Shelf';
import TakeBoard from '@/features/qbw/TakeBoard';
import CrystalBall from '@/features/qbw/CrystalBall';

const QBWPage = () => {
  // Sample data for crystal ball QBs (successful predictions)
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
  ];

  const breakoutPredictions = [
    {
      id: '5',
      name: 'Matthew Stafford',
      imageUrl: '/assets/crystal-balls/good/Stafford.png',
      predictionText: 'Super Bowl champion',
    },
  ];

  // Bad predictions (incorrect calls)
  const badPredictions = [
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

  // Sample data for takes/predictions
  const takes = [
    {
      id: '1',
      title: 'Josh Allen will be a top 3 QB',
      description:
        'Called his rise to elite status before his breakout 2020 season',
      qbName: 'Josh Allen',
      date: 'Draft Day 2018',
      proofDate: '2020 Season',
      status: 'correct',
    },
    {
      id: '2',
      title: 'Justin Herbert OROY',
      description:
        'Predicted he would win Offensive Rookie of the Year over Tua',
      qbName: 'Justin Herbert',
      date: 'Week 2 2020',
      proofDate: 'Feb 2021',
      status: 'correct',
    },
    {
      id: '3',
      title: 'Joe Burrow leads Bengals to Super Bowl',
      description: 'Predicted championship run in his second season',
      qbName: 'Joe Burrow',
      date: '2021 Draft',
      proofDate: 'Feb 2022',
      status: 'correct',
    },
    {
      id: '4',
      title: 'Lamar Jackson 40+ passing TDs',
      description: 'Predicted he would develop into elite passer',
      qbName: 'Lamar Jackson',
      date: '2019 Offseason',
      proofDate: '2019 Season',
      status: 'correct',
    },
    {
      id: '5',
      title: 'Mac Jones will struggle without McDaniels',
      description: 'Predicted his regression when OC left',
      qbName: 'Mac Jones',
      date: 'Jan 2022',
      status: 'wrong',
    },
    {
      id: '8',
      title: 'Anthony Richardson will win OROY',
      description: 'Bold prediction for the rookie season',
      qbName: 'Anthony Richardson',
      date: '2023 Draft',
      status: 'pending',
    },
    {
      id: '9',
      title: 'Caleb Williams 35+ TD passes rookie year',
      description: 'High expectations for the #1 pick',
      qbName: 'Caleb Williams',
      date: '2024 Draft',
      status: 'pending',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-neutral-900 border-b border-white/10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Background Wall Decorations - Room Perspective */}
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-full max-w-7xl pointer-events-none z-0 opacity-15">
            <div className="relative">
              {/* Left Wall Shelf - Good Predictions */}
              <div className="absolute left-4 top-8 w-1/3 transform rotate-y-3d perspective-wall">
                <div className="relative">
                  {/* Wall-mounted shelf with depth */}
                  <div className="relative h-2 bg-gradient-to-r from-amber-700/30 to-amber-900/40 rounded-sm shadow-2xl transform skew-y-1">
                    {/* Wall shadow to create depth */}
                    <div className="absolute -bottom-2 -right-2 left-2 h-2 bg-black/20 rounded-sm -z-10 blur-sm"></div>
                    <div className="absolute top-0 left-0 right-0 h-px bg-amber-500/25"></div>
                  </div>

                  {/* Minimal wall brackets */}
                  <div className="absolute -bottom-1 left-2 w-0.5 h-3 bg-gray-600/30 rounded-full"></div>
                  <div className="absolute -bottom-1 right-2 w-0.5 h-3 bg-gray-600/30 rounded-full"></div>

                  {/* Crystal balls on shelf - very subtle */}
                  <div className="absolute -top-[30px] left-0 right-0 flex justify-center gap-1 px-2">
                    {[...successfulPredictions, ...breakoutPredictions].slice(0, 4).map(
                      (qb, index) => (
                        <div
                          key={qb.id || index}
                          className="transform scale-50"
                          style={{
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2)) brightness(0.7) blur(0.5px)',
                          }}
                        >
                          <CrystalBall qb={qb} size="sm" />
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Right Wall Display - Simple and Clean */}
              <div className="absolute right-4 top-12 w-1/4 transform rotate-y-3d-reverse perspective-wall">
                <div className="relative">
                  {/* Simple wall mounted display for bad predictions */}
                  <div className="relative h-1.5 bg-gradient-to-r from-gray-600/20 to-gray-800/30 rounded-sm shadow-lg transform skew-y-1">
                    <div className="absolute -bottom-1 -right-1 left-1 h-1.5 bg-black/15 rounded-sm -z-10 blur-sm"></div>
                  </div>

                  {/* Bad predictions - very subtle and small */}
                  <div className="absolute -top-[25px] left-1/2 transform -translate-x-1/2 flex gap-0.5">
                    {badPredictions.slice(0, 2).map((qb, index) => (
                      <div
                        key={qb.id || index}
                        className="transform scale-40"
                        style={{
                          filter:
                            'drop-shadow(0 1px 1px rgba(0,0,0,0.1)) grayscale(70%) brightness(50%) blur(0.5px)',
                        }}
                      >
                        <CrystalBall qb={qb} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optional: Subtle wall texture/lines to enhance room feeling */}
              <div className="absolute left-0 top-0 w-full h-32 opacity-5">
                <div className="absolute left-8 top-16 w-0.5 h-16 bg-white/20 transform rotate-12"></div>
                <div className="absolute right-8 top-20 w-0.5 h-12 bg-white/20 transform -rotate-12"></div>
              </div>
            </div>
          </div>

          {/* Main hero content - with proper spacing from background */}
          <div className="text-center mb-12 relative z-10 mt-24">
            <div className="text-8xl mb-4">🔮</div>
            <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              QBW
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              My crystal ball QB predictions and hot takes that stood the test
              of time
            </p>
          </div>

          {/* Stats row */}
          <div className="flex justify-center items-center gap-8 text-white/50 relative z-10">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {takes.filter((t) => t.status === 'correct').length}
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
                {Math.round(
                  (takes.filter((t) => t.status === 'correct').length /
                    takes.filter((t) => t.status !== 'pending').length) *
                    100
                )}
                %
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
            <p className="text-white/60 max-w-2xl mx-auto">
              Quarterbacks I had strong predictions about that came true. Each
              crystal ball represents a successful call.
            </p>
          </div>

          <div className="space-y-8">
            <Shelf title="Elite Tier Predictions" qbs={successfulPredictions} />

            <Shelf title="Breakout Star Calls" qbs={breakoutPredictions} />
          </div>
        </section>

        {/* Take Board */}
        <section>
          <TakeBoard takes={takes} />
        </section>
      </div>
    </div>
  );
};

export default QBWPage;
