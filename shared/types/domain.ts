// Tipi dominio derivati da docs/schema.sql

export type MatchType = '1v1' | 'tripla' | 'amichevole'
export type TournamentStatus = 'active' | 'paused' | 'finished' | 'invalid'

// Auth
export interface AuthUser {
  id: string // UUID
  email: string | undefined
}

// Clan
export interface Clan {
  id: number
  name: string
  owner_id: string // UUID
  invite_code: string
  created_at: string
}

export interface ClanMember {
  clan_id: number
  user_id: string
  joined_at: string
  // join opzionali (lato app, non in schema): email del membro via auth.users
  email?: string
}

// Player (scoped al clan)
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
  created_by: string | null // UUID auth.users
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
  points: number
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
}

export interface BracketResult {
  positions: PodiumEntry[]
}
