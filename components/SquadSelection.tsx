import React, { useState } from 'react';
import { Player, TeamType, TeamNames, KitsState, AuthRole } from '../types';
import { Check, Copy, Shirt, RefreshCw } from 'lucide-react';

interface SquadSelectionProps {
  players: Player[];
  assignments: Record<string, TeamType>;
  setAssignments: React.Dispatch<React.SetStateAction<Record<string, TeamType>>>;
  teamNames: TeamNames;
  kits: KitsState;
  swapKits: boolean;
  setSwapKits: React.Dispatch<React.SetStateAction<boolean>>;
  authRole: AuthRole;
}

export const SquadSelection: React.FC<SquadSelectionProps> = ({ 
    players, 
    assignments, 
    setAssignments,
    teamNames,
    kits,
    swapKits,
    setSwapKits,
    authRole
}) => {
  const [copied, setCopied] = useState(false);
  const isViewer = authRole === 'viewer';

  const toggleAssignment = (playerId: string, team: TeamType) => {
    if (isViewer) return;
    setAssignments(prev => {
      const current = prev[playerId];
      const newAssignments = { ...prev };
      
      if (current === team) {
        // Deselect if clicking the same team
        delete newAssignments[playerId];
      } else {
        // Switch team or Select new
        newAssignments[playerId] = team;
      }
      return newAssignments;
    });
  };

  const copyToClipboard = () => {
    const fillPlayers = players.filter(p => assignments[p.id] === 'fill').sort((a, b) => a.number - b.number);
    const gusPlayers = players.filter(p => assignments[p.id] === 'gus').sort((a, b) => a.number - b.number);

    const date = new Date().toLocaleDateString('pt-PT');
    
    // Determine kit names for emoji context (simplification)
    const fillEmoji = !swapKits ? '🔴' : '🔵'; 
    const gusEmoji = !swapKits ? '🔵' : '🔴'; 

    let text = `⚽ *Quintas do CRF - ${date}* ⚽\n\n`;
    
    text += `${fillEmoji} *${teamNames.fill}* (${fillPlayers.length})\n`;
    fillPlayers.forEach(p => text += `${p.number}. ${p.name}\n`);
    
    text += `\n${gusEmoji} *${teamNames.gus}* (${gusPlayers.length})\n`;
    gusPlayers.forEach(p => text += `${p.number}. ${p.name}\n`);

    text += `\nTotal: ${fillPlayers.length + gusPlayers.length} Jogadores`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to format button label
  const getButtonLabel = (name: string) => {
    // If name is short (<= 4 chars), show full. Otherwise show first 3 chars.
    return name.length <= 4 ? name.toUpperCase() : name.slice(0, 3).toUpperCase();
  };

  // Derived stats
  const fillCount = Object.values(assignments).filter(v => v === 'fill').length;
  const gusCount = Object.values(assignments).filter(v => v === 'gus').length;

  // Determine active kit for each team based on swap state
  const fillKit = !swapKits ? kits.kit1 : kits.kit2;
  const gusKit = !swapKits ? kits.kit2 : kits.kit1;

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto pb-24">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Shirt className="text-blue-600" />
          Convocatória
        </h2>
        <button
          onClick={copyToClipboard}
          disabled={fillCount === 0 && gusCount === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition shadow-sm text-sm ${
            copied 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copiado!' : 'Copiar Equipas'}
        </button>
      </div>

      {/* Team Headers / Scoreboard Preview */}
      <div className="grid grid-cols-2 gap-4">
        {/* Equipa Fill Header */}
        <div 
            className="p-3 rounded-xl border-2 transition-all relative overflow-hidden shadow-sm"
            style={{ 
                backgroundColor: fillKit.primaryColor, 
                borderColor: fillKit.secondaryColor,
                color: fillKit.secondaryColor 
            }}
        >
            <div className="relative z-10 flex flex-col items-center">
                <span className="text-xs font-bold uppercase tracking-wider mb-1 opacity-90">
                    {teamNames.fill}
                </span>
                <div className="text-2xl font-black">
                    {fillCount}
                </div>
            </div>
        </div>

        {/* Equipa Gus Header */}
        <div 
            className="p-3 rounded-xl border-2 transition-all relative overflow-hidden shadow-sm"
            style={{ 
                backgroundColor: gusKit.primaryColor, 
                borderColor: gusKit.secondaryColor,
                color: gusKit.secondaryColor 
            }}
        >
            <div className="relative z-10 flex flex-col items-center">
                <span className="text-xs font-bold uppercase tracking-wider mb-1 opacity-90">
                    {teamNames.gus}
                </span>
                <div className="text-2xl font-black">
                    {gusCount}
                </div>
            </div>
        </div>
      </div>

      {!isViewer && (
        <div className="flex justify-center">
           <button 
              onClick={() => setSwapKits(!swapKits)}
              className="text-xs text-blue-600 underline flex items-center gap-1 hover:text-blue-800"
           >
              <RefreshCw size={12}/> Trocar Equipamentos
           </button>
        </div>
      )}

      {/* Player List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Plantel CRF (A-Z)
        </div>
        <div className="divide-y divide-gray-100">
          {players.length === 0 ? (
             <div className="p-8 text-center text-gray-500">
                Adicione jogadores no menu "Gestão" para começar.
             </div>
          ) : (
            players
              .sort((a, b) => a.name.localeCompare(b.name)) // Sorted Alphabetically
              .map((player) => {
              const assignedTo = assignments[player.id];
              
              return (
                <div 
                  key={player.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Photo Logic */}
                    <div className="relative">
                        {player.photoUrl ? (
                            <img 
                                src={player.photoUrl} 
                                alt={player.name} 
                                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = ''; 
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
                    <span className="font-medium text-gray-800 text-sm">{player.name}</span>
                  </div>

                  <div className={`flex gap-2 ${isViewer ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* Fill Button */}
                    <button
                        onClick={() => toggleAssignment(player.id, 'fill')}
                        className="px-3 py-1.5 rounded-md text-xs font-bold transition-all border shadow-sm w-12 flex justify-center"
                        style={
                            assignedTo === 'fill' 
                            ? { 
                                backgroundColor: fillKit.primaryColor, 
                                color: fillKit.secondaryColor, 
                                borderColor: fillKit.secondaryColor 
                              } 
                            : { 
                                backgroundColor: '#f3f4f6', 
                                color: '#9ca3af', 
                                borderColor: 'transparent' 
                              }
                        }
                    >
                        {getButtonLabel(teamNames.fill)}
                    </button>

                    {/* Gus Button */}
                    <button
                        onClick={() => toggleAssignment(player.id, 'gus')}
                        className="px-3 py-1.5 rounded-md text-xs font-bold transition-all border shadow-sm w-12 flex justify-center"
                        style={
                            assignedTo === 'gus' 
                            ? { 
                                backgroundColor: gusKit.primaryColor, 
                                color: gusKit.secondaryColor, 
                                borderColor: gusKit.secondaryColor 
                              } 
                            : { 
                                backgroundColor: '#f3f4f6', 
                                color: '#9ca3af', 
                                borderColor: 'transparent' 
                              }
                        }
                    >
                        {getButtonLabel(teamNames.gus)}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};