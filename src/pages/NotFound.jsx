import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center text-white">
      <h1 className="text-2xl">404 - Page Not Found</h1>
      <Link to="/rankings" className="text-blue-400 hover:text-blue-300">
        See the QB Rankings
      </Link>
    </div>
  );
};

export default NotFound;
