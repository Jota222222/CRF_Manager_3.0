import React from 'react';
import { AppView } from '../types';
import { Settings, ClipboardList, Timer, Trophy, ClipboardCheck } from 'lucide-react';

interface NavigationProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: AppView.CONVOCATION, label: 'Convocatória', icon: ClipboardCheck },
    { id: AppView.MATCH, label: 'Jogo', icon: Timer },
    { id: AppView.TACTICS, label: 'Tática', icon: ClipboardList },
    { id: AppView.STATS, label: 'Stats', icon: Trophy },
    { id: AppView.TEAM, label: 'Gestão', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 shadow-lg z-50">
      <div className="flex justify-between items-center max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};