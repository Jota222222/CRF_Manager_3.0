import React, { useState, useRef, useEffect } from 'react';
import { DraggablePlayer, Player, AuthRole } from '../types';
import { RotateCcw, Users } from 'lucide-react';

interface TacticsBoardProps {
  roster: Player[];
  authRole: AuthRole;
}

export const TacticsBoard: React.FC<TacticsBoardProps> = ({ roster, authRole }) => {
  const [tokens, setTokens] = useState<DraggablePlayer[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const [draggingTokenId, setDraggingTokenId] = useState<string | null>(null);

  // Removida a restrição isViewer para permitir que todos mexam na tática
  // const isViewer = authRole === 'viewer'; 

  const initialFormation: DraggablePlayer[] = [
    // Equipa Topo (Visitante / River Style - Branco/Vermelho)
    { id: 'v_gk', playerId: 'v_gk', x: 50, y: 8, color: 'bg-white text-red-600 border-red-600', label: 'GR' },
    { id: 'v_2', playerId: 'v_2', x: 20, y: 18, color: 'bg-white text-red-600 border-red-600', label: '2' },
    { id: 'v_3', playerId: 'v_3', x: 80, y: 18, color: 'bg-white text-red-600 border-red-600', label: '3' },
    { id: 'v_4', playerId: 'v_4', x: 35, y: 28, color: 'bg-white text-red-600 border-red-600', label: '4' },
    { id: 'v_5', playerId: 'v_5', x: 65, y: 28, color: 'bg-white text-red-600 border-red-600', label: '5' },

    // Equipa Baixo (Casa / Boca Style - Azul/Amarelo)
    { id: 'h_gk', playerId: 'h_gk', x: 50, y: 92, color: 'bg-blue-800 text-yellow-400 border-yellow-400', label: 'GR' },
    { id: 'h_2', playerId: 'h_2', x: 20, y: 82, color: 'bg-blue-800 text-yellow-400 border-yellow-400', label: '2' },
    { id: 'h_3', playerId: 'h_3', x: 80, y: 82, color: 'bg-blue-800 text-yellow-400 border-yellow-400', label: '3' },
    { id: 'h_4', playerId: 'h_4', x: 35, y: 72, color: 'bg-blue-800 text-yellow-400 border-yellow-400', label: '4' },
    { id: 'h_5', playerId: 'h_5', x: 65, y: 72, color: 'bg-blue-800 text-yellow-400 border-yellow-400', label: '5' },

    // Bola
    { id: 'ball', playerId: 'ball', x: 50, y: 50, color: 'transparent', label: '⚽' },
  ];

  // Initialize tokens
  useEffect(() => {
    if (tokens.length === 0) {
      setTokens(initialFormation);
    }
  }, []);

  const handleTokenPointerDown = (e: React.PointerEvent, id: string) => {
    // Permitir interação para todos
    e.stopPropagation();
    e.preventDefault();
    setDraggingTokenId(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleTokenPointerMove = (e: React.PointerEvent) => {
    if (!draggingTokenId || !boardRef.current) return;
    e.preventDefault();

    const rect = boardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Constrain to board
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    setTokens(prev => prev.map(t => 
      t.id === draggingTokenId ? { ...t, x: clampedX, y: clampedY } : t
    ));
  };

  const handleTokenPointerUp = (e: React.PointerEvent) => {
    setDraggingTokenId(null);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const resetBoard = () => {
     setTokens(initialFormation);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 pb-24 items-center">
      <div className="w-full flex justify-between items-center mb-4 max-w-md">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="text-blue-600"/> 
          Quadro Tático (5 vs 5)
        </h2>
        <div className="flex gap-2">
            <button 
                onClick={resetBoard}
                className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                title="Repor Posições"
            >
                <RotateCcw size={18} />
            </button>
        </div>
      </div>

      <div className="relative w-full max-w-[400px] aspect-[2/3] bg-gray-600 rounded-lg overflow-hidden shadow-2xl border-4 border-gray-800">
        
        {/* Court Markings using SVG for precision */}
        <div 
          ref={boardRef}
          className="absolute inset-0 w-full h-full relative touch-none cursor-crosshair"
          onPointerMove={handleTokenPointerMove}
          onPointerUp={handleTokenPointerUp}
          style={{
            backgroundImage: 'linear-gradient(to bottom, #6b7280, #9ca3af)'
          }}
        >
          <svg 
            width="100%" 
            height="100%" 
            viewBox="-10 -15 120 230" 
            className="absolute inset-0 pointer-events-none"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Styles */}
            <defs>
              <pattern id="goal-net" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
                <path d="M 0 0 L 3 3 M 3 0 L 0 3" stroke="white" strokeWidth="0.5" opacity="0.4"/>
                <rect width="3" height="3" fill="none" stroke="white" strokeWidth="0.2" opacity="0.2"/>
              </pattern>
            </defs>

            {/* Line settings */}
            <g stroke="white" strokeWidth="1.5" fill="none" opacity="0.9">
              
              {/* Field Boundary (Touchlines and Goal Lines) */}
              <rect x="0" y="0" width="100" height="200" />

              {/* Center Line */}
              <line x1="0" y1="100" x2="100" y2="100" />
              
              {/* Center Circle (Radius 3m ~= 15 units) */}
              <circle cx="50" cy="100" r="15" />
              <circle cx="50" cy="100" r="1" fill="white" stroke="none" />

              {/* --- TOP GOAL --- */}
              {/* Goal Net */}
              <path d="M 42.5 0 L 42.5 -5 L 57.5 -5 L 57.5 0" fill="url(#goal-net)" strokeWidth="1" />
              {/* Area (6m radius arc) */}
              <path d="M 12.5 0 A 30 30 0 0 0 42.5 30 L 57.5 30 A 30 30 0 0 0 87.5 0" />
              {/* Penalty Spot (6m) */}
              <circle cx="50" cy="30" r="1.5" fill="white" stroke="none" />
              {/* Second Penalty Spot (10m) */}
              <circle cx="50" cy="50" r="1" fill="white" stroke="none" />

              {/* --- BOTTOM GOAL --- */}
              {/* Goal Net */}
              <path d="M 42.5 200 L 42.5 205 L 57.5 205 L 57.5 200" fill="url(#goal-net)" strokeWidth="1" />
              {/* Area (6m radius arc) */}
              <path d="M 12.5 200 A 30 30 0 0 1 42.5 170 L 57.5 170 A 30 30 0 0 1 87.5 200" />
              {/* Penalty Spot (6m) */}
              <circle cx="50" cy="170" r="1.5" fill="white" stroke="none" />
              {/* Second Penalty Spot (10m) */}
              <circle cx="50" cy="150" r="1" fill="white" stroke="none" />
              
            </g>
          </svg>

          {/* Tokens */}
          {tokens.map(token => {
            const isBall = token.id === 'ball';
            return (
              <div
                key={token.id}
                onPointerDown={(e) => handleTokenPointerDown(e, token.id)}
                className={`absolute flex items-center justify-center font-bold select-none transition-transform z-10 cursor-grab active:cursor-grabbing hover:scale-110
                  ${isBall 
                    ? 'w-8 h-8 text-2xl bg-transparent' 
                    : `w-9 h-9 ${token.color} rounded-full border-2 shadow-lg text-xs`
                  }`}
                style={{
                  left: `${token.x}%`,
                  top: `${token.y}%`,
                  transform: 'translate(-50%, -50%)',
                  touchAction: 'none'
                }}
              >
                {token.label}
              </div>
            );
          })}
        </div>
      </div>
      
      <p className="text-center text-sm text-gray-500 mt-4">
        Arrasta os jogadores e a bola para definir a tática.
      </p>
    </div>
  );
};