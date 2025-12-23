
export interface Player {
  id: string;
  name: string;
  number: number;
  photoUrl?: string;
  goals: number;
  assists: number;
}

export interface DraggablePlayer {
  id: string;
  playerId: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  color: string;
  label: string;
}

export enum AppView {
  CONVOCATION = 'convocation',
  MATCH = 'match',
  TACTICS = 'tactics',
  STATS = 'stats',
  TEAM = 'team' // Gestão no final
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export type TeamType = 'fill' | 'gus';

export interface GameEvent {
  id: string;
  type: 'goal';
  time: string;
  team: TeamType;
  scorerId: string;
  scorerName: string;
  assisterId?: string;
  assisterName?: string;
}

export interface MatchPlayerStats {
  playerId: string;
  name: string;
  team: TeamType;
  goals: number;
  assists: number;
}

export interface GameRecord {
  id: string;
  date: string;
  scoreFill: number;
  scoreGus: number;
  mvp?: string;
  details?: MatchPlayerStats[]; // Lista de jogadores e suas stats neste jogo específico
}

export interface SeasonArchive {
  id: string;
  name: string; // Ex: "2024/2025"
  games: GameRecord[];
  playerStats: Player[]; // Snapshot das stats finais dos jogadores
  endDate: string;
}

// Configuração de Cores (Equipamento)
export interface KitConfig {
  name: string; // Ex: River, Boca
  primaryColor: string; // Background
  secondaryColor: string; // Text & Border
}

// Estado dos Equipamentos (2 Kits disponíveis)
export interface KitsState {
  kit1: KitConfig;
  kit2: KitConfig;
}

// Estado dos Nomes das Equipas
export interface TeamNames {
  fill: string;
  gus: string;
}

// Tipos de Autenticação
export type AuthRole = 'guest' | 'viewer' | 'coach';

// Interface Global para Sincronização
export interface GameState {
  players: Player[];
  assignments: Record<string, TeamType>;
  teamNames: TeamNames;
  kits: KitsState;
  swapKits: boolean;
  gameTime: number;
  isGameActive: boolean;
  gameEvents: GameEvent[];
  seasonHistory: GameRecord[];
  seasonName: string;
  updatedAt: number;
}
