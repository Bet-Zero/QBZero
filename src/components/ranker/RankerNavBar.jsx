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

  const handleShare = async () => {
    const { url, error } = generateShareableURL(currentPath);
    if (error) {
      alert(error);
      return;
    }
    const stepName =
      steps.find((s) => s.path === currentPath)?.name || 'current step';
    try {
      await navigator.clipboard.writeText(url);
      alert(`${stepName} URL copied to clipboard!`);
    } catch {
      // Clipboard access is denied outside secure contexts and on some mobile
      // browsers; reporting success there would be a lie.
      alert(`Could not copy automatically. Here is the link:\n\n${url}`);
    }
  };

  return (
    <nav
      aria-label="Ranker progress"
      className="bg-neutral-900/95 backdrop-blur-sm border-b border-white/5 sticky top-0 z-40"
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-11">
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
                        flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium uppercase tracking-wide transition-all
                        ${
                          isActive
                            ? 'text-white bg-white/10'
                            : 'text-white/50 hover:text-white/80'
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
                    <div className="flex items-center gap-2 px-2.5 py-1 text-white/25 text-xs uppercase tracking-wide">
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
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded text-white text-xs font-medium transition-colors"
              title="Share current step"
              aria-label="Share current step"
            >
              🔗
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default RankerNavBar;
