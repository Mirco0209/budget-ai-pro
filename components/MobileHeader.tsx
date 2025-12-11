import React from 'react';
import { Menu } from 'lucide-react';

interface MobileHeaderProps {
  toggleSidebar: () => void;
  title: string;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ toggleSidebar, title }) => {
  return (
    <div className="md:hidden h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
          B
        </div>
        <span className="font-bold text-lg">{title}</span>
      </div>
      <button onClick={toggleSidebar} className="p-2 text-slate-300 hover:bg-slate-800 rounded-md">
        <Menu size={24} />
      </button>
    </div>
  );
};

export default MobileHeader;