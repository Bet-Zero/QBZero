import React from 'react';

// Inside SiteLayout, which already fills the screen and paints the background;
// min-h-screen here made the page scroll by the header's height.
const Home = () => (
  <div className="flex flex-col items-center px-6 pt-16 sm:pt-20 pb-12 text-center text-white">
    <div className="text-[6rem] sm:text-[8rem] leading-none mb-6">🤫</div>
    <h1 className="text-3xl sm:text-4xl font-bold mb-4">Welcome to QBZero</h1>
    <p className="text-lg text-white/70">Coming soon...🔮</p>
  </div>
);

export default Home;
