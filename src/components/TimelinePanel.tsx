/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TimelineStep, TimelineStepType, PlayerActionType, Card, PositionName, Suit, CardValue } from '../types';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Plus, Trash2, ArrowUp, ArrowDown, FileDown, FileUp, ListRestart, HelpCircle, Eye, EyeOff } from 'lucide-react';

interface TimelinePanelProps {
  steps: TimelineStep[];
  currentStepIndex: number;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  onAddStep: (step: TimelineStep) => void;
  onDeleteStep: (id: string) => void;
  onMoveStep: (index: number, direction: 'up' | 'down') => void;
  onSelectStep: (index: number) => void;
  onClearAll: () => void;
  onImportScenario: (steps: TimelineStep[]) => void;
}

const STEP_TYPES: Record<TimelineStepType, string> = {
  SET_DEALER: 'حرکت دکمه دیلر',
  PLAYER_ACTION: 'اکشن بازیکن',
  SET_CARDS: 'کارت‌های بازیکن',
  REVEAL_COMMUNITY: 'کارت‌های زمین',
  SET_POT: 'مقدار پات',
  SET_TEXT: 'متن توضیحات',
  HIGHLIGHT_SEAT: 'هایلایت صندلی',
  CAMERA_ZOOM: 'زووم دوربین',
  DELAY: 'مکث زمانی',
};

