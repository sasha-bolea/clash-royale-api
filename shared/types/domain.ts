// Tipi dominio derivati da docs/schema.sql (modello flat, no auth)

export type MatchType = '1v1' | 'tripla' | 'amichevole'
export type TournamentStatus = 'active' | 'paused' | 'finished' | 'invalid'

// Clan: nessuna ownership, codice univoco è la chiave d'accesso
export interface Clan {
  id: number
  name: string
  code: string
  created_at: string
}

// Player (scoped al clan, NO account proprio)
export interface Player {
  id: number
  clan_id: number
  username: string
  cr_tag: string
  created_at: string
}

export interface Tournament {
  id: number
  clan_id: number
  match_type: MatchType
  status: TournamentStatus
  full_ranking: boolean
  started_at: string
  finished_at: string | null
  tournament_players?: Array<{ player_id: number; players: Player }>
  tournament_matches?: TournamentMatch[]
}

export interface TournamentMatch {
  id: number
  tournament_id: number
  player1_id: number
  player2_id: number
  winner_id: number
  crowns_p1: number
  crowns_p2: number
  played_at: string
  cr_battle_id: string
  player1?: Pick<Player, 'id' | 'username' | 'cr_tag'>
  player2?: Pick<Player, 'id' | 'username' | 'cr_tag'>
  winner?: Pick<Player, 'id' | 'username'>
}

export interface Standing {
  clan_id: number
  player_id: number
  wins: number
  players?: Player
}

export interface SaveMatchPayload {
  tournament_id: number
  player1_id: number
  player2_id: number
  winner_id: number
  crowns_p1: number
  crowns_p2: number
  played_at: string
  cr_battle_id: string
  match_type: MatchType
}

// CR API responses
export interface CRPlayerProfile {
  tag: string
  name: string
  trophies: number
  bestTrophies: number
  expLevel: number
  wins: number
  losses: number
  battleCount: number
  threeCrownWins: number
  arena?: { name: string }
  clan?: { name: string }
}

export interface CRBattle {
  battleTime: string
  team: Array<{ tag: string; crowns: number; name?: string }>
  opponent: Array<{ tag: string; crowns: number; name?: string }>
  type?: string
  gameMode?: { name: string }
}

export interface PodiumEntry {
  player_id: number
  username: string | undefined
  // Posizione finale (1-based). Pari merito condividono lo stesso valore.
  place?: number
}

export interface BracketResult {
  positions: PodiumEntry[]
}

// ---- Vista bracket progressiva (per il rendering ad albero) ----
export type BracketFormat = 2 | 3 | 4 | 6 | 8

export interface BracketSlot {
  playerId?: number
  username?: string
}

export interface BracketNode {
  id: string
  label?: string          // es. "Finale", "3°/4°", "perdente"
  slotA: BracketSlot
  slotB: BracketSlot
  winnerId?: number
  suggested?: boolean     // true se gli slot sono un accoppiamento consigliato (non ancora giocato)
}

export interface BracketRound {
  id: string
  label: string
  matches: BracketNode[]
}

export interface BracketView {
  format: BracketFormat
  fullRanking: boolean
  rounds: BracketRound[]            // albero principale connesso (colonne)
  // Partite fuori dall'albero principale: finalina 3°/4°, consolazione, incrocio gironi.
  extras?: BracketRound[]
  groups?: [BracketRound[], BracketRound[]] | null  // solo format 6: 2 gironi
  groupIds?: [number[], number[]]   // solo format 6: id giocatori per girone (per i suggerimenti)
  groupsPending?: boolean           // 6: true se gironi non ancora identificati
}
