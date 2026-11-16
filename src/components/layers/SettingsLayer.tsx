import React, { useState, useRef } from 'react';
import { ArrowLeft, Sliders, Volume2, Monitor, Target, Check, RotateCcw, Move, ZoomIn } from 'lucide-react';
import { CustomHudLayout, GameSettings } from '../../types/game';
import { soundEngine } from '../../audio/soundEngine';
import { DEFAULT_HUD_LAYOUT, getControlProfileForOperator } from '../../data/operatorControls';
import { CAMERA_VIEWPOINT_PRESETS, DEFAULT_SETTINGS, OPERATORS } from '../../data/gameData';

interface SettingsLayerProps {
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  onBack: () => void;
  isInGame?: boolean;
  onExitMatch?: () => void;
  onEnterLiveHudEdit?: () => void;
  onEnterLiveZoomEdit?: () => void;
}

type LayoutSlotKey = keyof CustomHudLayout;

const SLOT_META: Array<{ key: LayoutSlotKey; label: string; color: string }> = [
  { key: 'joystick', label: 'Move Joystick', color: 'border-emerald-400 bg-emerald-500/20 text-emerald-200' },
  { key: 'actionWheel', label: 'Attack Section', color: 'border-amber-400 bg-amber-500/20 text-amber-200' },
  { key: 'skillBar', label: 'Skill Section', color: 'border-violet-400 bg-violet-500/20 text-violet-200' },
  { key: 'powerUp', label: 'Power-Up Bar', color: 'border-cyan-400 bg-cyan-500/20 text-cyan-200' },
  { key: 'minimap', label: 'Minimap Radar', color: 'border-zinc-300 bg-zinc-700/40 text-zinc-100' },
];

