/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Card, Suit } from '../types';

interface PokerCardProps {
  card: Card;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const suitSymbols: Record<Suit, string> = {
  S: '♠',
  H: '♥',
  D: '♦',
  C: '♣',
};

export const suitNames: Record<Suit, string> = {
  S: 'Spades',
  H: 'Hearts',
  D: 'Diamonds',
  C: 'Clubs',
};

export const suitColors: Record<Suit, { text: string; bg: string; fill: string }> = {
  S: { text: 'text-slate-900', bg: 'bg-slate-100', fill: '#1e293b' },
  H: { text: 'text-red-600', bg: 'bg-red-50', fill: '#dc2626' },
  D: { text: 'text-blue-600', bg: 'bg-blue-50', fill: '#2563eb' }, // 4-color deck Diamond is Blue
  C: { text: 'text-emerald-600', bg: 'bg-emerald-50', fill: '#059669' }, // 4-color deck Club is Green
};

export const PokerCard: React.FC<PokerCardProps> = ({ card, className = '', size = 'md' }) => {
  const { value, suit, isFacedown } = card;

  const sizeClasses = {
    sm: 'w-10 h-14 text-xs rounded-sm shadow-sm',
    md: 'w-14 h-20 text-sm rounded-md shadow-md',
    lg: 'w-20 h-28 text-lg rounded-lg shadow-lg',
  };

  if (isFacedown) {
    return (
      <div
        id={`card-facedown-${value}-${suit}`}
        className={`${sizeClasses[size]} bg-gradient-to-br from-amber-800 to-yellow-950 border-2 border-amber-400 relative overflow-hidden flex items-center justify-center select-none ${className}`}
      >
        {/* Card back pattern */}
        <div className="absolute inset-1 border border-amber-500/30 rounded opacity-60 grid grid-cols-3 grid-rows-3 gap-0.5 p-0.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-amber-500/20 rounded-full" />
          ))}
        </div>
        <div className="relative text-center z-10 flex flex-col items-center">
          <span className="text-[9px] uppercase tracking-widest text-amber-300/80 font-bold font-sans">PMFA</span>
          <span className="text-amber-400 font-bold text-xs">♠♥♦♣</span>
        </div>
      </div>
    );
  }

  const colors = suitColors[suit];
  const symbol = suitSymbols[suit];

  return (
    <div
      id={`card-faceup-${value}-${suit}`}
      className={`${sizeClasses[size]} bg-white border border-slate-200 text-slate-900 relative flex flex-col justify-between p-1.5 select-none font-bold ${className} transition-all hover:-translate-y-1 hover:shadow-xl`}
    >
      {/* Top Left corner value & suit */}
      <div className={`flex flex-col items-center leading-none ${colors.text}`}>
        <span className="text-sm font-sans tracking-tight">{value}</span>
        <span className="text-xs">{symbol}</span>
      </div>

      {/* Center large suit icon */}
      <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
        <span className={`text-4xl ${colors.text}`}>{symbol}</span>
      </div>

      {/* Bottom Right corner value & suit (upside down) */}
      <div className={`flex flex-col items-center leading-none self-end rotate-180 ${colors.text}`}>
        <span className="text-sm font-sans tracking-tight">{value}</span>
        <span className="text-xs">{symbol}</span>
      </div>
    </div>
  );
};
