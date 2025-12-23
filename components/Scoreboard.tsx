import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCw, Plus, Minus, X, CheckCircle, AlertTriangle, User, SkipForward, Undo2, ChevronUp, ChevronDown } from 'lucide-react';
import { Player, TeamType, GameEvent, TeamNames, KitsState, AuthRole } from '../types';

interface ScoreboardProps {
  players: Player[];
  assignments: Record<string, TeamType>;
  onFinishGame: () => void;
  teamNames: TeamNames;
  kits: KitsState;
  swapKits: boolean;
  // Lifted State Props
  gameTime: number;
  isGameActive: boolean;
  setIsGameActive: React.Dispatch<React.SetStateAction<boolean>>;
  events: GameEvent[];
  setEvents: React.Dispatch<React.SetStateAction<GameEvent[]>>;
  authRole: AuthRole;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ 
    players, 
    assignments, 
    onFinishGame,
    teamNames,
    kits,
    swapKits,
    gameTime,
    isGameActive,
    setIsGameActive,
    events,
    setEvents,
    authRole
}) => {
  const [subTimeLeft, setSubTimeLeft] = useState(6 * 60);
  const [showSubAlert, setShowSubAlert] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  
  const isViewer = authRole === 'viewer';

  // Modal State
  const [showGoalModal, setShowGoalModal] = useState<TeamType | null>(null);
  const [modalStep, setModalStep] = useState<'scorer' | 'assist'>('scorer');
  const [selectedScorer, setSelectedScorer] = useState<string>('');
  
  const fillKit = !swapKits ? kits.kit1 : kits.kit2;
  const gusKit = !swapKits ? kits.kit2 : kits.kit1;

  // --- AUDIO LOGIC (BUZZER) ---
  const startBuzzer = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    
    oscillatorRef.current = osc;
  };

  const stopBuzzer = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
  };

  useEffect(() => {
    if (showSubAlert) {
      startBuzzer();
    } else {
      stopBuzzer();
    }
    return () => stopBuzzer();
  }, [showSubAlert]);

  // --- SUB TIMER LOGIC ---
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isGameActive) {
      interval = setInterval(() => {
        if (!showSubAlert) {
           setSubTimeLeft(prev => {
              if (prev <= 1) {
                  setShowSubAlert(true);
                  return 0;
              }
              return prev - 1;
           });
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGameActive, showSubAlert]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubOk = () => {
      setShowSubAlert(false);
      setSubTimeLeft(6 * 60); 
  };

  const handleUndo = () => {
      if (events.length === 0) return;
      if (window.confirm("Eliminar o último golo?")) {
          setEvents(prev => prev.slice(1));
      }
  };

  const openGoalModal = (team: TeamType) => {
    if (isViewer) return;
    setShowGoalModal(team);
    setModalStep('scorer');
    setSelectedScorer('');
  };

  const selectScorer = (playerId: string) => {
    setSelectedScorer(playerId);
    setModalStep('assist');
  };

  const finalizeGoal = (assisterId?: string) => {
    if (!showGoalModal || !selectedScorer) return;

    const scorer = players.find(p => p.id === selectedScorer);
    const assister = players.find(p => p.id === assisterId);

    if (scorer) {
        const newEvent: GameEvent = {
            id: Date.now().toString(),
            type: 'goal',
            time: formatTime(gameTime),
            team: showGoalModal,
            scorerId: scorer.id,
            scorerName: scorer.name,
            assisterId: assister?.id,
            assisterName: assister?.name
        };
        setEvents(prev => [newEvent, ...prev]);
    }
    setShowGoalModal(null);
  };

  const getTeamRoster = (team: TeamType) => {
      return players.filter(p => assignments[p.id] === team).sort((a,b) => a.number - b.number);
  };

  const scoreFill = events.filter(e => e.team === 'fill').length;
  const scoreGus = events.filter(e => e.team === 'gus').length;
  const fillCount = Object.values(assignments).filter(t => t === 'fill').length;
  const gusCount = Object.values(assignments).filter(t => t === 'gus').length;

  if (fillCount < 5 || gusCount < 5) {
      return (
        <div className="flex flex-col items-center justify-center h-[70vh] p-6 text-center animate-fade-in-up">
            <div className="bg-yellow-100 p-6 rounded-full mb-6">
                <AlertTriangle size={48} className="text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Impossível Iniciar</h2>
            <p className="text-gray-600 mb-8 max-w-xs">
                Para começar o jogo, precisas de pelo menos <b>5 jogadores</b> em cada equipa.
            </p>
        </div>
      );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24 relative select-none">
      
      {showSubAlert && (
         <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black animate-flash-alert cursor-pointer" onClick={handleSubOk}>
            <style>{`
                @keyframes flash {
                    0%, 100% { background-color: #000; color: #fff; }
                    50% { background-color: #fff; color: #000; }
                }
                .animate-flash-alert {
                    animation: flash 0.2s infinite;
                }
            `}</style>
            <AlertTriangle size={140} className="mb-8" />
            <h1 className="text-8xl font-black tracking-widest uppercase">TROCA!</h1>
            <button 
                onClick={(e) => { e.stopPropagation(); handleSubOk(); }}
                className="mt-12 px-12 py-6 bg-red-600 text-white text-3xl font-bold rounded-2xl shadow-2xl border-4 border-white active:scale-95 transition-transform"
            >
                OK
            </button>
         </div>
      )}

      <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-xl text-center relative overflow-hidden">
        <div className="flex justify-center items-center mb-2">
            <div className="text-xs text-gray-400 uppercase tracking-widest">Tempo Decorrido</div>
        </div>
        
        <div className="text-6xl font-mono font-bold tracking-wider mb-4 text-green-400">
          {formatTime(gameTime)}
        </div>
        
        <div className="absolute top-14 right-4 text-right">
             <div className="text-[10px] text-gray-400 uppercase">Prox. Troca</div>
             <div className={`text-xl font-mono font-bold ${subTimeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-gray-300'}`}>
                {formatTime(subTimeLeft)}
             </div>
        </div>

        {!isViewer && (
            <div className="flex gap-3 mt-6">
            <button
                type="button"
                onClick={() => setIsGameActive(!isGameActive)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-xl font-bold transition shadow-lg active:scale-95 ${
                isGameActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'
                }`}
            >
                {isGameActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                {isGameActive ? "PAUSA" : "INICIAR"}
            </button>
            
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onFinishGame();
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-lg active:scale-95 border-2 border-blue-400"
            >
                <CheckCircle size={24} /> FIM DE JOGO
            </button>
            </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div 
            className="p-4 rounded-2xl shadow-md border-t-4 relative"
            style={{ 
                backgroundColor: fillKit.primaryColor, 
                color: fillKit.secondaryColor, 
                borderColor: fillKit.secondaryColor 
            }}
        >
          <h3 className="text-center font-bold text-sm uppercase mb-2 opacity-80">
             {teamNames.fill}
          </h3>
          <div className="text-6xl font-black text-center mb-4">
            {scoreFill}
          </div>
          {!isViewer && (
            <button 
                onClick={() => openGoalModal('fill')}
                disabled={!isGameActive}
                className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg brightness-110 hover:brightness-125 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                    backgroundColor: fillKit.secondaryColor, 
                    color: fillKit.primaryColor
                }}
            >
                <Plus size={20} strokeWidth={3}/> GOLO
            </button>
          )}
        </div>

        <div 
            className="p-4 rounded-2xl shadow-md border-t-4 relative"
            style={{ 
                backgroundColor: gusKit.primaryColor, 
                color: gusKit.secondaryColor, 
                borderColor: gusKit.secondaryColor 
            }}
        >
          <h3 className="text-center font-bold text-sm uppercase mb-2 opacity-80">
             {teamNames.gus}
          </h3>
          <div className="text-6xl font-black text-center mb-4">
            {scoreGus}
          </div>
          {!isViewer && (
            <button 
                onClick={() => openGoalModal('gus')}
                disabled={!isGameActive}
                className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg brightness-110 hover:brightness-125 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                    backgroundColor: gusKit.secondaryColor, 
                    color: gusKit.primaryColor
                }}
            >
                <Plus size={20} strokeWidth={3}/> GOLO
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex justify-between items-center mb-3">
             <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Ficha de Jogo (Ao Vivo)</h4>
             {events.length > 0 && !isViewer && (
                 <button onClick={handleUndo} className="flex items-center gap-1 text-xs text-red-400 underline font-semibold hover:text-red-600">
                    <Undo2 size={12}/> Desfazer último
                 </button>
             )}
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
            {events.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-xs uppercase tracking-wider">
                    O jogo ainda não tem golos
                </div>
            ) : (
                events.map(event => (
                    <div key={event.id} className="flex items-center gap-3 text-sm p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="font-mono font-bold text-gray-400 text-xs min-w-[3rem]">{event.time}</span>
                        <div 
                            className="w-1.5 h-8 rounded-full"
                            style={{ backgroundColor: event.team === 'fill' ? fillKit.secondaryColor : gusKit.secondaryColor }}
                        ></div>
                        <div className="flex-1">
                            <div className="font-bold text-gray-800 flex items-center gap-2 text-base">
                                <span>⚽</span> {event.scorerName}
                            </div>
                            {event.assisterName && (
                                <div className="text-gray-500 text-xs flex items-center gap-2 mt-0.5">
                                    <span>👟</span> {event.assisterName}
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      {showGoalModal && !isViewer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div 
                    className="p-4 text-center relative overflow-hidden shrink-0"
                    style={{
                        background: showGoalModal === 'fill' 
                            ? `linear-gradient(to right, ${fillKit.primaryColor}, ${fillKit.secondaryColor})`
                            : `linear-gradient(to right, ${gusKit.primaryColor}, ${gusKit.secondaryColor})`
                    }}
                >
                     <div className="absolute top-0 left-0 w-full h-full bg-white opacity-10 skew-y-12 transform origin-bottom-left"></div>
                     <div className="relative z-10">
                        <h2 className="text-white text-2xl font-black uppercase tracking-tight italic drop-shadow-md">
                            Golo {showGoalModal === 'fill' ? teamNames.fill : teamNames.gus}!
                        </h2>
                        <p className="text-white/80 text-xs font-medium mt-1 uppercase tracking-widest drop-shadow-sm">
                            {modalStep === 'scorer' ? 'Quem marcou?' : 'Quem fez a assistência?'}
                        </p>
                     </div>
                     <button 
                        onClick={() => setShowGoalModal(null)}
                        className="absolute top-3 right-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full transition-colors"
                     >
                        <X size={16} />
                     </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-gray-900">
                    <div className="grid grid-cols-3 gap-2">
                        {modalStep === 'scorer' ? (
                            getTeamRoster(showGoalModal).map(p => (
                                <button 
                                    key={p.id}
                                    onClick={() => selectScorer(p.id)}
                                    className="group relative flex flex-col items-center justify-center p-2 rounded-xl bg-gray-800 border border-gray-700 hover:border-gray-500 hover:bg-gray-700 active:scale-95 transition-all duration-200 min-h-[80px]"
                                >
                                    <div className="text-xl font-black text-gray-500 mb-1 group-hover:text-white transition-colors">
                                        {p.number}
                                    </div>
                                    <div className="text-xs font-bold text-gray-300 text-center group-hover:text-white truncate w-full">
                                        {p.name}
                                    </div>
                                </button>
                            ))
                        ) : (
                            <>
                                <button 
                                    onClick={() => finalizeGoal(undefined)}
                                    className="col-span-3 py-3 rounded-xl bg-gray-800 border border-gray-600 border-dashed text-gray-400 hover:text-white hover:bg-gray-700 hover:border-solid active:scale-95 transition-all font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 mb-1"
                                >
                                    <SkipForward size={16} /> Sem Assistência
                                </button>
                                {getTeamRoster(showGoalModal).filter(p => p.id !== selectedScorer).map(p => (
                                    <button 
                                        key={p.id}
                                        onClick={() => finalizeGoal(p.id)}
                                        className="group relative flex flex-col items-center justify-center p-2 rounded-xl bg-gray-800 border border-gray-700 hover:border-green-500/50 hover:bg-gray-700 active:scale-95 transition-all duration-200 min-h-[80px]"
                                    >
                                        <div className="text-xl font-black text-gray-500 mb-1 group-hover:text-green-400 transition-colors">
                                            {p.number}
                                        </div>
                                        <div className="text-xs font-bold text-gray-300 text-center group-hover:text-white truncate w-full">
                                            {p.name}
                                        </div>
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};