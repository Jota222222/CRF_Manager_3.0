import React, { useState, useRef } from 'react';
import { Player, TeamNames, KitsState, AuthRole } from '../types';
import { Plus, Trash2, User, FileSpreadsheet, Settings2, Shirt, AlertTriangle, Save, Lock, LogOut, ShieldCheck, Eye, X, Pencil } from 'lucide-react';
import * as XLSX from 'xlsx';

interface TeamManagerProps {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  teamNames: TeamNames;
  setTeamNames: React.Dispatch<React.SetStateAction<TeamNames>>;
  kits: KitsState;
  setKits: React.Dispatch<React.SetStateAction<KitsState>>;
  swapKits: boolean;
  seasonName: string;
  onStartNewSeason: (name: string) => void;
  authRole: AuthRole;
  onLogout: () => void;
  isConnected: boolean;
  isSynced: boolean;
}

export const TeamManager: React.FC<TeamManagerProps> = ({ 
  players, 
  setPlayers, 
  teamNames,
  setTeamNames,
  kits,
  setKits,
  swapKits,
  seasonName,
  onStartNewSeason,
  authRole,
  onLogout,
  isConnected,
  isSynced
}) => {
  const [isAdding, setIsAdding] = useState(false);
  
  // State for Adding
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState('');
  const [newPlayerPhoto, setNewPlayerPhoto] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // State for Editing
  const [editForm, setEditForm] = useState<Player | null>(null);
  
  // New Season State
  const [showEndSeason, setShowEndSeason] = useState(false);
  const [newSeasonInput, setNewSeasonInput] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isViewer = authRole === 'viewer';

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName) return;

    // Se não houver número, assume 0
    const num = newPlayerNumber ? parseInt(newPlayerNumber) : 0;

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: newPlayerName,
      number: num,
      photoUrl: newPlayerPhoto,
      goals: 0,
      assists: 0,
    };

    setPlayers([...players, newPlayer]);
    setNewPlayerName('');
    setNewPlayerNumber('');
    setNewPlayerPhoto('');
    setIsAdding(false);
  };

  const handleDeleteClick = (id: string) => {
    if (confirmDeleteId === id) {
      setPlayers(players.filter(p => p.id !== id));
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => {
        setConfirmDeleteId(prev => (prev === id ? null : prev));
      }, 3000);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    setPlayers(prev => prev.map(p => p.id === editForm.id ? editForm : p));
    setEditForm(null);
  };

  const handleEndSeasonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeasonInput.trim()) return;
    
    onStartNewSeason(newSeasonInput);
    setShowEndSeason(false);
    setNewSeasonInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      if (!data) return;

      try {
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const newPlayers: Player[] = [];

        jsonData.forEach((row: any, index: number) => {
          const keys = Object.keys(row);
          // Procura coluna de nome (obrigatório)
          const nameKey = keys.find(k => k.toLowerCase().includes('nome') || k.toLowerCase().includes('name') || k.toLowerCase().includes('jogador'));
          // Procura coluna de número (opcional)
          const numberKey = keys.find(k => k.toLowerCase().includes('numero') || k.toLowerCase().includes('número') || k.toLowerCase().includes('camisola') || k.toLowerCase().includes('number'));
          // Procura coluna de foto (opcional)
          const photoKey = keys.find(k => k.toLowerCase().includes('url') || k.toLowerCase().includes('foto') || k.toLowerCase().includes('photo'));

          if (nameKey) {
             const name = row[nameKey];
             let number = 0; // Default number

             if (numberKey && row[numberKey] !== undefined) {
                 const parsed = parseInt(row[numberKey]);
                 if (!isNaN(parsed)) {
                     number = parsed;
                 }
             }

             const photoUrl = photoKey ? row[photoKey] : undefined;

             if (name) {
               newPlayers.push({
                 id: Date.now().toString() + index + Math.random().toString().slice(2, 5),
                 name: String(name).trim(),
                 number: number,
                 photoUrl: photoUrl ? String(photoUrl).trim() : undefined,
                 goals: 0,
                 assists: 0
               });
             }
          }
        });

        if (newPlayers.length > 0) {
          setPlayers(prev => [...prev, ...newPlayers]);
          alert(`${newPlayers.length} jogadores importados com sucesso!`);
        } else {
          alert("Não foi possível encontrar jogadores. Verifique se o Excel tem pelo menos uma coluna 'Nome'.");
        }

      } catch (error) {
        console.error("Erro ao ler ficheiro:", error);
        alert("Ocorreu um erro ao processar o ficheiro.");
      }
    };

    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-4 space-y-8 max-w-3xl mx-auto pb-24">
      
      {/* HEADER WITH LOGOUT */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg ${authRole === 'coach' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                 {authRole === 'coach' ? <ShieldCheck size={24}/> : <Eye size={24}/>}
             </div>
             <div>
                 <h1 className="text-lg font-bold text-gray-900 leading-tight">Área de Gestão</h1>
                 <p className="text-xs text-gray-500 font-medium">Conta: {authRole === 'coach' ? 'Treinador' : 'Espetador'}</p>
             </div>
         </div>
         <button 
            onClick={onLogout} 
            className="flex items-center gap-2 text-gray-500 hover:text-red-600 bg-gray-50 border border-gray-200 hover:border-red-200 hover:bg-red-50 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm"
         >
             <LogOut size={16}/> Sair
         </button>
      </div>

      {/* SECTION 1: TEAM NAMES */}
      <section>
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Settings2 size={20} className="text-blue-600"/> Gestão de Equipas (Nomes)
          </h2>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <div className="grid grid-cols-2 gap-4">
                 <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Equipa 1</label>
                     {isViewer ? (
                       <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 flex justify-between items-center">
                         {teamNames.fill} <Lock size={12} className="text-gray-400"/>
                       </div>
                     ) : (
                       <input 
                          type="text" 
                          value={teamNames.fill}
                          onChange={(e) => setTeamNames(prev => ({...prev, fill: e.target.value}))}
                          className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                       />
                     )}
                 </div>
                 <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Equipa 2</label>
                     {isViewer ? (
                       <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 flex justify-between items-center">
                         {teamNames.gus} <Lock size={12} className="text-gray-400"/>
                       </div>
                     ) : (
                       <input 
                          type="text" 
                          value={teamNames.gus}
                          onChange={(e) => setTeamNames(prev => ({...prev, gus: e.target.value}))}
                          className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                       />
                     )}
                 </div>
             </div>
          </div>
      </section>

      {/* SECTION 2: KITS CONFIG */}
      <section>
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Shirt size={20} className="text-purple-600"/> Gestão de Equipamentos (Cores)
          </h2>
          {isViewer ? (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                  <div className="grid grid-cols-2 gap-8">
                      <div>
                          <div className="text-xs font-bold text-gray-400 uppercase mb-2">Equipamento 1</div>
                          <div 
                                className="w-full py-3 rounded-lg text-center font-bold text-sm border-2 shadow-sm"
                                style={{ backgroundColor: kits.kit1.primaryColor, color: kits.kit1.secondaryColor, borderColor: kits.kit1.secondaryColor }}
                            >
                                {kits.kit1.name}
                          </div>
                      </div>
                      <div>
                          <div className="text-xs font-bold text-gray-400 uppercase mb-2">Equipamento 2</div>
                          <div 
                                className="w-full py-3 rounded-lg text-center font-bold text-sm border-2 shadow-sm"
                                style={{ backgroundColor: kits.kit2.primaryColor, color: kits.kit2.secondaryColor, borderColor: kits.kit2.secondaryColor }}
                            >
                                {kits.kit2.name}
                          </div>
                      </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-4 flex items-center justify-center gap-1"><Lock size={10}/> Edição bloqueada para espetadores</p>
              </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* KIT 1 Config */}
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-8 rounded-r-lg" style={{backgroundColor: kits.kit1.primaryColor}}></div>
                    <span className="text-sm font-bold text-gray-500 uppercase">Equipamento 1</span>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-gray-400 font-semibold block mb-1">Nome do Equipamento</label>
                        <input 
                            type="text" 
                            value={kits.kit1.name}
                            onChange={(e) => setKits(prev => ({...prev, kit1: {...prev.kit1, name: e.target.value}}))}
                            className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:border-blue-300 bg-white"
                        />
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-xs text-gray-400 font-semibold block mb-1">Cor Principal</label>
                            <div className="flex items-center gap-2 border border-gray-200 p-1 rounded-lg">
                                <input 
                                    type="color" 
                                    value={kits.kit1.primaryColor}
                                    onChange={(e) => setKits(prev => ({...prev, kit1: {...prev.kit1, primaryColor: e.target.value}}))}
                                    className="w-8 h-8 rounded cursor-pointer border-none p-0 bg-transparent"
                                />
                                <span className="text-xs font-mono text-gray-500">{kits.kit1.primaryColor}</span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-gray-400 font-semibold block mb-1">Cor Secundária</label>
                            <div className="flex items-center gap-2 border border-gray-200 p-1 rounded-lg">
                                <input 
                                    type="color" 
                                    value={kits.kit1.secondaryColor}
                                    onChange={(e) => setKits(prev => ({...prev, kit1: {...prev.kit1, secondaryColor: e.target.value}}))}
                                    className="w-8 h-8 rounded cursor-pointer border-none p-0 bg-transparent"
                                />
                                <span className="text-xs font-mono text-gray-500">{kits.kit1.secondaryColor}</span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Preview */}
                <div className="mt-4 pt-4 border-t border-gray-50">
                    <span className="text-xs text-gray-400 block mb-2">Pré-visualização</span>
                    <div 
                        className="w-full py-2 rounded-lg text-center font-bold text-sm border-2"
                        style={{ backgroundColor: kits.kit1.primaryColor, color: kits.kit1.secondaryColor, borderColor: kits.kit1.secondaryColor }}
                    >
                        {kits.kit1.name}
                    </div>
                </div>
             </div>

             {/* KIT 2 Config */}
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-8 rounded-r-lg" style={{backgroundColor: kits.kit2.primaryColor}}></div>
                    <span className="text-sm font-bold text-gray-500 uppercase">Equipamento 2</span>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-gray-400 font-semibold block mb-1">Nome do Equipamento</label>
                        <input 
                            type="text" 
                            value={kits.kit2.name}
                            onChange={(e) => setKits(prev => ({...prev, kit2: {...prev.kit2, name: e.target.value}}))}
                            className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:border-blue-300 bg-white"
                        />
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-xs text-gray-400 font-semibold block mb-1">Cor Principal</label>
                            <div className="flex items-center gap-2 border border-gray-200 p-1 rounded-lg">
                                <input 
                                    type="color" 
                                    value={kits.kit2.primaryColor}
                                    onChange={(e) => setKits(prev => ({...prev, kit2: {...prev.kit2, primaryColor: e.target.value}}))}
                                    className="w-8 h-8 rounded cursor-pointer border-none p-0 bg-transparent"
                                />
                                <span className="text-xs font-mono text-gray-500">{kits.kit2.primaryColor}</span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-gray-400 font-semibold block mb-1">Cor Secundária</label>
                            <div className="flex items-center gap-2 border border-gray-200 p-1 rounded-lg">
                                <input 
                                    type="color" 
                                    value={kits.kit2.secondaryColor}
                                    onChange={(e) => setKits(prev => ({...prev, kit2: {...prev.kit2, secondaryColor: e.target.value}}))}
                                    className="w-8 h-8 rounded cursor-pointer border-none p-0 bg-transparent"
                                />
                                <span className="text-xs font-mono text-gray-500">{kits.kit2.secondaryColor}</span>
                            </div>
                        </div>
                    </div>
                </div>
                 {/* Preview */}
                <div className="mt-4 pt-4 border-t border-gray-50">
                    <span className="text-xs text-gray-400 block mb-2">Pré-visualização</span>
                    <div 
                        className="w-full py-2 rounded-lg text-center font-bold text-sm border-2"
                        style={{ backgroundColor: kits.kit2.primaryColor, color: kits.kit2.secondaryColor, borderColor: kits.kit2.secondaryColor }}
                    >
                        {kits.kit2.name}
                    </div>
                </div>
             </div>
          </div>
          )}
      </section>

      {/* SECTION 3: ROSTER */}
      <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <User size={20} className="text-green-600"/> Gestão de Jogadores
            </h2>
            {!isViewer && (
                <div className="flex gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg shadow-sm transition-all"
                        title="Importar Excel"
                    >
                        <FileSpreadsheet size={18} />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept=".xlsx,.xls,.csv" 
                        className="hidden" 
                    />
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all text-sm font-semibold"
                    >
                        <Plus size={16} /> Novo
                    </button>
                </div>
            )}
          </div>

        {isAdding && !isViewer && (
            <form onSubmit={handleAddPlayer} className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 animate-fade-in-down mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    placeholder="Ex: Ricardinho"
                    required
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número (Opcional)</label>
                <input
                    type="number"
                    value={newPlayerNumber}
                    onChange={(e) => setNewPlayerNumber(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    placeholder="0"
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto URL (Opcional)</label>
                <input
                    type="text"
                    value={newPlayerPhoto}
                    onChange={(e) => setNewPlayerPhoto(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    placeholder="https://..."
                />
                </div>
            </div>
            <button type="submit" className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                Guardar Jogador
            </button>
            </form>
        )}

        <div className="grid grid-cols-1 gap-3">
            {players.length === 0 ? (
            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <User size={48} className="mx-auto mb-2 opacity-50" />
                <p>Nenhum jogador registado.</p>
                <p className="text-sm mt-2">Adicione manualmente ou importe um ficheiro Excel.</p>
            </div>
            ) : (
            players.map((player) => (
                <div 
                    key={player.id} 
                    onClick={() => !isViewer && setEditForm(player)}
                    className={`bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between transition-colors ${!isViewer ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                >
                <div className="flex items-center gap-4">
                    <div className="relative">
                        {player.photoUrl ? (
                            <img 
                                src={player.photoUrl} 
                                alt={player.name} 
                                className="w-12 h-12 rounded-full object-cover border border-gray-200"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = ''; 
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    ((e.target as HTMLImageElement).nextSibling as HTMLElement).style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div 
                            className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-700 border border-gray-200"
                            style={{ display: player.photoUrl ? 'none' : 'flex' }}
                        >
                            {player.number}
                        </div>
                    </div>
                    
                    <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        {player.name}
                        {!isViewer && <Pencil size={12} className="text-gray-300"/>}
                    </h3>
                    <div className="text-sm text-gray-500">
                        Camisola #{player.number}
                    </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right text-xs text-gray-400 hidden sm:block">
                    <div>Golos: {player.goals}</div>
                    <div>Assists: {player.assists}</div>
                    </div>
                    {!isViewer && (
                        <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(player.id); }}
                        className={`p-2 rounded-full transition-all duration-200 flex items-center gap-2 ${
                            confirmDeleteId === player.id 
                                ? 'bg-red-600 text-white hover:bg-red-700 px-3 shadow-md' 
                                : 'text-red-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                        >
                        {confirmDeleteId === player.id ? (
                            <>
                                <span className="text-xs font-bold animate-pulse">Confirmar?</span>
                                <Trash2 size={16} />
                            </>
                        ) : (
                            <Trash2 size={18} />
                        )}
                        </button>
                    )}
                </div>
                </div>
            ))
            )}
        </div>
      </section>

      {/* EDIT MODAL */}
      {editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
                <button 
                    onClick={() => setEditForm(null)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X size={20} />
                </button>
                
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Pencil className="text-blue-600" size={20}/> Editar Jogador
                </h3>

                <form onSubmit={handleSaveEdit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Jogador</label>
                        <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold text-gray-900"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Número</label>
                        <input
                            type="number"
                            value={editForm.number}
                            onChange={(e) => setEditForm({...editForm, number: parseInt(e.target.value) || 0})}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold text-gray-900"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Foto URL</label>
                        <input
                            type="text"
                            value={editForm.photoUrl || ''}
                            onChange={(e) => setEditForm({...editForm, photoUrl: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm text-gray-600"
                            placeholder="https://..."
                        />
                    </div>

                    <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                        <button 
                            type="button"
                            onClick={() => setEditForm(null)}
                            className="flex-1 py-3 text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <Save size={18} /> Guardar
                        </button>
                    </div>
                </form>
             </div>
        </div>
      )}

      {/* SECTION 4: DANGER ZONE / SEASON RESET */}
      {!isViewer && (
        <>
          <section className="mt-8 border-t-2 border-red-100 pt-6">
            <h2 className="text-lg font-bold text-red-600 mb-3 flex items-center gap-2">
            <AlertTriangle size={20} /> Zona de Perigo: Gestão de Época
            </h2>
            
            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                <p className="font-bold text-gray-800 text-sm">Época Atual: <span className="text-red-600">{seasonName}</span></p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">
                    Encerrar a época irá apagar todo o histórico de jogos e reiniciar as estatísticas (golos/assistências) de todos os jogadores para zero. Os jogadores manter-se-ão no plantel.
                </p>
                </div>
                
                {!showEndSeason ? (
                <button 
                    onClick={() => setShowEndSeason(true)}
                    className="bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-600 hover:text-white transition-colors shadow-sm"
                >
                    Encerrar Época
                </button>
                ) : (
                <form onSubmit={handleEndSeasonSubmit} className="flex flex-col gap-3 w-full sm:w-auto animate-fade-in">
                    <div>
                        <label className="block text-xs font-bold text-red-800 mb-1">Nome da Nova Época</label>
                        <input 
                            type="text" 
                            value={newSeasonInput}
                            onChange={(e) => setNewSeasonInput(e.target.value)}
                            placeholder="Ex: 2025/2026"
                            className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-2">
                        <button 
                            type="button"
                            onClick={() => setShowEndSeason(false)}
                            className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-700"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            disabled={!newSeasonInput.trim()}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={14} /> Confirmar Reset
                        </button>
                    </div>
                </form>
                )}
            </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};