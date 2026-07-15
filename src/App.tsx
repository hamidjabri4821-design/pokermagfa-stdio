/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Player, Card, TableState, TimelineStep, Scenario } from './types';
import { getInitialPlayers, PRESET_SCENARIOS } from './components/PresetManager';
import { PokerTable } from './components/PokerTable';
import { TimelinePanel } from './components/TimelinePanel';
import { ControlPanel } from './components/ControlPanel';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Monitor, Layers, Eye, EyeOff, Film, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Base State - editable when not running/before step actions
  const [basePlayers, setBasePlayers] = useState<Player[]>(getInitialPlayers());
  const [baseTable, setBaseTable] = useState<{ communityCards: Card[]; pot: string; customText: string }>({
    communityCards: [],
    pot: '0 BB',
    customText: '',
  });

  // Presentation settings
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [isObsMode, setIsObsMode] = useState<boolean>(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(8); // CO player selected by default

  // Timeline Scenario State
  const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1); // -1 means initial setup
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(2500); // ms per step

  // Floating OBS controls hover/autohide state
  const [showFloatingControls, setShowFloatingControls] = useState<boolean>(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize with the first preset scenario automatically on load
  useEffect(() => {
    if (PRESET_SCENARIOS.length > 0) {
      loadScenario(PRESET_SCENARIOS[0]);
    }
  }, []);

  // Keyboard controls listener (Space = play/pause, Right = next, Left = prev, Esc = exit OBS)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keypresses if the user is typing inside an input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleStepForward();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleStepBackward();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        setIsObsMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [timelineSteps, currentStepIndex]);

  // Autoplay handler
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying) {
      if (currentStepIndex < timelineSteps.length - 1) {
        timer = setTimeout(() => {
          setCurrentStepIndex(prev => prev + 1);
        }, playbackSpeed);
      } else {
        setIsPlaying(false);
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPlaying, currentStepIndex, timelineSteps, playbackSpeed]);

  // Handle OBS floating controls auto-hide on mouse stand-still
  useEffect(() => {
    if (!isObsMode) return;

    const handleMouseMove = () => {
      setShowFloatingControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowFloatingControls(false);
      }, 2500); // hide after 2.5s of stillness
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isObsMode]);

  // Derive current rendered state by sequentially evaluating steps 0 to currentStepIndex
  const getRenderedState = () => {
    // Start with a clone of the base state
    const playersCopy = JSON.parse(JSON.stringify(basePlayers)) as Player[];
    const tableCopy = {
      communityCards: [...baseTable.communityCards],
      pot: baseTable.pot,
      customText: baseTable.customText,
      cameraZoom: 'table' as 'table' | 'cards' | 'pot' | number,
      highlightedSeat: null as number | null,
    };

    // If step index is valid, sequentially apply steps up to currentStepIndex
    if (currentStepIndex >= 0 && currentStepIndex < timelineSteps.length) {
      for (let i = 0; i <= currentStepIndex; i++) {
        const step = timelineSteps[i];
        applyStepToState(playersCopy, tableCopy, step);
      }
    }

    return {
      players: playersCopy,
      communityCards: tableCopy.communityCards,
      pot: tableCopy.pot,
      customText: tableCopy.customText,
      cameraZoom: tableCopy.cameraZoom,
      highlightedSeat: tableCopy.highlightedSeat,
    };
  };

  // Mutates player and table state clones in-place according to step definitions
  const applyStepToState = (
    players: Player[],
    table: { communityCards: Card[]; pot: string; customText: string; cameraZoom: any; highlightedSeat: number | null },
    step: TimelineStep
  ) => {
    switch (step.type) {
      case 'SET_DEALER':
        players.forEach(p => {
          p.isDealer = p.id === step.seatId;
        });
        break;
      case 'PLAYER_ACTION':
        players.forEach(p => {
          if (p.id === step.seatId) {
            p.currentAction = step.actionType || 'NONE';
            p.actionAmount = step.actionAmount || '';
            if (step.actionType === 'FOLD') {
              p.isFolded = true;
            }
            p.isActive = true;
          } else {
            p.isActive = false;
          }
        });
        break;
      case 'SET_CARDS':
        players.forEach(p => {
          if (p.id === step.seatId) {
            p.cards = step.playerCards || [];
            p.isFolded = false; // reset folded state if we configure cards
          }
        });
        break;
      case 'REVEAL_COMMUNITY':
        // Overwrite or append cards
        table.communityCards = [...table.communityCards, ...(step.cardsToReveal || [])].slice(0, 5);
        break;
      case 'SET_POT':
        table.pot = step.potValue || '0 BB';
        break;
      case 'SET_TEXT':
        table.customText = step.customText || '';
        break;
      case 'HIGHLIGHT_SEAT':
        table.highlightedSeat = step.seatId || null;
        players.forEach(p => {
          p.isHighlighted = p.id === step.seatId;
        });
        break;
      case 'CAMERA_ZOOM':
        table.cameraZoom = step.zoomTarget || 'table';
        break;
      case 'DELAY':
        // Delay logic handled at runtime
        break;
    }
  };

  const handleStepForward = () => {
    if (currentStepIndex < timelineSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleStepBackward = () => {
    if (currentStepIndex >= 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(-1);
  };

  const loadScenario = (scenario: Scenario) => {
    // Reset players first to default starting configurations
    const freshPlayers = getInitialPlayers();
    setBasePlayers(freshPlayers);
    setBaseTable({
      communityCards: [],
      pot: '0 BB',
      customText: '',
    });

    setTimelineSteps(scenario.steps);
    setCurrentStepIndex(-1);
    setIsPlaying(false);
  };

  const handleAddStep = (step: TimelineStep) => {
    setTimelineSteps(prev => [...prev, step]);
  };

  const handleDeleteStep = (id: string) => {
    const deletedIdx = timelineSteps.findIndex(s => s.id === id);
    setTimelineSteps(prev => prev.filter(s => s.id !== id));
    if (currentStepIndex >= deletedIdx) {
      setCurrentStepIndex(prev => Math.max(-1, prev - 1));
    }
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === timelineSteps.length - 1) return;

    const swapTarget = direction === 'up' ? index - 1 : index + 1;
    const stepsCopy = [...timelineSteps];
    const temp = stepsCopy[index];
    stepsCopy[index] = stepsCopy[swapTarget];
    stepsCopy[swapTarget] = temp;

    setTimelineSteps(stepsCopy);

    // Adjust current step pointer if needed
    if (currentStepIndex === index) {
      setCurrentStepIndex(swapTarget);
    } else if (currentStepIndex === swapTarget) {
      setCurrentStepIndex(index);
    }
  };

  const handleSelectStep = (index: number) => {
    setCurrentStepIndex(index);
    setIsPlaying(false);
  };

  const handleUpdatePlayer = (id: number, updates: Partial<Player>) => {
    setBasePlayers(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, ...updates };
      }
      return p;
    }));
  };

  const handleUpdateTable = (updates: { communityCards?: Card[]; pot?: string; customText?: string; isPortrait?: boolean }) => {
    if (updates.isPortrait !== undefined) {
      setIsPortrait(updates.isPortrait);
    }
    setBaseTable(prev => ({
      communityCards: updates.communityCards !== undefined ? updates.communityCards : prev.communityCards,
      pot: updates.pot !== undefined ? updates.pot : prev.pot,
      customText: updates.customText !== undefined ? updates.customText : prev.customText,
    }));
  };

  const renderedState = getRenderedState();

  // Highlight seat handler from table interaction
  const handleSeatClick = (player: Player) => {
    setSelectedPlayerId(player.id);
    // Toggles highlight state for player in base state
    handleUpdatePlayer(player.id, { isHighlighted: !player.isHighlighted });
  };

  return (
    <div id="app-container" className="flex flex-col h-screen w-screen bg-zinc-950 overflow-hidden font-sans text-right select-none">
      
      {/* 1. Header Bar (Only visible if not in OBS Mode) */}
      {!isObsMode && (
        <header id="app-header" className="h-14 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-4 shrink-0 z-40">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-900 px-2.5 py-0.5 rounded-full font-bold">
              نسخه ۱.۰ (مدیا استودیو)
            </span>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-zinc-400 text-xs font-mono font-medium hidden sm:inline">OBS Ready</span>
          </div>

          {/* Quick Layout Switcher */}
          <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 p-1 rounded-lg">
            <button
              onClick={() => setIsPortrait(false)}
              className={`px-3 py-1.5 rounded-md text-xs font-black flex items-center gap-1.5 transition-all
                ${!isPortrait ? 'bg-amber-400 text-amber-950 shadow-md' : 'text-zinc-400 hover:text-white'}`}
            >
              <Monitor className="w-3.5 h-3.5" />
              افقی یوتیوب
            </button>
            <button
              onClick={() => setIsPortrait(true)}
              className={`px-3 py-1.5 rounded-md text-xs font-black flex items-center gap-1.5 transition-all
                ${isPortrait ? 'bg-amber-400 text-amber-950 shadow-md' : 'text-zinc-400 hover:text-white'}`}
            >
              <Layers className="w-3.5 h-3.5" />
              عمودی ریلز
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <h1 className="text-sm font-black text-white tracking-wider flex items-center gap-1.5 justify-end">
                <span>PokerMagFA</span>
                <span className="text-amber-400">Studio</span>
              </h1>
              <p className="text-[9px] text-zinc-500 tracking-wider">سند باکس تولید محتوای آموزشی پوکر</p>
            </div>
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center font-black text-slate-950 text-sm">
              PM
            </div>
          </div>
        </header>
      )}

      {/* 2. Main Studio Workspace Body */}
      <main id="main-workspace" className="flex-1 flex overflow-hidden relative">
        
        {/* Left Side: Timeline Scenario Editor */}
        {!isObsMode && (
          <TimelinePanel
            steps={timelineSteps}
            currentStepIndex={currentStepIndex}
            isPlaying={isPlaying}
            onPlayToggle={() => setIsPlaying(!isPlaying)}
            onStepForward={handleStepForward}
            onStepBackward={handleStepBackward}
            onReset={handleReset}
            onAddStep={handleAddStep}
            onDeleteStep={handleDeleteStep}
            onMoveStep={handleMoveStep}
            onSelectStep={handleSelectStep}
            onClearAll={() => {
              setTimelineSteps([]);
              setCurrentStepIndex(-1);
              setIsPlaying(false);
            }}
            onImportScenario={(steps) => {
              setTimelineSteps(steps);
              setCurrentStepIndex(-1);
              setIsPlaying(false);
            }}
          />
        )}

        {/* Center: The Main Presentation Stage (Poker Table) */}
        <div id="table-stage-container" className="flex-1 h-full bg-zinc-950 flex items-center justify-center relative p-3">
          
          {/* Inner Responsive Wrapper for Aspect Ratios */}
          <div
            id="table-aspect-limiter"
            className={`w-full h-full flex items-center justify-center transition-all duration-300
              ${isPortrait && !isObsMode
                ? 'aspect-[9/16] max-h-[90vh] border border-zinc-800 rounded-3xl bg-zinc-900 shadow-2xl overflow-hidden'
                : 'w-full h-full'
              }`}
          >
            <PokerTable
              players={renderedState.players}
              communityCards={renderedState.communityCards}
              pot={renderedState.pot}
              customText={renderedState.customText}
              cameraZoom={renderedState.cameraZoom}
              highlightedSeat={renderedState.highlightedSeat}
              isPortrait={isPortrait}
              onSeatClick={handleSeatClick}
              activeTurnId={currentStepIndex >= 0 && currentStepIndex < timelineSteps.length ? timelineSteps[currentStepIndex].seatId : null}
            />
          </div>

          {/* Floating Instructions Banner (Only if table is totally empty) */}
          {timelineSteps.length === 0 && !isObsMode && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-900/95 border border-zinc-700/60 text-zinc-300 text-xs rounded-full flex items-center gap-2 pointer-events-none z-50">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>از منوی سمت راست یک سناریوی نمونه بارگذاری کنید یا خودتان مرحله بسازید!</span>
            </div>
          )}
        </div>

        {/* Right Side: Direct Table Controls & Preset Manager */}
        {!isObsMode && (
          <ControlPanel
            players={basePlayers}
            communityCards={baseTable.communityCards}
            pot={baseTable.pot}
            customText={baseTable.customText}
            isPortrait={isPortrait}
            selectedPlayerId={selectedPlayerId}
            onUpdatePlayer={handleUpdatePlayer}
            onUpdateTable={handleUpdateTable}
            onLoadScenario={loadScenario}
            onToggleObsMode={() => setIsObsMode(true)}
            isObsMode={isObsMode}
          />
        )}

        {/* 3. Floating Overlay Controllers for OBS Recording Mode */}
        <AnimatePresence>
          {isObsMode && showFloatingControls && (
            <motion.div
              id="obs-floating-bar"
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 30, x: '-50%' }}
              className="absolute bottom-6 left-1/2 px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-700/50 backdrop-blur-md shadow-2xl flex items-center gap-5 z-50 select-none text-right font-sans"
            >
              {/* Back to Studio button */}
              <button
                onClick={() => setIsObsMode(false)}
                className="px-3 py-1.5 rounded-lg bg-red-650 hover:bg-red-600 border border-red-500 text-white text-[11px] font-black transition-all"
                title="خروج از حالت ضبط (Esc)"
              >
                خروج از ضبط
              </button>

              <div className="h-5 w-px bg-zinc-800" />

              {/* Status details */}
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-zinc-500 font-mono">STEP INDICATOR</span>
                <span className="text-xs font-bold text-amber-300 font-sans truncate max-w-xs">
                  {currentStepIndex >= 0 && currentStepIndex < timelineSteps.length
                    ? `مرحله ${currentStepIndex + 1}: ${timelineSteps[currentStepIndex].description}`
                    : 'آماده شروع سناریو'}
                </span>
              </div>

              <div className="h-5 w-px bg-zinc-800" />

              {/* Playback Cluster */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleReset}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  title="بازنشانی به ابتدا (R)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleStepBackward}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  title="گام قبلی (Left Arrow)"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-4 py-1.5 rounded-lg flex items-center gap-1 text-xs font-bold transition-all
                    ${isPlaying ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-400 text-amber-950 font-bold'}`}
                  title="پخش/توقف خودکار (Space)"
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {isPlaying ? 'توقف' : 'پخش'}
                </button>
                <button
                  onClick={handleStepForward}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  title="گام بعدی (Right Arrow)"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Little help hint */}
              <div className="hidden md:flex flex-col text-left font-mono text-[9px] text-zinc-500">
                <span>Space: Play/Pause</span>
                <span>← / →: Prev/Next</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