export const SettingsLayer: React.FC<SettingsLayerProps> = ({
  settings,
  onUpdateSettings,
  onBack,
  isInGame = false,
  onExitMatch,
  onEnterLiveHudEdit,
  onEnterLiveZoomEdit,
}) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'camera' | 'audio' | 'graphics' | 'hud'>('controls');
  const [current, setCurrent] = useState<GameSettings>({
    ...DEFAULT_SETTINGS,
    ...settings,
    hudLayout: {
      ...DEFAULT_HUD_LAYOUT,
      ...(settings.hudLayout || {}),
    },
  });
  const [selectedSlot, setSelectedSlot] = useState<LayoutSlotKey>('actionWheel');
  const [previewOpId, setPreviewOpId] = useState<string>('saitama');
  const canvasRef = useRef<HTMLDivElement>(null);
  const draggingSlotRef = useRef<LayoutSlotKey | null>(null);

  const update = (partial: Partial<GameSettings>) => {
    const updated = { ...current, ...partial };
    setCurrent(updated);
    onUpdateSettings(updated);

    if (partial.masterVolume !== undefined || partial.sfxVolume !== undefined || partial.musicVolume !== undefined) {
      soundEngine.setVolumes(
        updated.masterVolume,
        updated.sfxVolume,
        updated.musicVolume
      );
    }
  };

  return (
    <div className="absolute inset-0 z-40 h-dvh bg-[#080a0f] text-white flex flex-col overflow-hidden select-none">
      {/* Header */}
      <div className="h-11 lg:h-14 px-3 lg:px-6 flex items-center justify-between gap-2 border-b border-zinc-800/80 bg-zinc-950/80 z-10 backdrop-blur-sm shrink-0">
        <div className="flex items-center space-x-2 lg:space-x-4 min-w-0">
          <button
            onClick={() => {
              soundEngine.playUIClick('back');
              onBack();
            }}
            className="flex items-center space-x-1.5 text-zinc-300 hover:text-amber-400 font-heading uppercase text-xs lg:text-sm tracking-widest px-2.5 py-1 lg:px-3 lg:py-1.5 rounded bg-zinc-900 border border-zinc-700/60 active:scale-95 transition-all shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            <span>Back</span>
          </button>
          <div className="h-4 w-px bg-zinc-700 shrink-0" />
          <h1 className="text-sm lg:text-xl font-bold font-heading uppercase tracking-wider text-white flex items-center space-x-2 min-w-0">
            <span className="text-amber-400 whitespace-nowrap">GAME SETTINGS</span>
            <span className="hidden md:inline-block text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono-tactical border border-amber-500/30 whitespace-nowrap">
              PREFERENCES
            </span>
          </h1>
        </div>

        {/* Setting Tabs */}
        <div className="flex items-center space-x-1 bg-zinc-900 p-1 rounded border border-zinc-800 overflow-x-auto shrink-0 max-w-[60%]">
          {[
            { id: 'controls', label: 'CONTROLS', icon: Sliders },
            { id: 'camera', label: 'CAMERA ZOOM', icon: ZoomIn },
            { id: 'audio', label: 'AUDIO', icon: Volume2 },
            { id: 'graphics', label: 'GRAPHICS', icon: Monitor },
            { id: 'hud', label: 'CROSSHAIR & HUD', icon: Target },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as typeof activeTab);
                  soundEngine.playUIClick('tab');
                }}
                className={`flex items-center space-x-1 px-2.5 py-1 text-[10px] lg:text-xs font-mono-tactical uppercase tracking-wider rounded transition-all whitespace-nowrap shrink-0 ${
                  isActive ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Settings Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 lg:p-6 max-w-4xl mx-auto w-full space-y-4 lg:space-y-6">
        {/* CONTROLS TAB */}
        {activeTab === 'controls' && (() => {
          const layout: CustomHudLayout = {
            ...DEFAULT_HUD_LAYOUT,
            ...(current.hudLayout || {}),
          };
          const activeTransform = layout[selectedSlot];
          const previewProfile = getControlProfileForOperator(previewOpId);

          const updateSlot = (slot: LayoutSlotKey, patch: Partial<{ x: number; y: number; scale: number }>) => {
            const nextLayout: CustomHudLayout = {
              ...layout,
              [slot]: { ...layout[slot], ...patch },
            };
            update({ hudLayout: nextLayout });
          };

          const handleCanvasPointerMove = (clientX: number, clientY: number) => {
            if (!draggingSlotRef.current || !canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            const px = Math.max(7, Math.min(93, ((clientX - rect.left) / rect.width) * 100));
            const py = Math.max(10, Math.min(90, ((clientY - rect.top) / rect.height) * 100));
            updateSlot(draggingSlotRef.current, { x: Math.round(px), y: Math.round(py) });
          };

          return (
            <div className="space-y-5">
              {/* CUSTOM CONTROL LAYOUT STUDIO */}
              <div className="bg-zinc-900/60 border border-zinc-800 p-4 sm:p-5 rounded clip-tactical-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-heading font-bold text-sm sm:text-base text-amber-400 uppercase tracking-wider flex items-center space-x-2">
                      <Move className="w-4 h-4" />
                      <span>CUSTOM CONTROL LAYOUT (DRAG & RESIZE)</span>
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-mono-tactical">
                      Drag any control block to reposition it or adjust its size slider below.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isInGame && onEnterLiveHudEdit && (
                      <button
                        onClick={() => {
                          soundEngine.playUIClick('select');
                          onEnterLiveHudEdit();
                        }}
                        className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-mono-tactical font-black active:scale-95 transition-all"
                      >
                        <Move className="w-3.5 h-3.5" />
                        <span>EDIT LIVE IN-GAME</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        soundEngine.playUIClick('tab');
                        update({ hudLayout: DEFAULT_HUD_LAYOUT });
                      }}
                      className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-700 hover:border-amber-400 text-[11px] font-mono-tactical text-zinc-300 hover:text-amber-300 active:scale-95 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>RESET DEFAULT</span>
                    </button>
                  </div>
                </div>

                {/* Character Preview Switcher */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
                  <span className="text-[10px] font-mono-tactical text-zinc-500 uppercase shrink-0 mr-1">
                    PREVIEW HERO:
                  </span>
                  {OPERATORS.map(op => (
                    <button
                      key={op.id}
                      onClick={() => {
                        soundEngine.playUIClick('tab');
                        setPreviewOpId(op.id);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono-tactical uppercase border transition-all whitespace-nowrap shrink-0 ${
                        previewOpId === op.id
                          ? 'bg-amber-500 text-black border-amber-300 font-bold'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {op.name}
                    </button>
                  ))}
                </div>

                {/* Interactive Drag Canvas */}
                <div
                  ref={canvasRef}
                  onMouseMove={e => handleCanvasPointerMove(e.clientX, e.clientY)}
                  onMouseUp={() => { draggingSlotRef.current = null; }}
                  onMouseLeave={() => { draggingSlotRef.current = null; }}
                  onTouchMove={e => {
                    const t = e.touches[0];
                    if (t) handleCanvasPointerMove(t.clientX, t.clientY);
                  }}
                  onTouchEnd={() => { draggingSlotRef.current = null; }}
                  className="relative w-full h-48 sm:h-56 bg-zinc-950 border border-zinc-700/80 rounded overflow-hidden select-none touch-none"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                >
                  {/* Center silhouette indicator */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-mono-tactical text-zinc-700 uppercase pointer-events-none">
                    ARENA VIEW ({previewProfile.operatorId.toUpperCase()})
                  </div>

                  {/* Draggable HUD Element Previews */}
                  {SLOT_META.map(meta => {
                    const tr = layout[meta.key];
                    const isSelected = selectedSlot === meta.key;
                    const sizePct = Math.round(tr.scale * 100);
                    const displayLabel =
                      meta.key === 'powerUp'
                        ? previewProfile.powerUpLabel
                        : meta.key === 'actionWheel'
                        ? previewProfile.buttons[1].label
                        : meta.key === 'skillBar'
                        ? 'SKILL BAR'
                        : meta.label;

                    let wheelClipPath: string | undefined;
                    let radius = meta.key === 'joystick' ? '9999px' : '6px';
                    if (meta.key === 'actionWheel') {
                      if (previewProfile.wheelVariant === 'kryptonian_diamond') {
                        wheelClipPath = 'polygon(50% 0%, 96% 32%, 82% 96%, 18% 96%, 4% 32%)';
                        radius = '0px';
                      } else if (previewProfile.wheelVariant === 'arcane_sigil') {
                        wheelClipPath = 'polygon(30% 3%, 70% 3%, 97% 30%, 97% 70%, 70% 97%, 30% 97%, 3% 70%, 3% 30%)';
                        radius = '0px';
                      } else if (previewProfile.wheelVariant === 'hero_cross' || previewProfile.wheelVariant === 'saiyan_orbit') {
                        radius = '9999px';
                      } else {
                        radius = '12px';
                      }
                    }

                    return (
                      <div
                        key={meta.key}
                        onMouseDown={e => {
                          e.stopPropagation();
                          setSelectedSlot(meta.key);
                          draggingSlotRef.current = meta.key;
                        }}
                        onTouchStart={e => {
                          e.stopPropagation();
                          setSelectedSlot(meta.key);
                          draggingSlotRef.current = meta.key;
                        }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing border-2 flex flex-col items-center justify-center transition-shadow ${
                          meta.color
                        } ${isSelected ? 'ring-2 ring-white shadow-lg z-20' : 'opacity-85 z-10'}`}
                        style={{
                          left: `${tr.x}%`,
                          top: `${tr.y}%`,
                          transform: `translate(-50%, -50%) scale(${tr.scale})`,
                          width:
                            meta.key === 'actionWheel'
                              ? '68px'
                              : meta.key === 'skillBar'
                              ? '96px'
                              : meta.key === 'joystick'
                              ? '52px'
                              : meta.key === 'powerUp'
                              ? '84px'
                              : '58px',
                          height:
                            meta.key === 'actionWheel'
                              ? '68px'
                              : meta.key === 'skillBar'
                              ? '32px'
                              : meta.key === 'joystick'
                              ? '52px'
                              : meta.key === 'powerUp'
                              ? '28px'
                              : '38px',
                          borderRadius: radius,
                          clipPath: wheelClipPath,
                        }}
                      >
                        <span className="text-[7px] font-mono-tactical font-bold uppercase tracking-tighter text-center leading-tight px-0.5 pointer-events-none truncate max-w-full">
                          {displayLabel}
                        </span>
                        <span className="text-[8px] font-mono-tactical font-black text-amber-300 leading-none pointer-events-none">
                          {sizePct}%
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Slot Selector + Smooth Size Slider with Percentage Indicator */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="flex flex-wrap gap-1.5">
                    {SLOT_META.map(meta => {
                      const pct = Math.round(layout[meta.key].scale * 100);
                      return (
                        <button
                          key={meta.key}
                          onClick={() => {
                            setSelectedSlot(meta.key);
                            soundEngine.playUIClick('tab');
                          }}
                          className={`px-2.5 py-1 rounded text-[10px] font-mono-tactical uppercase border transition-all ${
                            selectedSlot === meta.key
                              ? 'bg-amber-500 text-black border-amber-300 font-bold'
                              : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                          }`}
                        >
                          {meta.label} · {pct}%
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-1.5 bg-zinc-950/70 border border-zinc-800 p-2.5 rounded">
                    <div className="flex items-center justify-between text-[11px] font-mono-tactical gap-2">
                      <span className="text-zinc-400 truncate">
                        SECTION: <strong className="text-white">{SLOT_META.find(m => m.key === selectedSlot)?.label}</strong>
                      </span>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-300 font-black">
                          SIZE: {Math.round(activeTransform.scale * 100)}%
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          ({activeTransform.x}%, {activeTransform.y}%)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateSlot(selectedSlot, {
                            scale: Math.max(0.6, Number((activeTransform.scale - 0.05).toFixed(2))),
                          })
                        }
                        className="w-6 h-6 rounded bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-white font-bold text-xs flex items-center justify-center shrink-0"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="0.6"
                        max="1.5"
                        step="0.01"
                        value={activeTransform.scale}
                        onChange={e => updateSlot(selectedSlot, { scale: parseFloat(e.target.value) })}
                        className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateSlot(selectedSlot, {
                            scale: Math.min(1.5, Number((activeTransform.scale + 0.05).toFixed(2))),
                          })
                        }
                        className="w-6 h-6 rounded bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-white font-bold text-xs flex items-center justify-center shrink-0"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* LOOK & AIM SENSITIVITY */}
              <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded clip-tactical-sm space-y-5">
                <h3 className="font-heading font-bold text-base text-amber-400 uppercase tracking-wider">
                  Touch Look & Aim Sensitivity
                </h3>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono-tactical">
                    <span className="text-zinc-400">AIM SENSITIVITY MULTIPLIER</span>
                    <span className="text-amber-400 font-bold">{current.touchSensitivity.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.4"
                    max="2.5"
                    step="0.05"
                    value={current.touchSensitivity}
                    onChange={e => update({ touchSensitivity: parseFloat(e.target.value) })}
                    className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center justify-between p-3 rounded bg-zinc-950/60 border border-zinc-800">
                    <div>
                      <h4 className="font-heading font-bold text-sm text-white">Invert Vertical Look (Y-Axis)</h4>
                      <span className="text-xs text-zinc-400">Flight-simulator pitch control</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={current.invertY}
                      onChange={e => update({ invertY: e.target.checked })}
                      className="w-5 h-5 accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded bg-zinc-950/60 border border-zinc-800">
                    <div>
                      <h4 className="font-heading font-bold text-sm text-white">Auto-ADS When Firing</h4>
                      <span className="text-xs text-zinc-400">Automatically zoom scope on shoot</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={current.autoAds}
                      onChange={e => update({ autoAds: e.target.checked })}
                      className="w-5 h-5 accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded bg-zinc-950/60 border border-zinc-800">
                    <div>
                      <h4 className="font-heading font-bold text-sm text-white">Haptic Vibration Simulation</h4>
                      <span className="text-xs text-zinc-400">Tactile rumble feedback on gunfire</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={current.vibration}
                      onChange={e => update({ vibration: e.target.checked })}
                      className="w-5 h-5 accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* CAMERA ZOOM & VIEWING POINT TAB */}
        {activeTab === 'camera' && (() => {
          const camZoom = current.cameraZoom ?? DEFAULT_SETTINGS.cameraZoom ?? 1.0;
          const camFov = current.cameraFov ?? DEFAULT_SETTINGS.cameraFov ?? 54;
          const camHeight = current.cameraHeight ?? DEFAULT_SETTINGS.cameraHeight ?? 0.0;
          const camShoulder = current.cameraShoulder ?? DEFAULT_SETTINGS.cameraShoulder ?? 0.0;

          const approxDistMeters = (2.15 * camZoom).toFixed(2);
          // Visual silhouette scaling in preview viewport
          const heroVisualScale = Number(
            Math.max(0.42, Math.min(1.55, (1.0 / camZoom) * (54 / camFov))).toFixed(2)
          );
          const heroShiftX = -camShoulder * 48;
          const heroShiftY = camHeight * 38;

          return (
            <div className="space-y-5">
              <div className="bg-zinc-900/60 border border-zinc-800 p-4 sm:p-5 rounded clip-tactical-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-heading font-bold text-sm sm:text-base text-amber-400 uppercase tracking-wider flex items-center space-x-2">
                      <ZoomIn className="w-4 h-4" />
                      <span>CAMERA ZOOM &amp; CUSTOM VIEWING POINT</span>
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-mono-tactical">
                      Customize camera distance, lens FOV, vertical height, and over-the-shoulder framing.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isInGame && onEnterLiveZoomEdit && (
                      <button
                        onClick={() => {
                          soundEngine.playUIClick('select');
                          onEnterLiveZoomEdit();
                        }}
                        className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-mono-tactical font-black active:scale-95 transition-all"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>EDIT ZOOM LIVE IN-GAME</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        soundEngine.playUIClick('tab');
                        update({
                          cameraZoom: 1.0,
                          cameraFov: 54,
                          cameraHeight: 0.0,
                          cameraShoulder: 0.0,
                        });
                      }}
                      className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-700 hover:border-amber-400 text-[11px] font-mono-tactical text-zinc-300 hover:text-amber-300 active:scale-95 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>RESET DEFAULT</span>
                    </button>
                  </div>
                </div>

                {/* Live Framing Preview Schematic */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch">
                  <div
                    className="md:col-span-2 relative h-48 bg-zinc-950 border border-zinc-800 rounded overflow-hidden flex items-center justify-center"
                    style={{
                      backgroundImage:
                        'linear-gradient(to bottom, #0e1726 0%, #1c2432 58%, #363940 58%, #202227 100%)',
                    }}
                  >
                    {/* Preview Fighter Silhouette */}
                    <svg
                      viewBox="0 0 80 120"
                      className="h-36 transition-transform duration-150 pointer-events-none"
                      style={{
                        transform: `translate(${heroShiftX}px, ${heroShiftY}px) scale(${heroVisualScale})`,
                      }}
                    >
                      <ellipse cx="40" cy="112" rx="18" ry="4" fill="rgba(0,0,0,0.55)" />
                      <path d="M29 36 L54 34 L63 86 L25 82 Z" fill="#eae8e1" opacity="0.92" />
                      <circle cx="40" cy="18" r="9.5" fill="#e2b494" />
                      <path d="M27 32 Q40 28 53 32 L50 66 L30 66 Z" fill="#b88c22" />
                      <rect x="29" y="61" width="22" height="5" rx="1" fill="#291610" />
                      <rect x="31" y="66" width="8" height="36" rx="3" fill="#b88c22" />
                      <rect x="41" y="66" width="8" height="36" rx="3" fill="#b88c22" />
                      <rect x="31" y="96" width="8" height="14" rx="2" fill="#211010" />
                      <rect x="41" y="96" width="8" height="14" rx="2" fill="#211010" />
                      <rect x="21" y="34" width="7" height="28" rx="3" fill="#b88c22" />
                      <rect x="21" y="54" width="7" height="12" rx="2" fill="#541616" />
                      <rect x="52" y="34" width="7" height="28" rx="3" fill="#b88c22" />
                      <rect x="52" y="54" width="7" height="12" rx="2" fill="#541616" />
                    </svg>

                    {/* Center Reticle Target */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="w-4 h-4 rounded-full border border-emerald-400/70 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </div>
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono-tactical text-zinc-300 bg-black/55 px-2 py-0.5 rounded">
                      <span>{approxDistMeters}m · {camZoom.toFixed(2)}x</span>
                      <span>{camFov}° FOV</span>
                    </div>
                  </div>

                  {/* Right Side: Presets + 4 Precision Sliders */}
                  <div className="md:col-span-3 space-y-3">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono-tactical text-zinc-400 uppercase tracking-wider">
                        VIEWING POINT PRESETS
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {CAMERA_VIEWPOINT_PRESETS.map(preset => {
                          const isMatch =
                            Math.abs(camZoom - preset.cameraZoom) < 0.03 &&
                            Math.abs(camFov - preset.cameraFov) <= 1 &&
                            Math.abs(camHeight - preset.cameraHeight) < 0.04 &&
                            Math.abs(camShoulder - preset.cameraShoulder) < 0.04;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => {
                                soundEngine.playUIClick('select');
                                update({
                                  cameraZoom: preset.cameraZoom,
                                  cameraFov: preset.cameraFov,
                                  cameraHeight: preset.cameraHeight,
                                  cameraShoulder: preset.cameraShoulder,
                                });
                              }}
                              className={`py-1.5 px-2 rounded text-[11px] font-mono-tactical uppercase border transition-all whitespace-nowrap ${
                                isMatch
                                  ? 'bg-amber-500 text-black border-amber-300 font-bold'
                                  : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-amber-400'
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 1. Camera Distance Multiplier */}
                    <div className="space-y-1 bg-zinc-950/60 border border-zinc-800/80 p-2.5 rounded">
                      <div className="flex justify-between text-xs font-mono-tactical">
                        <span className="text-zinc-300">CAMERA DISTANCE (ZOOM)</span>
                        <span className="text-amber-400 font-bold">
                          {camZoom.toFixed(2)}x ({approxDistMeters}m)
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() =>
                            update({ cameraZoom: Math.max(0.55, Number((camZoom - 0.05).toFixed(2))) })
                          }
                          className="w-6 h-6 rounded bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-white font-bold text-xs flex items-center justify-center shrink-0"
                        >
                          -
                        </button>
                        <input
                          type="range"
                          min="0.55"
                          max="2.2"
                          step="0.02"
                          value={camZoom}
                          onChange={e => update({ cameraZoom: parseFloat(e.target.value) })}
                          className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            update({ cameraZoom: Math.min(2.2, Number((camZoom + 0.05).toFixed(2))) })
                          }
                          className="w-6 h-6 rounded bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-white font-bold text-xs flex items-center justify-center shrink-0"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* 2. Lens FOV */}
                    <div className="space-y-1 bg-zinc-950/60 border border-zinc-800/80 p-2.5 rounded">
                      <div className="flex justify-between text-xs font-mono-tactical">
                        <span className="text-zinc-300">LENS FIELD OF VIEW (FOV)</span>
                        <span className="text-amber-400 font-bold">{camFov}°</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => update({ cameraFov: Math.max(40, camFov - 2) })}
                          className="w-6 h-6 rounded bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-white font-bold text-xs flex items-center justify-center shrink-0"
                        >
                          -
                        </button>
                        <input
                          type="range"
                          min="40"
                          max="95"
                          step="1"
                          value={camFov}
                          onChange={e => update({ cameraFov: parseInt(e.target.value, 10) })}
                          className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => update({ cameraFov: Math.min(95, camFov + 2) })}
                          className="w-6 h-6 rounded bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-white font-bold text-xs flex items-center justify-center shrink-0"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* 3 & 4. Vertical Height & Shoulder Side Offset */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1 bg-zinc-950/60 border border-zinc-800/80 p-2.5 rounded">
                        <div className="flex justify-between text-[11px] font-mono-tactical">
                          <span className="text-zinc-300">HEIGHT ANGLE</span>
                          <span className="text-amber-400 font-bold">
                            {camHeight >= 0 ? `+${camHeight.toFixed(2)}m` : `${camHeight.toFixed(2)}m`}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-0.45"
                          max="0.85"
                          step="0.02"
                          value={camHeight}
                          onChange={e => update({ cameraHeight: parseFloat(e.target.value) })}
                          className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1 bg-zinc-950/60 border border-zinc-800/80 p-2.5 rounded">
                        <div className="flex justify-between text-[11px] font-mono-tactical">
                          <span className="text-zinc-300">SHOULDER OFFSET</span>
                          <span className="text-amber-400 font-bold">
                            {Math.abs(camShoulder) < 0.02
                              ? 'CENTER'
                              : camShoulder > 0
                              ? `R +${camShoulder.toFixed(2)}m`
                              : `L ${camShoulder.toFixed(2)}m`}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-0.85"
                          max="0.85"
                          step="0.02"
                          value={camShoulder}
                          onChange={e => update({ cameraShoulder: parseFloat(e.target.value) })}
                          className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* AUDIO TAB */}
        {activeTab === 'audio' && (
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded clip-tactical-sm space-y-5">
              <h3 className="font-heading font-bold text-base text-amber-400 uppercase tracking-wider">
                Procedural Sound Synthesis & Volume
              </h3>

              {/* Master Volume */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono-tactical">
                  <span className="text-zinc-400">MASTER AUDIO OUTPUT</span>
                  <span className="text-amber-400 font-bold">{Math.round(current.masterVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={current.masterVolume}
                  onChange={e => update({ masterVolume: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* SFX Volume */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono-tactical">
                  <span className="text-zinc-400">WEAPONS & COMBAT SFX</span>
                  <span className="text-amber-400 font-bold">{Math.round(current.sfxVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={current.sfxVolume}
                  onChange={e => update({ sfxVolume: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Music Volume */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono-tactical">
                  <span className="text-zinc-400">AMBIENT DRONE & MUSIC</span>
                  <span className="text-amber-400 font-bold">{Math.round(current.musicVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={current.musicVolume}
                  onChange={e => update({ musicVolume: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded bg-zinc-950/60 border border-zinc-800">
                <div>
                  <h4 className="font-heading font-bold text-sm text-white">Radio Combat Announcer</h4>
                  <span className="text-xs text-zinc-400">Voice callouts for killstreaks, quad damage & match state</span>
                </div>
                <input
                  type="checkbox"
                  checked={current.announcer}
                  onChange={e => update({ announcer: e.target.checked })}
                  className="w-5 h-5 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* GRAPHICS TAB */}
        {activeTab === 'graphics' && (
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded clip-tactical-sm space-y-5">
              <h3 className="font-heading font-bold text-base text-amber-400 uppercase tracking-wider">
                Rendering & Frame Target
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-xs font-mono-tactical text-zinc-400">FRAME RATE TARGET</span>
                  <div className="flex space-x-2">
                    {([60, 120] as const).map(fps => (
                      <button
                        key={fps}
                        onClick={() => update({ fpsLimit: fps })}
                        className={`flex-1 py-2 rounded text-xs font-bold font-mono-tactical transition-all border ${
                          current.fpsLimit === fps
                            ? 'bg-amber-500 text-black border-amber-400'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {fps} FPS
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono-tactical text-zinc-400">QUALITY PRESET</span>
                  <div className="flex space-x-2">
                    {(['low', 'medium', 'high', 'ultra'] as const).map(q => (
                      <button
                        key={q}
                        onClick={() => update({ graphicsQuality: q })}
                        className={`flex-1 py-2 rounded text-[11px] font-bold font-mono-tactical uppercase transition-all border ${
                          current.graphicsQuality === q
                            ? 'bg-amber-500 text-black border-amber-400'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center justify-between p-3 rounded bg-zinc-950/60 border border-zinc-800">
                  <div>
                    <h4 className="font-heading font-bold text-sm text-white">Dynamic Sun Shadows</h4>
                    <span className="text-xs text-zinc-400">Real-time soft shadow mapping</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={current.shadows}
                    onChange={e => update({ shadows: e.target.checked })}
                    className="w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded bg-zinc-950/60 border border-zinc-800">
                  <div>
                    <h4 className="font-heading font-bold text-sm text-white">Cyber Neon Glow & Embers</h4>
                    <span className="text-xs text-zinc-400">Laser tracers and hologram lighting</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={current.bloom}
                    onChange={e => update({ bloom: e.target.checked })}
                    className="w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HUD TAB */}
        {activeTab === 'hud' && (
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded clip-tactical-sm space-y-5">
              <h3 className="font-heading font-bold text-base text-amber-400 uppercase tracking-wider">
                Crosshair & Combat Reticle Customization
              </h3>

              <div className="space-y-2">
                <span className="text-xs font-mono-tactical text-zinc-400">RETICLE COLOR</span>
                <div className="flex space-x-3">
                  {['#38bdf8', '#22c55e', '#ef4444', '#eab308', '#ffffff', '#ec4899'].map(color => (
                    <button
                      key={color}
                      onClick={() => update({ crosshairColor: color })}
                      className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                        current.crosshairColor === color ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {current.crosshairColor === color && <Check className="w-4 h-4 text-black stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="flex items-center justify-between p-3 rounded bg-zinc-950/60 border border-zinc-800">
                  <div>
                    <h4 className="font-heading font-bold text-sm text-white">Dynamic Recoil Bloom</h4>
                    <span className="text-xs text-zinc-400">Crosshair expands while firing</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={current.crosshairDynamic}
                    onChange={e => update({ crosshairDynamic: e.target.checked })}
                    className="w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded bg-zinc-950/60 border border-zinc-800">
                  <div>
                    <h4 className="font-heading font-bold text-sm text-white">Floating Damage Numbers</h4>
                    <span className="text-xs text-zinc-400">Show damage amount above enemy</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={current.damageNumbers}
                    onChange={e => update({ damageNumbers: e.target.checked })}
                    className="w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded bg-zinc-950/60 border border-zinc-800">
                  <div>
                    <h4 className="font-heading font-bold text-sm text-white">Tactile Hitmarker Sounds</h4>
                    <span className="text-xs text-zinc-400">Crisp audio tick on impact</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={current.hitmarkerSound}
                    onChange={e => update({ hitmarkerSound: e.target.checked })}
                    className="w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Settings Footer with Unmistakable Back Button */}
      <div className="px-4 lg:px-6 py-2.5 lg:py-3 border-t border-zinc-800/90 bg-zinc-950/90 flex items-center justify-between gap-3 shrink-0 z-10">
        <button
          onClick={() => {
            soundEngine.playUIClick('back');
            onBack();
          }}
          className="flex items-center space-x-2 px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-black font-heading font-black uppercase text-xs lg:text-sm tracking-wider clip-tactical-sm shadow-lg active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>{isInGame ? 'BACK TO GAME' : 'BACK'}</span>
        </button>

        {isInGame && onExitMatch ? (
          <button
            onClick={() => {
              soundEngine.playUIClick('back');
              onExitMatch();
            }}
            className="px-4 py-2 rounded bg-zinc-900 hover:bg-red-950/80 border border-red-500/50 text-red-400 hover:text-red-300 font-heading font-bold uppercase text-xs lg:text-sm tracking-wider active:scale-95 transition-all"
          >
            EXIT MATCH TO LOBBY
          </button>
        ) : (
          <span className="text-[11px] font-mono-tactical text-zinc-500 uppercase tracking-wider hidden sm:inline">
            ALL CHANGES APPLIED AUTOMATICALLY
          </span>
        )}
      </div>
    </div>
  );
};
