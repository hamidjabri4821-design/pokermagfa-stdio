/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Player, Card, PositionName, PlayerActionType } from '../types';
import { PokerCard } from './PokerCard';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, Crown, Shield, Sparkles, Gem, Flame, Trophy, CircleUser, Swords } from 'lucide-react';

interface PokerTableProps {
  players: Player[];
  communityCards: Card[];
  pot: string;
  customText: string;
  cameraZoom: 'table' | 'cards' | 'pot' | number;
  highlightedSeat: number | null;
  isPortrait: boolean;
  onSeatClick?: (player: Player) => void;
  activeTurnId?: number | null;
}

// Predefined premium avatars for the 9 seats
export const SEAT_AVATARS: Record<number, { icon: React.ReactNode; bg: string; border: string }> = {
  1: { icon: <Crown className="w-3 h-3 text-amber-300" />, bg: 'from-amber-600 to-yellow-950', border: 'border-amber-400' },
  2: { icon: <Shield className="w-3 h-3 text-blue-300" />, bg: 'from-blue-600 to-indigo-950', border: 'border-blue-400' },
  3: { icon: <Flame className="w-3 h-3 text-orange-300" />, bg: 'from-orange-600 to-red-950', border: 'border-orange-400' },
  4: { icon: <Trophy className="w-3 h-3 text-yellow-300" />, bg: 'from-yellow-600 to-amber-950', border: 'border-yellow-400' },
  5: { icon: <Sparkles className="w-3 h-3 text-purple-300" />, bg: 'from-purple-600 to-fuchsia-950', border: 'border-purple-400' },
  6: { icon: <Gem className="w-3 h-3 text-cyan-300" />, bg: 'from-cyan-600 to-teal-950', border: 'border-cyan-400' },
  7: { icon: <Swords className="w-3 h-3 text-red-300" />, bg: 'from-red-600 to-rose-950', border: 'border-red-400' },
  8: { icon: <Crown className="w-3 h-3 text-emerald-300" />, bg: 'from-emerald-600 to-teal-950', border: 'border-emerald-400' }, // Hero (CO)
  9: { icon: <CircleUser className="w-3 h-3 text-zinc-300" />, bg: 'from-zinc-600 to-slate-950', border: 'border-zinc-400' },
};

// Seat positions in percentage (x, y) relative to table container
// Clockwise sequence: 1 (SB) -> 2 (BB) -> 3 (UTG) -> 4 (UTG+1) -> 5 (UTG+2) -> 6 (LJ) -> 7 (HJ) -> 8 (CO) -> 9 (BTN) -> 1

// 16:9 Landscape Layout positions (Clockwise, pushed outward to keep the felt extremely clean)
export const LANDSCAPE_SEATS: Record<number, { x: number; y: number; btnX: number; btnY: number; posName: PositionName }> = {
  1: { x: 27, y: 89, btnX: 37, btnY: 72, posName: 'SB' },
  2: { x: 8, y: 69, btnX: 25, btnY: 60, posName: 'BB' },
  3: { x: 8, y: 31, btnX: 25, btnY: 40, posName: 'UTG' },
  4: { x: 27, y: 11, btnX: 37, btnY: 28, posName: 'UTG+1' },
  5: { x: 50, y: 8, btnX: 50, btnY: 26, posName: 'UTG+2' },
  6: { x: 73, y: 11, btnX: 63, btnY: 28, posName: 'LJ' },
  7: { x: 92, y: 31, btnX: 75, btnY: 40, posName: 'HJ' },
  8: { x: 92, y: 69, btnX: 75, btnY: 60, posName: 'CO' },
  9: { x: 73, y: 89, btnX: 63, btnY: 72, posName: 'BTN' },
};

// 9:16 Portrait Layout positions (Clockwise, pushed outward to clear the center logo and card areas)
export const PORTRAIT_SEATS: Record<number, { x: number; y: number; btnX: number; btnY: number; posName: PositionName }> = {
  1: { x: 21, y: 91, btnX: 33, btnY: 74, posName: 'SB' },
  2: { x: 7, y: 72, btnX: 24, btnY: 63, posName: 'BB' },
  3: { x: 7, y: 44, btnX: 24, btnY: 37, posName: 'UTG' },
  4: { x: 21, y: 9, btnX: 33, btnY: 29, posName: 'UTG+1' },
  5: { x: 50, y: 6, btnX: 50, btnY: 25, posName: 'UTG+2' },
  6: { x: 79, y: 9, btnX: 67, btnY: 29, posName: 'LJ' },
  7: { x: 93, y: 44, btnX: 76, btnY: 37, posName: 'HJ' },
  8: { x: 93, y: 72, btnX: 76, btnY: 63, posName: 'CO' },
  9: { x: 79, y: 91, btnX: 67, btnY: 74, posName: 'BTN' },
};

