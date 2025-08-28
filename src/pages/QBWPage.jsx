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
      qbName: 'Russell Wilson',
      date: 'March 2022',
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
          {/* Background Decorative Elements */}
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-full max-w-6xl pointer-events-none z-0 opacity-60">
            <div className="relative">
              {/* Left Shelf - Good Predictions */}
              <div className="absolute left-12 top-0 w-2/5">
                <div className="relative">
                  {/* Enhanced 3D shelf */}
                  <div className="relative h-4 bg-gradient-to-b from-amber-600/80 to-amber-800/90 rounded-lg shadow-xl border border-amber-700/60">
                    {/* Top surface */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-amber-400/90 to-amber-500/80 rounded-t-lg"></div>
                    {/* Front edge */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-b from-amber-800/90 to-amber-900/95 rounded-b-lg"></div>
                    {/* Side shadow */}
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-900/60 to-black/40 rounded-r-lg"></div>
                  </div>

                  {/* Shelf brackets */}
                  <div className="absolute -bottom-1 left-6 w-1 h-6 bg-gradient-to-r from-gray-600/70 to-gray-700/80 rounded-sm shadow-lg"></div>
                  <div className="absolute -bottom-1 right-6 w-1 h-6 bg-gradient-to-r from-gray-600/70 to-gray-700/80 rounded-sm shadow-lg"></div>

                  {/* Crystal balls on shelf */}
                  <div className="absolute -top-[45px] left-0 right-0 flex justify-center gap-3 px-4">
                    {[...successfulPredictions, ...breakoutPredictions].map(
                      (qb, index) => (
                        <div
                          key={qb.id || index}
                          className="transform hover:scale-105 transition-transform duration-200"
                          style={{
                            filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))',
                          }}
                        >
                          <CrystalBall qb={qb} size="sm" />
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Toilet - Bad Predictions */}
              <div className="absolute right-12 top-[100px] w-1/4">
                <div className="relative flex justify-center">
                  {/* Toilet Bowl - centered and larger */}
                  <div className="relative w-20 h-14 bg-gradient-to-b from-white/30 to-white/20 rounded-full border border-white/25 shadow-xl">
                    {/* Toilet water */}
                    <div className="absolute top-3 left-3 right-3 bottom-3 bg-gradient-to-b from-blue-400/30 to-blue-600/40 rounded-full"></div>
                    {/* Toilet rim highlight */}
                    <div className="absolute top-1 left-2 right-2 h-1 bg-gradient-to-b from-white/40 to-white/20 rounded-full"></div>
                  </div>

                  {/* Toilet Tank */}
                  <div className="absolute -top-8 left-2 right-2 h-10 bg-gradient-to-b from-white/35 to-white/25 rounded-t-xl border border-white/20 shadow-lg">
                    {/* Tank lid line */}
                    <div className="absolute top-6 left-2 right-2 h-px bg-white/30"></div>
                    {/* Flush handle */}
                    <div className="absolute top-3 -right-1 w-3 h-2 bg-white/40 rounded-sm shadow-md"></div>
                    {/* Tank lid bolts */}
                    <div className="absolute top-2 left-4 w-1 h-1 bg-white/50 rounded-full"></div>
                    <div className="absolute top-2 right-4 w-1 h-1 bg-white/50 rounded-full"></div>
                  </div>

                  {/* Crystal balls stacked on toilet */}
                  <div className="absolute -top-[60px] left-1/2 transform -translate-x-1/2 flex flex-col gap-1">
                    {badPredictions.map((qb, index) => (
                      <div
                        key={qb.id || index}
                        className="transform hover:scale-105 transition-transform duration-200"
                        style={{
                          filter:
                            'drop-shadow(0 2px 4px rgba(0,0,0,0.4)) grayscale(40%) brightness(70%)',
                          transform: `scale(0.7) ${index === 1 ? 'translateY(-6px)' : ''}`,
                        }}
                      >
                        <CrystalBall qb={qb} size="sm" />
                      </div>
                    ))}
                  </div>

                  {/* Toilet paper roll - enhanced */}
                  <div className="absolute -left-6 top-2 w-4 h-5 bg-white/20 rounded-full border border-white/15 shadow-md">
                    {/* Paper roll texture lines */}
                    <div className="absolute top-1 left-1 right-1 h-px bg-white/25"></div>
                    <div className="absolute top-2 left-1 right-1 h-px bg-white/20"></div>
                    <div className="absolute top-3 left-1 right-1 h-px bg-white/25"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main hero content - with proper spacing */}
          <div className="text-center mb-12 relative z-10 mt-32">
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
