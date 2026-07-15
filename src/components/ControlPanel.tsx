/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Player, Card, PositionName, Suit, CardValue, Scenario } from '../types';
import { PRESET_SCENARIOS } from './PresetManager';
import { Settings, User, Eye, Layers, Monitor, RotateCcw, PenTool, LayoutTemplate, Film, PlusCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { suitSymbols } from './PokerCard';

interface ControlPanelProps {
  players: Player[];
  communityCards: Card[];
  pot: string;
  customText: string;
  isPortrait: boolean;
  selectedPlayerId: number | null;
  onUpdatePlayer: (id: number, updates: Partial<Player>) => void;
  onUpdateTable: (updates: { communityCards?: Card[]; pot?: string; customText?: string; isPortrait?: boolean }) => void;
  onLoadScenario: (scenario: Scenario) => void;
  onToggleObsMode: () => void;
  isObsMode: boolean;
}

const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
const CARD_VALUES: CardValue[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  players,
  communityCards,
  pot,
  customText,
  isPortrait,
  selectedPlayerId,
  onUpdatePlayer,
  onUpdateTable,
  onLoadScenario,
  onToggleObsMode,
  isObsMode,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'players' | 'table'>('presets');
  const [selectedSeat, setSelectedSeat] = useState<number>(selectedPlayerId || 8);

  // Form states for manual additions
  const [pCard1Val, setPCard1Val] = useState<CardValue>('A');
  const [pCard1Suit, setPCard1Suit] = useState<Suit>('S');
  const [pCard2Val, setPCard2Val] = useState<CardValue>('K');
  const [pCard2Suit, setPCard2Suit] = useState<Suit>('D');

  const selectedPlayer = players.find(p => p.id === selectedSeat);

  const applyCardsToPlayer = () => {
    if (!selectedPlayer) return;
    onUpdatePlayer(selectedSeat, {
      cards: [
        { value: pCard1Val, suit: pCard1Suit, isFacedown: false },
        { value: pCard2Val, suit: pCard2Suit, isFacedown: false },
      ],
    });
  };

  const clearPlayerCards = () => {
    if (!selectedPlayer) return;
    onUpdatePlayer(selectedSeat, { cards: [] });
  };

  const setPlayerAction = (action: any) => {
    if (!selectedPlayer) return;
    onUpdatePlayer(selectedSeat, { currentAction: action });
  };

  const triggerDirectAction = (seatId: number, act: any, amt?: string) => {
    onUpdatePlayer(seatId, { currentAction: act, actionAmount: amt || '' });
  };

  const handleCommunityCardChange = (idx: number, val: CardValue | 'empty', suit?: Suit) => {
    const updated = [...communityCards];
    if (val === 'empty') {
      updated.splice(idx, 1);
    } else if (suit) {
      const newCard: Card = { value: val, suit };
      updated[idx] = newCard;
    }
    onUpdateTable({ communityCards: updated });
  };

  const clearCommunityCards = () => {
    onUpdateTable({ communityCards: [] });
  };

  return (
    <div
      id="control-panel"
      className="h-full bg-zinc-900 border-l border-zinc-800 w-80 md:w-96 flex flex-col text-right font-sans shrink-0 z-40"
    >
      {/* Tab Selector */}
      <div className="flex bg-zinc-950 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5
            ${activeTab === 'presets' ? 'bg-zinc-900 text-amber-400 border-b-2 border-amber-400' : 'text-zinc-400 hover:text-white'}`}
        >
          <Film className="w-3.5 h-3.5" />
          سناریوها
        </button>
        <button
          onClick={() => setActiveTab('players')}
          className={`flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5
            ${activeTab === 'players' ? 'bg-zinc-900 text-amber-400 border-b-2 border-amber-400' : 'text-zinc-400 hover:text-white'}`}
        >
          <User className="w-3.5 h-3.5" />
          کنترل بازیکنان
        </button>
        <button
          onClick={() => setActiveTab('table')}
          className={`flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5
            ${activeTab === 'table' ? 'bg-zinc-900 text-amber-400 border-b-2 border-amber-400' : 'text-zinc-400 hover:text-white'}`}
        >
          <PenTool className="w-3.5 h-3.5" />
          تنظیمات میز
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* TAB 1: PRESET SCENARIOS */}
        {activeTab === 'presets' && (
          <div className="space-y-4">
            <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-800">
              <h3 className="text-xs font-black text-white mb-1 flex items-center gap-1.5">
                <LayoutTemplate className="w-4 h-4 text-amber-400" />
                انتخاب قالب ویدیویی (رزولوشن)
              </h3>
              <p className="text-[10px] text-zinc-500 mb-3 leading-relaxed">
                قالب تصویر را متناسب با رسانه مقصد خود انتخاب کنید: افقی برای یوتیوب/آپارات و عمودی برای اینستاگرام/شورتز.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateTable({ isPortrait: false })}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all
                    ${!isPortrait 
                      ? 'bg-amber-400 border-amber-300 text-amber-950 font-black shadow-md' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                >
                  <Monitor className="w-4 h-4" />
                  یوتیوب (16:9)
                </button>
                <button
                  onClick={() => onUpdateTable({ isPortrait: true })}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all
                    ${isPortrait 
                      ? 'bg-amber-400 border-amber-300 text-amber-950 font-black shadow-md' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                >
                  <Layers className="w-4 h-4" />
                  ریلز / شورتز (9:16)
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-black text-zinc-300">سناریوهای آموزشی پیش‌فرض</h3>
              <p className="text-[10px] text-zinc-500 mb-2 leading-relaxed">
                یکی از سناریوهای آماده زیر را بارگذاری کنید تا مراحل به صورت خودکار در خط زمانی چپ قرار بگیرند. سپس دکمه Play را بزنید.
              </p>

              {PRESET_SCENARIOS.map((scenario, sIdx) => (
                <div
                  key={sIdx}
                  onClick={() => onLoadScenario(scenario)}
                  className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/40 hover:border-amber-500/50 cursor-pointer transition-all group"
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 font-bold font-sans">
                      {scenario.steps.length} مرحله
                    </span>
                    <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                      {scenario.name}
                    </h4>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">{scenario.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-amber-950/20 p-3 rounded-lg border border-amber-900/30 text-amber-200 text-xs space-y-1.5 leading-relaxed">
              <span className="font-bold block text-amber-400">💡 راهنمای ضبط استودیویی:</span>
              <p>۱. یک سناریو آماده را لود کنید یا گام‌به‌گام اضافه نمایید.</p>
              <p>۲. برای ضبط تمیز بدون منوهای اطراف، روی دکمه <strong>"شروع ضبط (OBS)"</strong> کلیک کنید تا تمام پنل‌ها محو شده و فقط میز باقی بماند.</p>
              <p>۳. در حالت فول میز، با استفاده از کلیدهای <strong>Space</strong> (اجرا/توقف) و <strong>کلیدهای چپ/راست</strong> کیبورد می‌توانید صحنه را کنترل کنید.</p>
            </div>
          </div>
        )}

        {/* TAB 2: PLAYERS CONTROL */}
        {activeTab === 'players' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 block">انتخاب بازیکن برای ویرایش:</label>
              <select
                value={selectedSeat}
                onChange={(e) => setSelectedSeat(Number(e.target.value))}
                className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white font-mono font-bold"
              >
                {players.map(p => (
                  <option key={p.id} value={p.id}>
                    صندلی {p.id} - پوزیشن {p.position} ({p.name})
                  </option>
                ))}
              </select>
            </div>

            {selectedPlayer && (
              <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-850 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                  <div className="w-7 h-7 rounded bg-amber-950 text-amber-400 font-black text-xs flex items-center justify-center font-sans">
                    {selectedPlayer.position}
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white block">ویرایش صندلی {selectedPlayer.id}</span>
                    <span className="text-[9px] text-zinc-500 font-mono">Status: {selectedPlayer.chips}</span>
                  </div>
                </div>

                {/* Player Name and Stack */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 block font-bold">نام بازیکن:</label>
                    <input
                      type="text"
                      value={selectedPlayer.name}
                      onChange={(e) => onUpdatePlayer(selectedSeat, { name: e.target.value })}
                      className="w-full p-1.5 bg-zinc-850 border border-zinc-700 rounded text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 block font-bold">میزان چیپ (Stack):</label>
                    <input
                      type="text"
                      value={selectedPlayer.chips}
                      onChange={(e) => onUpdatePlayer(selectedSeat, { chips: e.target.value })}
                      className="w-full p-1.5 bg-zinc-850 border border-zinc-700 rounded text-xs text-white font-mono"
                    />
                  </div>
                </div>

                {/* Dealer and Highlight Toggles */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      // Set this player as dealer, turn off for others
                      players.forEach(p => onUpdatePlayer(p.id, { isDealer: p.id === selectedSeat }));
                    }}
                    className={`py-1.5 rounded text-[11px] font-bold border transition-all
                      ${selectedPlayer.isDealer 
                        ? 'bg-amber-500 text-amber-950 border-amber-400' 
                        : 'bg-zinc-900 border-zinc-700 text-zinc-300'}`}
                  >
                    دکمه دیلر (D)
                  </button>
                  <button
                    onClick={() => onUpdatePlayer(selectedSeat, { isHighlighted: !selectedPlayer.isHighlighted })}
                    className={`py-1.5 rounded text-[11px] font-bold border transition-all
                      ${selectedPlayer.isHighlighted 
                        ? 'bg-amber-500 text-amber-950 border-amber-400' 
                        : 'bg-zinc-900 border-zinc-700 text-zinc-300'}`}
                  >
                    هایلایت صندلی
                  </button>
                </div>

                {/* Cards Selector */}
                <div className="space-y-2 border-t border-zinc-800 pt-3">
                  <span className="text-[10px] text-zinc-400 font-bold block">توزیع کارت مستقیم:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Card 1 */}
                    <div className="bg-zinc-900 p-1.5 rounded border border-zinc-800 flex flex-col gap-1">
                      <span className="text-[9px] text-zinc-500">کارت اول</span>
                      <div className="flex gap-1">
                        <select
                          value={pCard1Val}
                          onChange={(e) => setPCard1Val(e.target.value as CardValue)}
                          className="bg-zinc-800 text-white text-xs p-1 rounded font-mono font-bold flex-1"
                        >
                          {CARD_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                        <select
                          value={pCard1Suit}
                          onChange={(e) => setPCard1Suit(e.target.value as Suit)}
                          className="bg-zinc-800 text-white text-[10px] p-1 rounded flex-1"
                        >
                          {SUITS.map(s => <option key={s} value={s}>{suitSymbols[s]} {s}</option>)}
                        </select>
                      </div>
                    </div>
                    {/* Card 2 */}
                    <div className="bg-zinc-900 p-1.5 rounded border border-zinc-800 flex flex-col gap-1">
                      <span className="text-[9px] text-zinc-500">کارت دوم</span>
                      <div className="flex gap-1">
                        <select
                          value={pCard2Val}
                          onChange={(e) => setPCard2Val(e.target.value as CardValue)}
                          className="bg-zinc-800 text-white text-xs p-1 rounded font-mono font-bold flex-1"
                        >
                          {CARD_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                        <select
                          value={pCard2Suit}
                          onChange={(e) => setPCard2Suit(e.target.value as Suit)}
                          className="bg-zinc-800 text-white text-[10px] p-1 rounded flex-1"
                        >
                          {SUITS.map(s => <option key={s} value={s}>{suitSymbols[s]} {s}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={applyCardsToPlayer}
                      className="py-1 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded text-[11px]"
                    >
                      ثبت کارت‌ها
                    </button>
                    <button
                      onClick={clearPlayerCards}
                      className="py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded text-[11px]"
                    >
                      پاک کردن کارت
                    </button>
                  </div>
                </div>

                {/* Instant Actions for Player */}
                <div className="space-y-1.5 border-t border-zinc-800 pt-3">
                  <span className="text-[10px] text-zinc-400 font-bold block">اکشن‌های آنی (اجرای انیمیشن):</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => triggerDirectAction(selectedSeat, 'FOLD')}
                      className="py-1.5 bg-red-950/60 hover:bg-red-950 text-red-400 border border-red-900 rounded text-[10px] font-bold"
                    >
                      فولد
                    </button>
                    <button
                      onClick={() => triggerDirectAction(selectedSeat, 'CHECK')}
                      className="py-1.5 bg-blue-950/60 hover:bg-blue-950 text-blue-400 border border-blue-900 rounded text-[10px] font-bold"
                    >
                      چک
                    </button>
                    <button
                      onClick={() => triggerDirectAction(selectedSeat, 'CALL', 'کال')}
                      className="py-1.5 bg-emerald-950/60 hover:bg-emerald-950 text-emerald-400 border border-emerald-900 rounded text-[10px] font-bold"
                    >
                      کال
                    </button>
                    <button
                      onClick={() => triggerDirectAction(selectedSeat, 'BET', '3 BB')}
                      className="py-1.5 bg-yellow-950/60 hover:bg-yellow-950 text-yellow-300 border border-yellow-900 rounded text-[10px] font-bold"
                    >
                      بت (Bet)
                    </button>
                    <button
                      onClick={() => triggerDirectAction(selectedSeat, 'RAISE', '7 BB')}
                      className="py-1.5 bg-amber-950/60 hover:bg-amber-950 text-amber-300 border border-amber-900 rounded text-[10px] font-bold"
                    >
                      ریز (Raise)
                    </button>
                    <button
                      onClick={() => triggerDirectAction(selectedSeat, 'ALL_IN', '100 BB')}
                      className="py-1.5 bg-red-700 hover:bg-red-600 text-white rounded text-[10px] font-black"
                    >
                      آل-این
                    </button>
                  </div>
                  <button
                    onClick={() => triggerDirectAction(selectedSeat, 'NONE')}
                    className="w-full mt-1.5 py-1 text-zinc-500 hover:text-white text-[9px] hover:bg-zinc-900 rounded"
                  >
                    پاک کردن اکشن بازیکن
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TABLE SETTINGS */}
        {activeTab === 'table' && (
          <div className="space-y-4">
            {/* Custom overlay text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 block">توضیحات و متن روی میز:</label>
              <textarea
                value={customText}
                onChange={(e) => onUpdateTable({ customText: e.target.value })}
                placeholder="یک متن بنویسید تا وسط میز پوکر نمایش داده شود..."
                rows={3}
                className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white leading-relaxed"
              />
            </div>

            {/* Pot amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 block">مقدار پات وسط میز (Pot):</label>
              <input
                type="text"
                value={pot}
                onChange={(e) => onUpdateTable({ pot: e.target.value })}
                placeholder="E.g. 15.5 BB"
                className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white font-mono"
              />
            </div>

            {/* Community cards manager */}
            <div className="space-y-2 border-t border-zinc-800 pt-3">
              <span className="text-xs font-bold text-zinc-300 block">کارت‌های روی زمین (Community Cards):</span>

              <div className="space-y-2 bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const currentCard = communityCards[idx];
                  const label = idx < 3 ? `فلاپ ${idx + 1}` : idx === 3 ? 'ترن (Turn)' : 'ریور (River)';

                  return (
                    <div key={idx} className="flex items-center justify-between gap-2 border-b border-zinc-800/50 pb-1.5 last:border-0 last:pb-0">
                      <span className="text-[10px] text-zinc-400 font-bold">{label}:</span>

                      <div className="flex gap-1">
                        <select
                          value={currentCard?.value || 'empty'}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'empty') {
                              handleCommunityCardChange(idx, 'empty');
                            } else {
                              handleCommunityCardChange(idx, val as CardValue, currentCard?.suit || 'S');
                            }
                          }}
                          className="bg-zinc-800 text-white text-[11px] p-1 rounded font-mono font-bold"
                        >
                          <option value="empty">خالی</option>
                          {CARD_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>

                        {currentCard && (
                          <select
                            value={currentCard.suit}
                            onChange={(e) => handleCommunityCardChange(idx, currentCard.value, e.target.value as Suit)}
                            className="bg-zinc-800 text-white text-[10px] p-1 rounded"
                          >
                            {SUITS.map(s => <option key={s} value={s}>{suitSymbols[s]} {s}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={clearCommunityCards}
                  className="w-full mt-2 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-[10px] font-bold rounded"
                >
                  پاک کردن تمام کارت‌های زمین
                </button>
              </div>
            </div>

            {/* Quick table reset */}
            <button
              onClick={() => {
                onUpdateTable({
                  communityCards: [],
                  pot: '0 BB',
                  customText: '',
                });
                players.forEach(p => onUpdatePlayer(p.id, {
                  cards: [],
                  currentAction: 'NONE',
                  isFolded: false,
                  isActive: false,
                  isHighlighted: false,
                }));
              }}
              className="w-full py-2 bg-zinc-950 hover:bg-red-950 text-zinc-500 hover:text-red-400 border border-zinc-800 hover:border-red-900 transition-all rounded-lg text-xs font-bold"
            >
              پاک‌سازی کامل کل میز پوکر
            </button>
          </div>
        )}
      </div>

      {/* OBS Recording Button */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950 flex flex-col gap-1.5">
        <button
          onClick={onToggleObsMode}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          <Film className="w-4 h-4 animate-pulse" />
          شروع حالت ضبط (OBS Fullscreen)
        </button>
        <span className="text-[9px] text-zinc-500 text-center leading-relaxed font-sans">
          تمام منوهای کناری را برای یک ضبط پاک و ایده آل در OBS پنهان می‌کند.
        </span>
      </div>
    </div>
  );
};
