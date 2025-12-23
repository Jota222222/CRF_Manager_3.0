import React, { useState } from 'react';
import { Player, GameRecord, TeamNames, SeasonArchive } from '../types';
import { Trophy, Medal, Award, ChevronUp, ChevronDown, Calendar, Archive, FolderOpen } from 'lucide-react';

interface StatsViewProps {
  players: Player[];
  history: GameRecord[];
  teamNames: TeamNames;
  seasonName: string;
  pastSeasons?: SeasonArchive[];
}

export const StatsView: React.FC<StatsViewProps> = ({ players, history, teamNames, seasonName, pastSeasons = [] }) => {
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);
  const [expandedSeasonId, setExpandedSeasonId] = useState<string | null>(null);

  // Sort players by goals (desc), then assists (desc)
  const sortedByGoals = [...players].sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals;
    return b.assists - a.assists;
  });

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="text-yellow-500" size={20} fill="currentColor" />;
    if (index === 1) return <Medal className="text-gray-400" size={20} fill="currentColor" />;
    if (index === 2) return <Medal className="text-amber-700" size={20} fill="currentColor" />;
    return <span className="text-gray-400 font-mono text-sm">#{index + 1}</span>;
  };

  const winsFill = history.filter(g => g.scoreFill > g.scoreGus).length;
  const winsGus = history.filter(g => g.scoreGus > g.scoreFill).length;
  const draws = history.filter(g => g.scoreFill === g.scoreGus).length;

  const toggleGameExpansion = (gameId: string) => {
      setExpandedGameId(prev => prev === gameId ? null : gameId);
  };

  const toggleSeasonExpansion = (seasonId: string) => {
      setExpandedSeasonId(prev => prev === seasonId ? null : seasonId);
  };

  // Helper to render a single game card (reusable)
  const renderGameCard = (game: GameRecord) => (
      <div key={game.id} className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden mb-2">
          <div 
              onClick={() => toggleGameExpansion(game.id)}
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
          >
              <div className="w-20 text-[10px] text-gray-400 font-mono leading-tight text-center">
                  {game.date.split(',')[0]}
                  <br/>
                  {game.date.split(',')[1]}
              </div>

              <div className="flex-1 flex items-center justify-center gap-3">
                  <div className="h-8 w-8 rounded flex items-center justify-center font-bold text-xs border-2 shadow-sm bg-gray-100 border-gray-200 text-gray-700">
                      {game.scoreFill}
                  </div>
                  <div className="text-xs text-gray-300 font-bold">VS</div>
                  <div className="h-8 w-8 rounded flex items-center justify-center font-bold text-xs border-2 shadow-sm bg-gray-100 border-gray-200 text-gray-700">
                      {game.scoreGus}
                  </div>
              </div>

              <div className="w-8 flex justify-end text-gray-400">
                  {expandedGameId === game.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
              </div>
          </div>

          {/* Detalhes do Jogo (Ficha de Jogo) */}
          {expandedGameId === game.id && game.details && (
              <div className="bg-gray-50 p-3 border-t border-gray-100 animate-fade-in-down">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 text-center border-b border-gray-200 pb-2">
                      Ficha de Jogo
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      {/* Coluna Team Fill */}
                      <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                          <div className="text-[10px] font-bold text-gray-500 uppercase mb-2 border-b border-gray-100 pb-1 flex justify-between">
                              <span>{teamNames.fill}</span>
                              <div className="flex gap-2">
                                  <span className="w-3 text-center">G</span>
                                  <span className="w-3 text-center">A</span>
                              </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                              {game.details.filter(p => p.team === 'fill').map(p => (
                                  <div key={p.playerId} className="flex justify-between items-center text-xs">
                                      <span className={`truncate font-medium ${p.goals > 0 ? 'text-gray-900' : 'text-gray-500'}`}>{p.name}</span>
                                      <div className="flex gap-2 font-mono text-[10px]">
                                          <span className={`w-3 text-center ${p.goals > 0 ? 'font-bold text-blue-600' : 'text-gray-300'}`}>{p.goals}</span>
                                          <span className={`w-3 text-center ${p.assists > 0 ? 'font-bold text-gray-500' : 'text-gray-300'}`}>{p.assists}</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* Coluna Team Gus */}
                      <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                          <div className="text-[10px] font-bold text-gray-500 uppercase mb-2 border-b border-gray-100 pb-1 flex justify-between">
                              <span>{teamNames.gus}</span>
                              <div className="flex gap-2">
                                  <span className="w-3 text-center">G</span>
                                  <span className="w-3 text-center">A</span>
                              </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                              {game.details.filter(p => p.team === 'gus').map(p => (
                                  <div key={p.playerId} className="flex justify-between items-center text-xs">
                                      <span className={`truncate font-medium ${p.goals > 0 ? 'text-gray-900' : 'text-gray-500'}`}>{p.name}</span>
                                      <div className="flex gap-2 font-mono text-[10px]">
                                          <span className={`w-3 text-center ${p.goals > 0 ? 'font-bold text-blue-600' : 'text-gray-300'}`}>{p.goals}</span>
                                          <span className={`w-3 text-center ${p.assists > 0 ? 'font-bold text-gray-500' : 'text-gray-300'}`}>{p.assists}</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto pb-24">
      
      {/* 1. SEASON SUMMARY COUNTERS */}
      <section>
         <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Award size={20} className="text-purple-600"/> Resumo da Época
         </h2>
         <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="flex divide-x divide-gray-100 h-24">
                {/* FILL WINS */}
                <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-white to-gray-50">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{teamNames.fill}</span>
                    <span className="text-3xl font-black text-gray-800">{winsFill}</span>
                    <span className="text-[10px] text-green-600 font-bold uppercase bg-green-50 px-2 py-0.5 rounded-full mt-1">Vitórias</span>
                </div>
                
                {/* DRAWS */}
                <div className="w-20 flex flex-col items-center justify-center bg-gray-50">
                    <span className="text-lg font-bold text-gray-400">{draws}</span>
                    <span className="text-[10px] text-gray-400 uppercase">Empates</span>
                </div>

                {/* GUS WINS */}
                <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-bl from-white to-gray-50">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{teamNames.gus}</span>
                    <span className="text-3xl font-black text-gray-800">{winsGus}</span>
                    <span className="text-[10px] text-green-600 font-bold uppercase bg-green-50 px-2 py-0.5 rounded-full mt-1">Vitórias</span>
                </div>
            </div>
         </div>
      </section>

      {/* 2. TOP SCORERS TABLE */}
      <section>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-900 p-4 text-white">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Trophy size={20} className="text-yellow-400" />
                Tabela de Marcadores
            </h2>
            <p className="text-gray-400 text-xs mt-1 uppercase tracking-wider">
                Época {seasonName}
            </p>
            </div>

            <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                <tr>
                    <th className="px-4 py-3 text-center w-12">Pos</th>
                    <th className="px-4 py-3">Jogador</th>
                    <th className="px-4 py-3 text-center">Golos</th>
                    <th className="px-4 py-3 text-center">Ast</th>
                    <th className="px-4 py-3 text-center hidden sm:table-cell">G+A</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {sortedByGoals.map((player, index) => (
                    <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-center font-bold">
                        <div className="flex justify-center">{getRankIcon(index)}</div>
                    </td>
                    <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                        <div className="relative">
                            {player.photoUrl ? (
                                <img 
                                    src={player.photoUrl} 
                                    alt={player.name}
                                    className="w-10 h-10 rounded-full object-cover border border-gray-200" 
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        ((e.target as HTMLImageElement).nextSibling as HTMLElement).style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div 
                                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-xs border border-gray-200"
                                style={{ display: player.photoUrl ? 'none' : 'flex' }}
                            >
                                {player.number}
                            </div>
                        </div>
                        <div>
                            <div className="font-bold text-gray-900">{player.name}</div>
                            <div className="text-xs text-gray-400">Camisola #{player.number}</div>
                        </div>
                        </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full min-w-[2rem]">
                        {player.goals}
                        </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                        <span className="inline-block bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-0.5 rounded-full min-w-[2rem]">
                        {player.assists}
                        </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell font-mono text-gray-500 font-bold">
                        {player.goals + player.assists}
                    </td>
                    </tr>
                ))}
                {sortedByGoals.length === 0 && (
                    <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                        <Award size={48} className="mx-auto mb-2 opacity-20" />
                        Ainda não há estatísticas registadas.
                    </td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>
          </div>
      </section>

      {/* 3. MATCH HISTORY */}
      <section>
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Calendar size={20} className="text-blue-600"/> Histórico de Jogos
          </h2>
          
          <div className="space-y-3">
              {history.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm bg-white rounded-2xl border border-dashed border-gray-200">
                      Sem histórico disponível para a época atual.
                  </div>
              ) : (
                  [...history].reverse().map((game) => renderGameCard(game))
              )}
          </div>
      </section>

      {/* 4. PAST SEASONS ARCHIVE */}
      {pastSeasons && pastSeasons.length > 0 && (
          <section className="mt-8 pt-8 border-t border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                 <Archive size={20} className="text-gray-600"/> Arquivo de Épocas
              </h2>
              
              <div className="space-y-4">
                  {pastSeasons.map(season => {
                      const sWinsFill = season.games.filter(g => g.scoreFill > g.scoreGus).length;
                      const sWinsGus = season.games.filter(g => g.scoreGus > g.scoreFill).length;
                      const sDraws = season.games.filter(g => g.scoreFill === g.scoreGus).length;
                      const isExpanded = expandedSeasonId === season.id;

                      return (
                          <div key={season.id} className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                              <div 
                                onClick={() => toggleSeasonExpansion(season.id)}
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                              >
                                  <div className="flex items-center gap-3">
                                      <div className="bg-gray-200 p-2 rounded-lg text-gray-600">
                                          <FolderOpen size={20} />
                                      </div>
                                      <div>
                                          <h3 className="font-bold text-gray-800">Época {season.name}</h3>
                                          <p className="text-xs text-gray-500">Encerrada a {season.endDate} • {season.games.length} Jogos</p>
                                      </div>
                                  </div>
                                  
                                  {/* Mini Summary */}
                                  <div className="flex gap-4 text-xs font-mono text-gray-500 hidden sm:flex">
                                      <span>{teamNames.fill}: {sWinsFill}V</span>
                                      <span>{teamNames.gus}: {sWinsGus}V</span>
                                      <span>Emp: {sDraws}</span>
                                  </div>

                                  <div className="text-gray-400">
                                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                  </div>
                              </div>
                              
                              {/* Expanded Content */}
                              {isExpanded && (
                                  <div className="bg-white border-t border-gray-200 p-4 animate-fade-in-down">
                                      {/* Season Summary Cards */}
                                      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                          <div className="flex-1 bg-blue-50 p-2 rounded-lg border border-blue-100 text-center min-w-[80px]">
                                              <div className="text-[10px] uppercase text-blue-400 font-bold">{teamNames.fill}</div>
                                              <div className="text-xl font-black text-blue-700">{sWinsFill}</div>
                                          </div>
                                          <div className="flex-1 bg-yellow-50 p-2 rounded-lg border border-yellow-100 text-center min-w-[80px]">
                                              <div className="text-[10px] uppercase text-yellow-500 font-bold">{teamNames.gus}</div>
                                              <div className="text-xl font-black text-yellow-700">{sWinsGus}</div>
                                          </div>
                                          <div className="flex-1 bg-gray-50 p-2 rounded-lg border border-gray-100 text-center min-w-[80px]">
                                              <div className="text-[10px] uppercase text-gray-400 font-bold">Empates</div>
                                              <div className="text-xl font-black text-gray-600">{sDraws}</div>
                                          </div>
                                      </div>

                                      {/* Game List */}
                                      <div className="space-y-2">
                                          {season.games.length === 0 ? (
                                              <p className="text-center text-gray-400 text-sm py-4">Sem jogos registados nesta época.</p>
                                          ) : (
                                              [...season.games].reverse().map(game => renderGameCard(game))
                                          )}
                                      </div>
                                  </div>
                              )}
                          </div>
                      );
                  })}
              </div>
          </section>
      )}
    </div>
  );
};