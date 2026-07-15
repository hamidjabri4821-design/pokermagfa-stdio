/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Suit = 'S' | 'H' | 'D' | 'C'; // Spades, Hearts, Diamonds, Clubs
export type CardValue = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  value: CardValue;
  suit: Suit;
  isFacedown?: boolean;
}

export type PositionName = 'SB' | 'BB' | 'UTG' | 'UTG+1' | 'UTG+2' | 'LJ' | 'HJ' | 'CO' | 'BTN';

export type PlayerActionType = 'NONE' | 'FOLD' | 'CHECK' | 'CALL' | 'BET' | 'RAISE' | 'ALL_IN';

export interface Player {
  id: number; // Seat number 1-9
  position: PositionName;
  name: string; // E.g., "Hero", "Villain 1"
  cards: Card[];
  chips: string; // Chips/BB description, e.g., "100 BB"
  currentAction: PlayerActionType;
  actionAmount?: string; // Amount bet/raised
  isFolded: boolean;
  isActive: boolean; // Is it their turn
  isDealer: boolean;
  isHighlighted: boolean;
}

export interface TableState {
  players: Player[];
  communityCards: Card[];
  pot: string; // Pot amount, e.g., "10 BB"
  customText: string; // Screen overlay custom text
  cameraZoom: 'table' | 'cards' | 'pot' | number; // Seat ID or special target
  highlightedSeat: number | null; // Seat ID that is highlighted (other seats will dim)
}

export type TimelineStepType =
  | 'SET_DEALER'
  | 'PLAYER_ACTION'
  | 'SET_CARDS'
  | 'REVEAL_COMMUNITY'
  | 'SET_POT'
  | 'SET_TEXT'
  | 'HIGHLIGHT_SEAT'
  | 'CAMERA_ZOOM'
  | 'DELAY';

export interface TimelineStep {
  id: string;
  type: TimelineStepType;
  description: string;
  // Parameters
  seatId?: number; // For player/dealer actions
  actionType?: PlayerActionType;
  actionAmount?: string;
  playerCards?: Card[];
  cardsToReveal?: Card[]; // Community cards to show
  potValue?: string;
  customText?: string;
  zoomTarget?: 'table' | 'cards' | 'pot' | number;
  delayMs?: number;
}

export interface Scenario {
  name: string;
  description: string;
  steps: TimelineStep[];
}
