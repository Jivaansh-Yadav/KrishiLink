import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
        <Sprout className="w-6 h-6 text-primary-foreground" />
      </div>
      <span className="font-heading font-bold text-xl text-primary">KrishiLink</span>
    </Link>
  );
};

export default Logo;
