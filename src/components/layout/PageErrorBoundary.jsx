import React from 'react';

/**
 * Catches a page that throws while rendering, or whose file still fails to
 * load after lazyPage's one reload, so the failure stays inside the page area.
 * Without it React unmounts the whole tree and the visitor gets a blank screen
 * with no header to navigate away from.
 *
 * SiteLayout keys this on the path, so moving to another page clears the error.
 */
class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Page crashed:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-[50vh] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-white mb-2">
            This page hit a problem
          </h2>
          <p className="text-white/60 text-sm mb-6">
            Something went wrong while showing it. Reloading usually fixes it,
            or pick another page from the menu.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

export default PageErrorBoundary;