const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
const SUIT_LABELS: Record<Suit, string> = { S: '♠ Spades', H: '♥ Hearts', D: '♦ Diamonds', C: '♣ Clubs' };
const CARD_VALUES: CardValue[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  steps,
  currentStepIndex,
  isPlaying,
  onPlayToggle,
  onStepForward,
  onStepBackward,
  onReset,
  onAddStep,
  onDeleteStep,
  onMoveStep,
  onSelectStep,
  onClearAll,
  onImportScenario,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states for creating a new step
  const [stepType, setStepType] = useState<TimelineStepType>('PLAYER_ACTION');
  const [seatId, setSeatId] = useState<number>(3);
  const [actionType, setActionType] = useState<PlayerActionType>('RAISE');
  const [actionAmount, setActionAmount] = useState<string>('2.5 BB');
  const [customText, setCustomText] = useState<string>('');
  const [potValue, setPotValue] = useState<string>('10 BB');
  const [zoomTarget, setZoomTarget] = useState<'table' | 'cards' | 'pot' | number>('table');
  const [delayMs, setDelayMs] = useState<number>(2000);

  // Card construction state
  const [card1Value, setCard1Value] = useState<CardValue>('A');
  const [card1Suit, setCard1Suit] = useState<Suit>('S');
  const [card2Value, setCard2Value] = useState<CardValue>('K');
  const [card2Suit, setCard2Suit] = useState<Suit>('D');

  // Community cards build state
  const [commCardCount, setCommCardCount] = useState<3 | 1 | 2>(3);
  const [c1Value, setC1Value] = useState<CardValue>('A');
  const [c1Suit, setC1Suit] = useState<Suit>('H');
  const [c2Value, setC2Value] = useState<CardValue>('K');
  const [c2Suit, setC2Suit] = useState<Suit>('C');
  const [c3Value, setC3Value] = useState<CardValue>('7');
  const [c3Suit, setC3Suit] = useState<Suit>('S');

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(steps, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'poker-magfa-scenario.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onImportScenario(parsed);
          } else {
            alert('فرمت فایل نامعتبر است. باید آرایه‌ای از استپ‌ها باشد.');
          }
        } catch (err) {
          alert('خطا در خواندن فایل سناریو.');
        }
      };
    }
  };

  const submitNewStep = (e: React.FormEvent) => {
    e.preventDefault();

    let description = '';
    let stepPayload: Partial<TimelineStep> = {
      id: Math.random().toString(36).substring(2, 9),
      type: stepType,
    };

    switch (stepType) {
      case 'SET_DEALER':
        stepPayload.seatId = seatId;
        description = `تنظیم دیلر روی صندلی ${seatId}`;
        break;
      case 'PLAYER_ACTION':
        stepPayload.seatId = seatId;
        stepPayload.actionType = actionType;
        stepPayload.actionAmount = actionAmount;
        const actLabel = actionType === 'NONE' ? 'پاک کردن اکشن' : actionType;
        description = `اکشن صندلی ${seatId}: ${actLabel} ${actionAmount ? `(${actionAmount})` : ''}`;
        break;
      case 'SET_CARDS':
        stepPayload.seatId = seatId;
        stepPayload.playerCards = [
          { value: card1Value, suit: card1Suit, isFacedown: false },
          { value: card2Value, suit: card2Suit, isFacedown: false },
        ];
        description = `کارت‌های صندلی ${seatId}: ${card1Value}${card1Suit} ${card2Value}${card2Suit}`;
        break;
      case 'REVEAL_COMMUNITY':
        const revealedCards: Card[] = [];
        if (commCardCount >= 1) revealedCards.push({ value: c1Value, suit: c1Suit });
        if (commCardCount >= 2) revealedCards.push({ value: c2Value, suit: c2Suit });
        if (commCardCount >= 3) revealedCards.push({ value: c3Value, suit: c3Suit });
        stepPayload.cardsToReveal = revealedCards;
        description = `کارت‌های زمین: ${revealedCards.map(c => `${c.value}${c.suit}`).join(' ')}`;
        break;
      case 'SET_POT':
        stepPayload.potValue = potValue;
        description = `بروزرسانی پات به ${potValue}`;
        break;
      case 'SET_TEXT':
        stepPayload.customText = customText;
        description = `نمایش متن: "${customText.substring(0, 25)}${customText.length > 25 ? '...' : ''}"`;
        break;
      case 'HIGHLIGHT_SEAT':
        stepPayload.seatId = seatId;
        description = `هایلایت صندلی ${seatId}`;
        break;
      case 'CAMERA_ZOOM':
        stepPayload.zoomTarget = zoomTarget;
        const zoomDesc = zoomTarget === 'table' ? 'نمای کل میز' : zoomTarget === 'cards' ? 'کارت‌های زمین' : zoomTarget === 'pot' ? 'پات' : `صندلی ${zoomTarget}`;
        description = `زوم دوربین روی: ${zoomDesc}`;
        break;
      case 'DELAY':
        stepPayload.delayMs = delayMs;
        description = `مکث به مدت ${delayMs / 1000} ثانیه`;
        break;
    }

    onAddStep({
      ...stepPayload,
      description,
    } as TimelineStep);

    setShowAddForm(false);
  };

  return (
    <div
      id="timeline-panel"
      className={`h-full bg-zinc-900 border-r border-zinc-800 flex flex-col transition-all duration-300 z-40 text-right font-sans ${
        isOpen ? 'w-80 md:w-96' : 'w-12'
      }`}
    >
      {/* Sidebar Header / Toggle */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-950/80">
        {isOpen && (
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-lg">🎬</span>
            <span className="font-bold text-sm text-white tracking-wide font-sans">سناریوی تایم‌لاین (Timeline)</span>
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors mx-auto"
          title={isOpen ? 'بستن پنل سناریو' : 'باز کردن پنل سناریو'}
        >
          {isOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {!isOpen ? (
        <div className="flex-1 flex flex-col items-center gap-6 py-8 text-zinc-500">
          <div className="rotate-90 origin-center whitespace-nowrap font-bold text-xs tracking-widest uppercase py-4">
            TIMELINE SCENARIO
          </div>
          <button 
            onClick={onPlayToggle} 
            className={`p-2 rounded-full ${isPlaying ? 'bg-red-600 text-white' : 'bg-amber-500 text-zinc-950'} hover:opacity-90`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Controls Header */}
          <div className="p-3 bg-zinc-950/30 border-b border-zinc-800 flex flex-wrap gap-2 items-center justify-between">
            {/* Playback cluster */}
            <div className="flex items-center gap-1">
              <button
                onClick={onReset}
                className="p-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                title="بازنشانی سناریو"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={onStepBackward}
                className="p-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                title="گام قبلی"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={onPlayToggle}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-bold transition-all
                  ${isPlaying 
                    ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse' 
                    : 'bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-md'
                  }`}
                title={isPlaying ? 'توقف پخش' : 'اجرای سناریو'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isPlaying ? 'توقف' : 'اجرا'}
              </button>
              <button
                onClick={onStepForward}
                className="p-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                title="گام بعدی"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Config & File cluster */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleExport}
                className="p-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                title="خروجی JSON"
              >
                <FileDown className="w-4 h-4" />
              </button>
              <label
                className="p-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white cursor-pointer transition-colors"
                title="وارد کردن سناریو"
              >
                <FileUp className="w-4 h-4" />
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
              <button
                onClick={onClearAll}
                className="p-2 rounded bg-zinc-900 border border-red-950 hover:bg-red-950 text-red-400 transition-colors"
                title="پاک کردن کل مراحل"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Current index status banner */}
          <div className="bg-zinc-950/60 px-4 py-1.5 text-[11px] text-zinc-400 flex justify-between items-center border-b border-zinc-800 font-mono">
            <span>مرحله {steps.length > 0 ? currentStepIndex + 1 : 0} از {steps.length}</span>
            <span className="text-amber-500 font-bold font-sans">
              {isPlaying ? 'در حال پخش خودکار...' : 'توقف پخش'}
            </span>
          </div>

          {/* Steps List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 select-none">
            {steps.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500">
                <ListRestart className="w-8 h-8 text-zinc-700 mb-2" />
                <p className="text-sm font-semibold mb-1">هیچ مرحله‌ای ثبت نشده است</p>
                <p className="text-xs text-zinc-600">می‌توانید سناریوهای پیش‌فرض را بارگذاری کرده یا خودتان مرحله اضافه کنید.</p>
              </div>
            ) : (
              steps.map((step, idx) => {
                const isActive = idx === currentStepIndex;
                const isPassed = idx < currentStepIndex;

                return (
                  <div
                    key={step.id}
                    onClick={() => onSelectStep(idx)}
                    className={`group p-2.5 rounded-lg border text-right transition-all duration-200 cursor-pointer flex justify-between items-center
                      ${isActive
                        ? 'bg-amber-950/40 border-amber-500/80 shadow-[inset_0_1px_8px_rgba(212,175,55,0.15)] text-white'
                        : isPassed
                          ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                          : 'bg-zinc-900 border-zinc-850 hover:border-zinc-700 text-zinc-200'
                      }
                    `}
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      {/* Step index */}
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono mt-0.5 shrink-0
                        ${isActive ? 'bg-amber-400 text-amber-950' : 'bg-zinc-800 text-zinc-400'}`}
                      >
                        {idx + 1}
                      </span>

                      {/* Step Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans font-bold
                            ${isActive ? 'bg-amber-950 text-amber-300' : 'bg-zinc-800 text-zinc-400'}`}
                          >
                            {STEP_TYPES[step.type]}
                          </span>
                        </div>
                        <p className="text-xs font-medium mt-1 truncate leading-relaxed">{step.description}</p>
                      </div>
                    </div>

                    {/* Step Action Buttons (Up, Down, Delete) */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0 mr-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); onMoveStep(idx, 'up'); }}
                        className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                        title="انتقال به بالا"
                        disabled={idx === 0}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onMoveStep(idx, 'down'); }}
                        className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                        title="انتقال به پایین"
                        disabled={idx === steps.length - 1}
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteStep(step.id); }}
                        className="p-1 rounded bg-red-950 hover:bg-red-900 text-red-400"
                        title="حذف مرحله"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Add Step button & overlay form */}
          <div className="p-3 border-t border-zinc-800 bg-zinc-950/40">
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-black rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                افزودن مرحله جدید به سناریو
              </button>
            ) : (
              <form onSubmit={submitNewStep} className="bg-zinc-900 p-3 rounded-lg border border-zinc-700 space-y-3 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                  <span className="text-xs font-bold text-amber-400">ساخت مرحله جدید</span>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-[10px] text-zinc-400 hover:text-white"
                  >
                    انصراف
                  </button>
                </div>

                {/* Step Type Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold block">نوع اقدام / مرحله:</label>
                  <select
                    value={stepType}
                    onChange={(e) => setStepType(e.target.value as TimelineStepType)}
                    className="w-full p-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-white"
                  >
                    {Object.entries(STEP_TYPES).map(([type, label]) => (
                      <option key={type} value={type}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Conditional Fields based on Step Type */}
                {(stepType === 'SET_DEALER' || stepType === 'PLAYER_ACTION' || stepType === 'SET_CARDS' || stepType === 'HIGHLIGHT_SEAT') && (
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 block font-bold">انتخاب صندلی / بازیکن:</label>
                    <select
                      value={seatId}
                      onChange={(e) => setSeatId(Number(e.target.value))}
                      className="w-full p-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-white font-mono"
                    >
                      <option value="1">صندلی ۱ - Small Blind (SB)</option>
                      <option value="2">صندلی ۲ - Big Blind (BB)</option>
                      <option value="3">صندلی ۳ - UTG</option>
                      <option value="4">صندلی ۴ - UTG+1</option>
                      <option value="5">صندلی ۵ - UTG+2</option>
                      <option value="6">صندلی ۶ - Lojack (LJ)</option>
                      <option value="7">صندلی ۷ - Hijack (HJ)</option>
                      <option value="8">صندلی ۸ - Cutoff (CO)</option>
                      <option value="9">صندلی ۹ - Button (BTN)</option>
                    </select>
                  </div>
                )}

                {stepType === 'PLAYER_ACTION' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 block font-bold">نوع اکشن:</label>
                      <select
                        value={actionType}
                        onChange={(e) => setActionType(e.target.value as PlayerActionType)}
                        className="w-full p-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-white"
                      >
                        <option value="NONE">پاک کردن اکشن</option>
                        <option value="FOLD">FOLD (فولد)</option>
                        <option value="CHECK">CHECK (چک)</option>
                        <option value="CALL">CALL (کال)</option>
                        <option value="BET">BET (شرط)</option>
                        <option value="RAISE">RAISE (افزایش)</option>
                        <option value="ALL_IN">ALL IN (آل-این)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 block font-bold">میزان چیپ/ژتون:</label>
                      <input
                        type="text"
                        value={actionAmount}
                        onChange={(e) => setActionAmount(e.target.value)}
                        placeholder="E.g. 2.5 BB"
                        className="w-full p-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                )}

                {stepType === 'SET_CARDS' && (
                  <div className="space-y-2 border border-zinc-800 p-2 rounded">
                    <span className="text-[10px] text-amber-500 font-bold block">تنظیم دو کارت برای بازیکن:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-400 block">کارت اول:</label>
                        <div className="flex gap-1">
                          <select
                            value={card1Value}
                            onChange={(e) => setCard1Value(e.target.value as CardValue)}
                            className="p-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white flex-1 font-mono font-bold"
                          >
                            {CARD_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                          <select
                            value={card1Suit}
                            onChange={(e) => setCard1Suit(e.target.value as Suit)}
                            className="p-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white flex-1"
                          >
                            {SUITS.map(s => <option key={s} value={s}>{SUIT_LABELS[s]}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-400 block">کارت دوم:</label>
                        <div className="flex gap-1">
                          <select
                            value={card2Value}
                            onChange={(e) => setCard2Value(e.target.value as CardValue)}
                            className="p-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white flex-1 font-mono font-bold"
                          >
                            {CARD_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                          <select
                            value={card2Suit}
                            onChange={(e) => setCard2Suit(e.target.value as Suit)}
                            className="p-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white flex-1"
                          >
                            {SUITS.map(s => <option key={s} value={s}>{SUIT_LABELS[s]}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {stepType === 'REVEAL_COMMUNITY' && (
                  <div className="space-y-2 border border-zinc-800 p-2 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-amber-500 font-bold">کارت‌های زمین:</span>
                      <select
                        value={commCardCount}
                        onChange={(e) => setCommCardCount(Number(e.target.value) as any)}
                        className="p-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-white"
                      >
                        <option value="3">Flop (۳ کارت)</option>
                        <option value="1">Turn (۱ کارت)</option>
                        <option value="2">River / دو کارت</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-400 block">کارت اول:</label>
                        <select
                          value={c1Value}
                          onChange={(e) => setC1Value(e.target.value as CardValue)}
                          className="w-full p-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white font-mono font-bold"
                        >
                          {CARD_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                        <select
                          value={c1Suit}
                          onChange={(e) => setC1Suit(e.target.value as Suit)}
                          className="w-full p-1 bg-zinc-800 border border-zinc-700 rounded text-[9px] text-white"
                        >
                          {SUITS.map(s => <option key={s} value={s}>{SUIT_LABELS[s]}</option>)}
                        </select>
                      </div>

                      {commCardCount >= 2 && (
                        <div className="space-y-1">
                          <label className="text-[9px] text-zinc-400 block">کارت دوم:</label>
                          <select
                            value={c2Value}
                            onChange={(e) => setC2Value(e.target.value as CardValue)}
                            className="w-full p-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white font-mono font-bold"
                          >
                            {CARD_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                          <select
                            value={c2Suit}
                            onChange={(e) => setC2Suit(e.target.value as Suit)}
                            className="w-full p-1 bg-zinc-800 border border-zinc-700 rounded text-[9px] text-white"
                          >
                            {SUITS.map(s => <option key={s} value={s}>{SUIT_LABELS[s]}</option>)}
                          </select>
                        </div>
                      )}

                      {commCardCount >= 3 && (
                        <div className="space-y-1">
                          <label className="text-[9px] text-zinc-400 block">کارت سوم:</label>
                          <select
                            value={c3Value}
                            onChange={(e) => setC3Value(e.target.value as CardValue)}
                            className="w-full p-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white font-mono font-bold"
                          >
                            {CARD_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                          <select
                            value={c3Suit}
                            onChange={(e) => setC3Suit(e.target.value as Suit)}
                            className="w-full p-1 bg-zinc-800 border border-zinc-700 rounded text-[9px] text-white"
                          >
                            {SUITS.map(s => <option key={s} value={s}>{SUIT_LABELS[s]}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {stepType === 'SET_POT' && (
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 block font-bold">مجموع پات:</label>
                    <input
                      type="text"
                      value={potValue}
                      onChange={(e) => setPotValue(e.target.value)}
                      placeholder="مثال: 45 BB"
                      className="w-full p-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-white font-mono"
                    />
                  </div>
                )}

                {stepType === 'SET_TEXT' && (
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 block font-bold">متن نمایشی روی میز:</label>
                    <textarea
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="متن کوتاه آموزشی..."
                      rows={2}
                      className="w-full p-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-white"
                    />
                  </div>
                )}

                {stepType === 'CAMERA_ZOOM' && (
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 block font-bold">هدف زووم دوربین:</label>
                    <select
                      value={typeof zoomTarget === 'string' ? zoomTarget : `seat-${zoomTarget}`}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.startsWith('seat-')) {
                          setZoomTarget(Number(val.replace('seat-', '')));
                        } else {
                          setZoomTarget(val as any);
                        }
                      }}
                      className="w-full p-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-white"
                    >
                      <option value="table">کل میز پوکر (عادی)</option>
                      <option value="cards">کارت‌های روی زمین (Community Cards)</option>
                      <option value="pot">پات وسط زمین</option>
                      <option value="seat-1">صندلی ۱ (Small Blind)</option>
                      <option value="seat-2">صندلی ۲ (Big Blind)</option>
                      <option value="seat-3">صندلی ۳ (UTG)</option>
                      <option value="seat-4">صندلی ۴ (UTG+1)</option>
                      <option value="seat-5">صندلی ۵ (UTG+2)</option>
                      <option value="seat-6">صندلی ۶ (LJ)</option>
                      <option value="seat-7">صندلی ۷ (HJ)</option>
                      <option value="seat-8">صندلی ۸ (CO - Hero)</option>
                      <option value="seat-9">صندلی ۹ (Button)</option>
                    </select>
                  </div>
                )}

                {stepType === 'DELAY' && (
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 block font-bold">مدت مکث (میلی‌ثانیه):</label>
                    <input
                      type="number"
                      value={delayMs}
                      onChange={(e) => setDelayMs(Number(e.target.value))}
                      step="500"
                      min="500"
                      className="w-full p-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-white font-mono"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded text-xs font-bold font-sans"
                >
                  تایید و اضافه کردن به مراحل
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
