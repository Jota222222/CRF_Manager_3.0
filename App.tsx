import React, { useState, useEffect, useRef } from 'react';
import { AppView, Player, TeamType, GameEvent, GameRecord, TeamNames, KitsState, MatchPlayerStats, SeasonArchive, AuthRole, GameState } from './types';
import { Navigation } from './components/Navigation';
import { TeamManager } from './components/TeamManager';
import { TacticsBoard } from './components/TacticsBoard';
import { SquadSelection } from './components/SquadSelection';
import { StatsView } from './components/StatsView';
import { Scoreboard } from './components/Scoreboard';
import { Lock, Eye, ShieldCheck, LogIn, Wifi, WifiOff, Loader2, RefreshCw, AlertCircle, HardDrive, Database, Copy, Check, X, AlertTriangle } from 'lucide-react';
import { supabase, MATCH_ID, checkConnection } from './services/supabase';

const App: React.FC = () => {
  // Auth State
  const [authRole, setAuthRole] = useState<AuthRole>('guest');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [currentView, setCurrentView] = useState<AppView>(AppView.CONVOCATION);
  
  // Connection State
  const [isConnected, setIsConnected] = useState(false);
  const [isSynced, setIsSynced] = useState(false); 
  const [connectionError, setConnectionError] = useState<string>('');
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  
  // Setup Guide State
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  
  // Season State
  const [seasonName, setSeasonName] = useState<string>('2024/2025');
  const [pastSeasons, setPastSeasons] = useState<SeasonArchive[]>([]);

  // Players State
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: 'Ricardo', number: 1, photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Higuita_2016.jpg/250px-Higuita_2016.jpg', goals: 0, assists: 1 },
    { id: '2', name: 'Rodrigo', number: 14, goals: 5, assists: 3 },
    { id: '3', name: 'Falcão', number: 12, photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Falc%C3%A3o_2016.jpg/220px-Falc%C3%A3o_2016.jpg', goals: 12, assists: 8 },
    { id: '4', name: 'Lenísio', number: 10, goals: 15, assists: 2 },
    { id: '5', name: 'Vinícius', number: 7, goals: 4, assists: 6 },
  ]);

  // Convocation State
  const [assignments, setAssignments] = useState<Record<string, TeamType>>({});

  // Team Names State
  const [teamNames, setTeamNames] = useState<TeamNames>({
    fill: 'Fill',
    gus: 'Gus'
  });

  // Kits State (Colors) - Shared between teams
  const [kits, setKits] = useState<KitsState>({
    kit1: { 
      name: 'River', 
      primaryColor: '#ffffff', 
      secondaryColor: '#dc2626' 
    },
    kit2: { 
      name: 'Boca', 
      primaryColor: '#1e40af', 
      secondaryColor: '#facc15' 
    }
  });

  // Controls which kit is assigned to Team Fill (False = Kit1, True = Kit2)
  const [swapKits, setSwapKits] = useState(false);
  
  const [seasonHistory, setSeasonHistory] = useState<GameRecord[]>([]);

  // --- GAME STATE (LIFTED UP) ---
  const [gameTime, setGameTime] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);

  // --- SUPABASE REALTIME LOGIC ---

  const applyServerState = (state: GameState) => {
    if (!state) return;
    setPlayers(state.players || []);
    setAssignments(state.assignments || {});
    setTeamNames(state.teamNames || { fill: 'Fill', gus: 'Gus' });
    setKits(state.kits || kits);
    setSwapKits(state.swapKits || false);
    
    setGameTime(prev => {
      const serverTime = state.gameTime || 0;
      return Math.abs(prev - serverTime) > 2 ? serverTime : prev;
    });

    setIsGameActive(state.isGameActive || false);
    setGameEvents(state.gameEvents || []);
    setSeasonHistory(state.seasonHistory || []);
    setSeasonName(state.seasonName || '2024/2025');
  };

  const initConnection = async () => {
      setIsCheckingConnection(true);
      setConnectionError('');
      
      const check = await checkConnection();
      
      if (!check.success) {
          // Se falhar a verificação, assumimos modo local/offline
          setIsSynced(true);
          setIsConnected(false);
          setConnectionError(check.message || 'Erro desconhecido');
          setIsCheckingConnection(false);
          return;
      }

      // A. Carregar estado inicial
      const { data, error } = await supabase
        .from('match_data')
        .select('content')
        .eq('id', MATCH_ID)
        .single();
      
      if (data && data.content) {
        applyServerState(data.content as GameState);
        setIsSynced(true);
        setIsConnected(true);
      } else if (error) {
        console.error("Erro ao carregar dados:", error);
        // Se a tabela existe mas está vazia ou erro de row
        setIsConnected(true); 
        setIsSynced(true);
      } else {
        setIsConnected(true);
        setIsSynced(true);
      }

      // B. Subscrever a mudanças em tempo real
      if (check.success) {
        const channel = supabase
        .channel('live-game-updates')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'match_data', filter: `id=eq.${MATCH_ID}` },
            (payload) => {
            if (authRole !== 'coach') {
                const newState = payload.new as any;
                if (newState && newState.content) {
                applyServerState(newState.content as GameState);
                }
            }
            setIsConnected(true);
            }
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') setIsConnected(true);
            if (status === 'CHANNEL_ERROR') setIsConnected(false);
        });

        setIsCheckingConnection(false);
        return () => { supabase.removeChannel(channel); };
      }
      
      setIsCheckingConnection(false);
  };

  useEffect(() => {
    initConnection();
  }, [authRole]); 

  // 2. Broadcast changes
  useEffect(() => {
    if (authRole !== 'coach' || !isSynced || !isConnected) {
        return;
    }

    const broadcastState = async () => {
      const state: GameState = {
        players,
        assignments,
        teamNames,
        kits,
        swapKits,
        gameTime,
        isGameActive,
        gameEvents,
        seasonHistory,
        seasonName,
        updatedAt: Date.now()
      };

      await supabase
        .from('match_data')
        .upsert({ id: MATCH_ID, content: state });
    };

    const timeoutId = setTimeout(() => {
        broadcastState();
    }, 500);

    return () => clearTimeout(timeoutId);

  }, [
    authRole, isSynced, isConnected,
    players, assignments, teamNames, kits, swapKits, 
    isGameActive, gameEvents, seasonHistory, seasonName,
  ]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isGameActive) {
      interval = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGameActive]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const coachPassword = process.env.COACH_PASSWORD; 

    if (passwordInput === 'crf') {
      setAuthRole('viewer');
      setLoginError('');
    } else if (coachPassword && passwordInput === coachPassword) {
      setAuthRole('coach');
      setLoginError('');
    } else if (!coachPassword && passwordInput === '222222') {
      setAuthRole('coach');
      setLoginError('');
    } else {
      setLoginError('Password incorreta');
    }
  };

  const handleLogout = () => {
    setAuthRole('guest');
    setPasswordInput('');
    setLoginError('');
    setCurrentView(AppView.CONVOCATION); 
  };

  const handleFinishGame = () => {
    const scoreFill = gameEvents.filter(e => e.team === 'fill').length;
    const scoreGus = gameEvents.filter(e => e.team === 'gus').length;

    const matchDetails: MatchPlayerStats[] = players
        .filter(p => assignments[p.id]) 
        .map(p => {
            const goalsInMatch = gameEvents.filter(e => e.scorerId === p.id).length;
            const assistsInMatch = gameEvents.filter(e => e.assisterId === p.id).length;
            return {
                playerId: p.id,
                name: p.name,
                team: assignments[p.id],
                goals: goalsInMatch,
                assists: assistsInMatch
            };
        });

    const newGame: GameRecord = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('pt-PT') + ', ' + new Date().toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'}),
      scoreFill,
      scoreGus,
      details: matchDetails
    };
    
    const updatedPlayers = [...players];
    gameEvents.forEach(event => {
        if (event.type === 'goal') {
            const scorerIndex = updatedPlayers.findIndex(p => p.id === event.scorerId);
            if (scorerIndex !== -1) {
                updatedPlayers[scorerIndex] = {
                    ...updatedPlayers[scorerIndex],
                    goals: updatedPlayers[scorerIndex].goals + 1
                };
            }

            if (event.assisterId) {
                const assisterIndex = updatedPlayers.findIndex(p => p.id === event.assisterId);
                if (assisterIndex !== -1) {
                    updatedPlayers[assisterIndex] = {
                        ...updatedPlayers[assisterIndex],
                        assists: updatedPlayers[assisterIndex].assists + 1
                    };
                }
            }
        }
    });

    setPlayers(updatedPlayers); 
    setSeasonHistory(prev => [...prev, newGame]);
    setIsGameActive(false);
    setGameTime(0);
    setGameEvents([]);
    setAssignments({}); 
    setCurrentView(AppView.STATS); 
  };

  const handleNewSeason = (newSeasonName: string) => {
    if (seasonHistory.length > 0) {
        const archive: SeasonArchive = {
            id: Date.now().toString(),
            name: seasonName,
            games: [...seasonHistory],
            playerStats: JSON.parse(JSON.stringify(players)), 
            endDate: new Date().toLocaleDateString('pt-PT')
        };
        setPastSeasons(prev => [archive, ...prev]);
    }
    setPlayers(prev => prev.map(p => ({ ...p, goals: 0, assists: 0 })));
    setSeasonHistory([]);
    setSeasonName(newSeasonName);
  };

  const copySqlToClipboard = () => {
    const sql = `create table match_data (
  id text primary key,
  content jsonb
);
alter table match_data enable row level security;
create policy "Public Access" on match_data for all using (true) with check (true);
insert into match_data (id, content) values ('live_match', '{}');`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.TEAM:
        return (
          <TeamManager 
            players={players} 
            setPlayers={setPlayers}
            teamNames={teamNames}
            setTeamNames={setTeamNames}
            kits={kits}
            setKits={setKits}
            swapKits={swapKits}
            seasonName={seasonName}
            onStartNewSeason={handleNewSeason}
            authRole={authRole}
            onLogout={handleLogout}
            isConnected={isConnected}
            isSynced={isSynced}
          />
        );
      case AppView.TACTICS:
        return <TacticsBoard roster={players} authRole={authRole} />;
      case AppView.CONVOCATION:
        return (
            <SquadSelection 
                players={players} 
                assignments={assignments}
                setAssignments={setAssignments}
                teamNames={teamNames}
                kits={kits}
                swapKits={swapKits}
                setSwapKits={setSwapKits}
                authRole={authRole}
            />
        );
      case AppView.MATCH:
        return (
            <Scoreboard 
                players={players} 
                assignments={assignments}
                onFinishGame={handleFinishGame}
                teamNames={teamNames}
                kits={kits}
                swapKits={swapKits}
                gameTime={gameTime}
                isGameActive={isGameActive}
                setIsGameActive={setIsGameActive}
                events={gameEvents}
                setEvents={setGameEvents}
                authRole={authRole}
            />
        );
      case AppView.STATS:
        return (
            <StatsView 
                players={players} 
                history={seasonHistory}
                teamNames={teamNames}
                seasonName={seasonName}
                pastSeasons={pastSeasons}
            />
        );
      default:
        return (
          <TeamManager 
            players={players} 
            setPlayers={setPlayers}
            teamNames={teamNames}
            setTeamNames={setTeamNames}
            kits={kits}
            setKits={setKits}
            swapKits={swapKits}
            seasonName={seasonName}
            onStartNewSeason={handleNewSeason}
            authRole={authRole}
            onLogout={handleLogout}
            isConnected={isConnected}
            isSynced={isSynced}
          />
        );
    }
  };

  if (authRole === 'guest') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        {/* SETUP GUIDE MODAL */}
        {showSetupGuide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                 <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 relative overflow-y-auto max-h-[90vh]">
                    <button onClick={() => setShowSetupGuide(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                    
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Database className="text-blue-600"/> Estado da Ligação
                    </h2>
                    
                    <div className="space-y-4 text-sm text-gray-600">
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-red-800">
                            <strong>Estado: {isConnected ? 'Online' : 'Offline'}</strong>
                            {connectionError && (
                                <p className="mt-1 font-mono text-xs bg-red-100 p-1 rounded text-red-900 border border-red-200">
                                    {connectionError}
                                </p>
                            )}
                            <p className="mt-2 text-xs">
                                Se o erro for "Falta criar a Tabela", copia o código abaixo e corre no SQL Editor do Supabase.
                            </p>
                        </div>

                        <ol className="list-decimal ml-5 space-y-4">
                            <li>
                                <p className="font-bold text-gray-800">SQL Necessário</p>
                                <div className="bg-gray-900 text-gray-300 p-3 rounded-lg mt-2 font-mono text-xs relative group">
                                    <button onClick={copySqlToClipboard} className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors">
                                        {copiedSql ? <Check size={14}/> : <Copy size={14}/>}
                                    </button>
                                    <pre className="whitespace-pre-wrap">
{`create table match_data (
  id text primary key,
  content jsonb
);

alter table match_data enable row level security;

create policy "Public Access" on match_data for all using (true) with check (true);

insert into match_data (id, content) values ('live_match', '{}');`}
                                    </pre>
                                </div>
                            </li>
                        </ol>
                    </div>
                    
                    <button 
                        onClick={() => setShowSetupGuide(false)}
                        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl"
                    >
                        Entendido
                    </button>
                 </div>
            </div>
        )}

        <div className="w-full max-w-md bg-gray-900 rounded-3xl border border-gray-800 p-8 shadow-2xl relative">
          <div className="flex justify-center mb-6">
             <div className="relative h-20 w-20 flex items-center justify-center">
               <img 
                 src="https://imgur.com/kXGxBPO.jpg" 
                 alt="CRF Logo" 
                 className="h-full w-full object-contain"
               />
             </div>
          </div>
          <h1 className="text-2xl font-black text-white text-center mb-2">CRF Manager</h1>
          <p className="text-gray-400 text-center text-sm mb-8">Área Restrita</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl px-4 py-3 pl-10 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Introduza a password..."
                />
                <Lock className="absolute left-3 top-3.5 text-gray-500" size={18} />
              </div>
            </div>
            
            {loginError && (
              <div className="text-red-500 text-sm font-bold text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                {loginError}
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <LogIn size={20} /> Entrar
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-800 flex flex-col gap-2 text-xs text-gray-600">
             <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                    {isCheckingConnection ? (
                        <span className="text-yellow-500 flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> A ligar...</span>
                    ) : isConnected ? (
                        <span className="text-green-500 flex items-center gap-1"><Wifi size={12}/> Online</span>
                    ) : (
                        <button onClick={() => setShowSetupGuide(true)} className="text-red-500 flex items-center gap-1 hover:underline hover:text-red-400 cursor-pointer">
                            <AlertCircle size={12}/> {connectionError ? connectionError.slice(0, 25) + '...' : 'Offline (Ver Erro)'}
                        </button>
                    )}
                </div>
                <button 
                    onClick={() => initConnection()} 
                    className="flex items-center gap-1 text-gray-500 hover:text-white transition-colors"
                >
                    <RefreshCw size={10} /> Recarregar
                </button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-black border-b border-gray-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-center relative">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 flex items-center justify-center shrink-0">
               <img 
                 src="https://imgur.com/kXGxBPO.jpg" 
                 alt="CRF Logo" 
                 className="h-full w-full object-contain"
               />
            </div>
            
            <div className="flex flex-col justify-center">
              <h1 className="text-xl font-black text-white tracking-tight leading-none">
                CRF Manager
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-blue-400 tracking-widest uppercase">Versão 3.2</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${authRole === 'coach' ? 'bg-red-900 text-red-200' : 'bg-gray-800 text-gray-400'}`}>
                  {authRole === 'coach' ? 'Treinador' : 'Espetador'}
                </span>
              </div>
            </div>
          </div>
          
          <div 
            className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2"
          >
             {authRole === 'coach' && isSynced && isConnected && (
                 <span className="hidden sm:inline-block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                     A Gravar
                 </span>
             )}
             {isConnected ? (
                <div title="Ligado em Tempo Real">
                  <Wifi size={18} className="text-green-500" />
                </div>
             ) : (
                <div 
                    title={connectionError}
                    className="cursor-pointer flex items-center gap-1 bg-red-900/50 px-2 py-1 rounded border border-red-800" 
                    onClick={() => { setAuthRole('guest'); setShowSetupGuide(true); }}
                >
                  <AlertTriangle size={14} className="text-red-500" />
                  <span className="text-[10px] font-bold text-red-200 hidden sm:inline-block max-w-[100px] truncate">
                    {connectionError || 'Offline'}
                  </span>
                </div>
             )}
          </div>
        </div>
      </header>

      <main className="pt-4">
        {renderView()}
      </main>

      <Navigation currentView={currentView} setView={setCurrentView} />
    </div>
  );
};

export default App;