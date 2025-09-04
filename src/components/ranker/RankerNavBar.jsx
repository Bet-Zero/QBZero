import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useRankerContext } from '@/context/RankerContext';

const RankerNavBar = () => {
  const location = useLocation();
  const {
    canNavigateToStep,
    playerPool,
    setupData,
    finalRanking,
    generateShareableURL,
  } = useRankerContext();

  const currentPath = location.pathname;

  const steps = [
    {
      path: '/ranker',
      name: 'Home',
      icon: '🏠',
      canAccess: true,
    },
    {
      path: '/ranker/setup',
      name: 'Setup',
      icon: '⚙️',
      canAccess: true,
      hasData: setupData !== null,
    },
    {
      path: '/ranker/comparisons',
      name: 'Comparisons',
      icon: '⚔️',
      canAccess: canNavigateToStep('comparisons'),
      hasData: playerPool.length > 0 && setupData,
    },
    {
      path: '/ranker/results',
      name: 'Results',
      icon: '📊',
      canAccess: canNavigateToStep('results'),
      hasData: finalRanking.length > 0,
    },
  ];

  const handleShare = () => {
    const shareUrl = generateShareableURL(currentPath);
    navigator.clipboard.writeText(shareUrl).then(() => {
      const stepName =
        steps.find((s) => s.path === currentPath)?.name || 'current step';
      alert(`${stepName} URL copied to clipboard!`);
    });
  };

  return (
    <nav className="bg-neutral-800/95 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Step Navigation */}
          <div className="flex items-center space-x-1">
            {steps.map((step, index) => {
              const isActive = currentPath === step.path;
              const isAccessible = step.canAccess;

              return (
                <React.Fragment key={step.path}>
                  {index > 0 && <span className="text-white/30 mx-2">›</span>}
                  {isAccessible ? (
                    <Link
                      to={step.path}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                        }
                      `}
                    >
                      <span className="text-base">{step.icon}</span>
                      <span className="hidden sm:inline">{step.name}</span>
                      {step.hasData && !isActive && (
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      )}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 text-white/30 text-sm">
                      <span className="text-base opacity-50">{step.icon}</span>
                      <span className="hidden sm:inline">{step.name}</span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-3 py-1.5 bg-purple-600/80 hover:bg-purple-700 rounded text-white text-sm font-medium transition-colors"
              title="Share current step"
            >
              🔗
            </button>

            <Link
              to="/ranker"
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-white text-sm font-medium transition-colors"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default RankerNavBar;