const actionStyles: Record<PlayerActionType, { text: string; bg: string; border: string; sound?: string }> = {
  NONE: { text: 'text-transparent', bg: 'bg-transparent', border: 'border-transparent' },
  FOLD: { text: 'text-red-400 font-bold', bg: 'bg-red-950/90', border: 'border-red-800' },
  CHECK: { text: 'text-blue-400 font-bold', bg: 'bg-blue-950/90', border: 'border-blue-800' },
  CALL: { text: 'text-emerald-400 font-bold', bg: 'bg-emerald-950/90', border: 'border-emerald-800' },
  BET: { text: 'text-amber-400 font-bold', bg: 'bg-amber-950/90', border: 'border-amber-700' },
  RAISE: { text: 'text-yellow-400 font-bold', bg: 'bg-yellow-950/90', border: 'border-yellow-600' },
  ALL_IN: { text: 'text-red-100 font-black tracking-wider animate-pulse', bg: 'bg-red-700/95', border: 'border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.7)]' },
};

const actionLabelsFa: Record<PlayerActionType, string> = {
  NONE: '',
  FOLD: 'فولد',
  CHECK: 'چک',
  CALL: 'کال',
  BET: 'بت',
  RAISE: 'ریز',
  ALL_IN: 'آل این',
};

export const PokerTable: React.FC<PokerTableProps> = ({
  players,
  communityCards,
  pot,
  customText,
  cameraZoom,
  highlightedSeat,
  isPortrait,
  onSeatClick,
  activeTurnId,
}) => {
  const seats = isPortrait ? PORTRAIT_SEATS : LANDSCAPE_SEATS;

  // Calculate CSS Transform for Camera Zoom
  let transformStyle = 'scale(1) translate(0%, 0%)';
  if (cameraZoom === 'cards') {
    transformStyle = isPortrait 
      ? 'scale(1.5) translate(0%, 5%)'
      : 'scale(1.7) translate(0%, 8%)';
  } else if (cameraZoom === 'pot') {
    transformStyle = isPortrait
      ? 'scale(1.7) translate(0%, -5%)'
      : 'scale(1.9) translate(0%, -10%)';
  } else if (typeof cameraZoom === 'number') {
    const seatInfo = seats[cameraZoom];
    if (seatInfo) {
      const dx = 50 - seatInfo.x;
      const dy = 50 - seatInfo.y;
      // Dampen translate a bit to keep some table visible
      transformStyle = `scale(1.8) translate(${dx * 0.9}%, ${dy * 0.9}%)`;
    }
  }

  // Find dealer seat
  const dealerPlayer = players.find(p => p.isDealer);

  return (
    <div 
      id="poker-table-wrapper"
      className="relative w-full h-full overflow-hidden flex items-center justify-center bg-zinc-950"
      style={{ perspective: '1200px' }}
    >
      {/* Wooden Outer Ring / Background Board */}
      <div
        id="table-camera-rig"
        className="relative w-full h-full flex items-center justify-center transition-transform duration-1000 ease-out"
        style={{ 
          transform: transformStyle,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* The Outer Table Rim (Walnut Wood Trim) */}
        <div
          id="poker-table-rim"
          className={`absolute rounded-full shadow-[0_25px_60px_rgba(0,0,0,0.8)] border-[12px] border-amber-950 flex items-center justify-center transition-all duration-500`}
          style={{
            width: isPortrait ? '82%' : '88%',
            height: isPortrait ? '93%' : '76%',
            background: 'radial-gradient(circle at center, #2e1a0c 0%, #150903 100%)',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.9), 0 30px 70px rgba(0,0,0,0.9)',
          }}
        >
          {/* Inner Golden Inlay border */}
          <div
            id="poker-table-gold-inlay"
            className="absolute rounded-full w-[99.2%] h-[99.2%] border-2 border-amber-500/40 pointer-events-none"
          />

          {/* Leather Armrest (Dark charcoal padded ring) */}
          <div
            id="poker-table-armrest"
            className="absolute rounded-full w-[98%] h-[98%] border-[16px] border-neutral-900 pointer-events-none shadow-[inset_0_4px_12px_rgba(0,0,0,0.9)]"
          />

          {/* Table Felt (Deep Casino Green) */}
          <div
            id="poker-table-felt"
            className="absolute rounded-full w-[94%] h-[93%] overflow-hidden flex items-center justify-center pointer-events-auto"
            style={{
              background: 'radial-gradient(circle at center, #0B4D2C 0%, #052615 100%)',
              boxShadow: 'inset 0 0 100px rgba(0,0,0,0.85)',
            }}
          >
            {/* Soft Casino Felt Pattern/Texture */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* PokerMagFA Logo in center */}
            <div
              id="poker-mag-fa-logo"
              className="absolute pointer-events-none select-none flex flex-col items-center justify-center opacity-40 text-center"
              style={{
                transform: isPortrait ? 'rotate(0deg) scale(0.95)' : 'scale(1.25)',
                top: isPortrait ? '34%' : '44%',
              }}
            >
              {/* Premium Persian Styled Branding */}
              <div className="flex flex-col items-center justify-center gap-1 font-sans">
                <div dir="rtl" className="flex items-center gap-2.5 text-2xl md:text-3.5xl font-black select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  <span className="text-white">مجله</span>
                  <span className="text-amber-400">پوکر</span>
                  <span className="text-white">فارسی</span>
                </div>
                <div className="flex items-center gap-2.5 mt-1.5 w-[220px] md:w-[280px] justify-center">
                  <div className="h-[1px] bg-gradient-to-r from-transparent to-amber-500/50 flex-1" />
                  <span className="text-red-500 text-[10px] md:text-xs">♦</span>
                  <span className="text-[10px] md:text-xs tracking-[0.25em] font-black text-amber-200/95 uppercase select-none font-mono">
                    POKERMAGFA
                  </span>
                  <span className="text-red-500 text-[10px] md:text-xs">♥</span>
                  <div className="h-[1px] bg-gradient-to-l from-transparent to-amber-500/50 flex-1" />
                </div>
              </div>
            </div>

            {/* Community Cards Area */}
            <div
              id="community-cards-container"
              className="absolute flex items-center gap-1.5 p-2 rounded-xl bg-black/35 border border-white/5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] z-20"
              style={{
                top: isPortrait ? '45%' : '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              {Array.from({ length: 5 }).map((_, idx) => {
                const card = communityCards[idx];
                const cardLabel = idx < 3 ? 'Flop' : idx === 3 ? 'Turn' : 'River';
                return (
                  <div key={idx} className="relative flex flex-col items-center">
                    <AnimatePresence mode="wait">
                      {card ? (
                        <motion.div
                          key={`comm-card-${idx}-${card.value}-${card.suit}`}
                          initial={{ opacity: 0, y: -20, rotateY: 90 }}
                          animate={{ opacity: 1, y: 0, rotateY: 0 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.4 }}
                        >
                          <PokerCard card={card} size={isPortrait ? 'sm' : 'md'} />
                        </motion.div>
                      ) : (
                        <motion.div
                          key={`comm-empty-${idx}`}
                          className={`border border-white/10 border-dashed rounded-md flex items-center justify-center text-[10px] text-white/30 font-sans select-none
                            ${isPortrait ? 'w-10 h-14' : 'w-14 h-20'} bg-black/20`}
                        >
                          {cardLabel}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Total Pot display */}
            <div
              id="pot-container"
              className="absolute flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-950/80 border-2 border-amber-400/40 shadow-lg text-amber-200 font-bold font-mono z-20"
              style={{
                top: isPortrait ? '54%' : '64%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-sans text-amber-300">POT:</span>
              <span className="text-sm tracking-wide text-white">{pot || '0 BB'}</span>
            </div>

            {/* Custom overlay text banner */}
            {customText && (
              <motion.div
                id="custom-table-banner"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute px-5 py-2 rounded-lg bg-black/75 border border-amber-500/30 text-amber-300 font-medium text-center z-20 shadow-2xl max-w-xs md:max-w-md font-sans"
                style={{
                  top: isPortrait ? '61%' : '32%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="text-sm font-sans tracking-wide leading-relaxed text-white">{customText}</div>
              </motion.div>
            )}

            {/* Active Turn glowing sequence indicator (flowing light/ring around table) */}
            {activeTurnId !== null && activeTurnId !== undefined && (
              <div className="absolute inset-4 rounded-full border border-yellow-500/10 pointer-events-none animate-pulse">
                {/* Simulated game play action/decision highlight */}
              </div>
            )}
          </div>
        </div>

        {/* Player Seats & Chips overlaying the rim/felt */}
        {players.map((player) => {
          const pos = seats[player.id];
          if (!pos) return null;

          // Determine if we dim this player (because someone else is highlighted)
          const isDimmed = highlightedSeat !== null && highlightedSeat !== player.id;
          const isCurrentTurn = activeTurnId === player.id || player.isActive;

          const actionConfig = actionStyles[player.currentAction];
          const hasAction = player.currentAction !== 'NONE';

          return (
            <div
              key={player.id}
              id={`player-seat-container-${player.id}`}
              className="absolute z-30 transition-all duration-500 flex flex-col items-center"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                opacity: isDimmed ? 0.35 : 1,
              }}
            >
              {/* Premium Styled Avatar Container */}
              <div className={`relative z-40 -mb-2 flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-b ${SEAT_AVATARS[player.id]?.bg || 'from-zinc-700 to-zinc-900'} border-[1.5px] ${SEAT_AVATARS[player.id]?.border || 'border-zinc-500'} shadow-md`}>
                {SEAT_AVATARS[player.id]?.icon || <CircleUser className="w-3.5 h-3.5 text-zinc-400" />}
                
                {/* Small absolute Position Badge overlapping the avatar bottom */}
                <div className={`absolute -bottom-1 px-1 py-0.5 rounded text-[7px] font-black tracking-wide border shadow-sm scale-90 ${
                  player.isHighlighted
                    ? 'bg-amber-400 text-amber-950 border-amber-300'
                    : isCurrentTurn
                      ? 'bg-yellow-400 text-slate-900 border-yellow-300 animate-pulse'
                      : 'bg-zinc-800 text-zinc-200 border-zinc-600'
                }`}>
                  {player.position}
                </div>
              </div>

              {/* Main Seat Card */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                onClick={() => onSeatClick && onSeatClick(player)}
                className={`relative flex flex-col items-center pt-3 pb-1 px-1 rounded-lg cursor-pointer select-none transition-all duration-300
                  ${player.isHighlighted 
                    ? 'bg-amber-950/95 border-[2px] border-amber-400 shadow-[0_0_12px_rgba(212,175,55,0.5)] text-white' 
                    : isCurrentTurn
                      ? 'bg-emerald-950/90 border-[2px] border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.4)] text-white'
                      : 'bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 shadow-sm text-zinc-100'
                  }
                  ${player.isFolded ? 'opacity-50 saturate-50' : ''}
                  ${isPortrait ? 'w-[72px]' : 'w-[84px]'}
                `}
              >
                {/* Player Name */}
                <span className="text-[10px] font-bold tracking-wide mt-0.5 text-center truncate w-full font-sans">
                  {player.name}
                </span>

                {/* Player Stack/Chips */}
                <span className="text-[9px] text-zinc-400 font-mono font-semibold mt-0.5">
                  {player.chips}
                </span>

                {/* Player Cards (Pocket Cards) */}
                <div className="flex gap-0.5 mt-1.5 justify-center">
                  {player.cards.length > 0 ? (
                    player.cards.map((card, cardIdx) => (
                      <motion.div
                        key={`${player.id}-card-${cardIdx}-${card.value}-${card.suit}`}
                        initial={{ scale: 0, rotate: cardIdx === 0 ? -6 : 6 }}
                        animate={{ scale: 1, rotate: cardIdx === 0 ? -6 : 6 }}
                        className="origin-bottom scale-90"
                      >
                        <PokerCard card={card} size="sm" />
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-[8px] text-zinc-600 italic py-0.5">بدون کارت</div>
                  )}
                </div>

                {/* Dealer Button Token */}
                {player.isDealer && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-2 -top-2 w-5 h-5 rounded-full bg-white border-[1.5px] border-amber-500 flex items-center justify-center font-bold text-slate-950 text-[9px] shadow-sm font-sans z-40"
                    title="Dealer Button"
                  >
                    D
                  </motion.div>
                )}
              </motion.div>

              {/* Quick Action Overlay (Popup badge showing current player action) */}
              <AnimatePresence>
                {hasAction && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, y: -8 }}
                    className={`absolute -bottom-5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded border text-[10px] font-sans font-bold shadow-md text-center whitespace-nowrap z-40 ${actionConfig.bg} ${actionConfig.border}`}
                  >
                    <span className={`${actionConfig.text}`}>
                      {actionLabelsFa[player.currentAction]} {player.actionAmount ? `(${player.actionAmount})` : ''}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
