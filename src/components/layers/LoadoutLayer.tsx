import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Check, Shield, Crosshair, Sliders, Zap, Flame, Info } from 'lucide-react';
import * as THREE from 'three';
import { OperatorData, WeaponData } from '../../types/game';
import { soundEngine } from '../../audio/soundEngine';
import { createWeaponMesh } from '../../game/threeModels';

interface LoadoutLayerProps {
  weapons: WeaponData[];
  equippedWeapon: WeaponData;
  operator?: OperatorData;
  onEquipWeapon: (weapon: WeaponData) => void;
  onBack: () => void;
}

export const LoadoutLayer: React.FC<LoadoutLayerProps> = ({
  weapons,
  equippedWeapon,
  operator,
  onEquipWeapon,
  onBack,
}) => {
  const [activeCategory, setActiveCategory] = useState<'primary' | 'secondary'>('primary');
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponData>(equippedWeapon);
  const previewMountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const weaponMeshRef = useRef<THREE.Group | null>(null);

  const isSaitama = operator?.id === 'saitama';
  const isGoku = operator?.id === 'son_goku';
  const isSuperman = operator?.id === 'superman';
  const isMaxwell = operator?.id === 'maxwell_shodron';

  useEffect(() => {
    setSelectedWeapon(equippedWeapon);
  }, [equippedWeapon]);

  const filteredWeapons = weapons.filter(w => w.category === activeCategory);

  // 3D Weapon Model Turntable
  useEffect(() => {
    if (!previewMountRef.current) return;

    const container = previewMountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 50);
    camera.position.set(0, 0.2, 1.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Lighting for weapon metallic reflection
    const key = new THREE.DirectionalLight('#ffffff', 2.0);
    key.position.set(2, 3, 2);
    scene.add(key);

    const rim = new THREE.DirectionalLight('#38bdf8', 2.5);
    rim.position.set(-2, -1, -2);
    scene.add(rim);

    const amb = new THREE.AmbientLight('#ffffff', 0.6);
    scene.add(amb);

    let mesh = createWeaponMesh(selectedWeapon);
    mesh.position.set(0, 0, 0);
    scene.add(mesh);
    weaponMeshRef.current = mesh;

    let rotY = 0;
    let animId = 0;
    const animate = () => {
      rotY += 0.01;
      if (weaponMeshRef.current) {
        weaponMeshRef.current.rotation.y = rotY;
      }
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  // Update weapon mesh when user selects a different gun
  const handleSelectGun = (w: WeaponData) => {
    setSelectedWeapon(w);
    soundEngine.playUIClick('select');

    if (weaponMeshRef.current && rendererRef.current) {
      const parent = weaponMeshRef.current.parent;
      if (parent) {
        parent.remove(weaponMeshRef.current);
        const newMesh = createWeaponMesh(w);
        parent.add(newMesh);
        weaponMeshRef.current = newMesh;
      }
    }
  };

  const handleToggleAttachment = (attachmentId: string) => {
    soundEngine.playUIClick('tab');
    const updated = {
      ...selectedWeapon,
      attachments: selectedWeapon.attachments.map(a => 
        a.id === attachmentId ? { ...a, enabled: !a.enabled } : a
      )
    };
    setSelectedWeapon(updated);
  };

  const handleEquip = () => {
    soundEngine.playUIClick('deploy');
    onEquipWeapon(selectedWeapon);
    onBack();
  };

  return (
    <div className="absolute inset-0 z-40 h-dvh bg-[#080a0f] text-white flex flex-col overflow-hidden select-none">
      {/* Header Bar */}
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
          <h1 className="text-xs sm:text-sm lg:text-xl font-bold font-heading uppercase tracking-wider text-white flex items-center space-x-2 min-w-0">
            <span className="text-amber-400 whitespace-nowrap truncate">
              {isSaitama ? 'SAITAMA ARSENAL' : isGoku ? 'GOKU TECHNIQUES' : isSuperman ? 'KRYPTONIAN POWERS' : isMaxwell ? 'MAXWELL SPELLBOOK' : 'LOADOUT'}
            </span>
            <span className="hidden sm:inline-block text-[10px] lg:text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono-tactical border border-amber-500/30 whitespace-nowrap">
              {isSaitama ? 'ONE PUNCH TECHNIQUES' : isGoku ? 'DIVINE KI ABILITIES' : isSuperman ? 'SOLAR PARAGON ARSENAL' : isMaxwell ? 'ARCANE & CHRONOS MAGIC' : 'GUNSMITH & ARMORY'}
            </span>
          </h1>
        </div>

        {/* Primary / Secondary Category Tabs */}
        <div className="flex items-center space-x-1 bg-zinc-900 p-1 rounded border border-zinc-800 overflow-x-auto shrink-0 max-w-[55%]">
          <button
            onClick={() => {
              setActiveCategory('primary');
              soundEngine.playUIClick('tab');
            }}
            className={`px-2.5 py-1 text-[10px] lg:text-xs font-mono-tactical uppercase tracking-wider rounded transition-all whitespace-nowrap shrink-0 ${
              activeCategory === 'primary' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {isSaitama ? 'CORE STRIKES' : isGoku ? 'KI BLASTS & BEAMS' : isSuperman ? 'KRYPTONIAN MIGHT' : isMaxwell ? 'BOLTS & RUNE BEAMS' : 'PRIMARY WEAPONS'}
          </button>
          <button
            onClick={() => {
              setActiveCategory('secondary');
              soundEngine.playUIClick('tab');
            }}
            className={`px-2.5 py-1 text-[10px] lg:text-xs font-mono-tactical uppercase tracking-wider rounded transition-all whitespace-nowrap shrink-0 ${
              activeCategory === 'secondary' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {isSaitama ? 'AFTERIMAGES & SERIOUS' : isGoku ? 'BOMBS & TRANSMISSION' : isSuperman ? 'BREATH & HEAT VISION' : isMaxwell ? 'CHRONO ORBS & VOID NOVA' : 'SIDEARMS & MELEE'}
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 min-h-0 flex flex-col min-[540px]:flex-row overflow-hidden relative">
        {/* Left: Weapon Card Grid */}
        <div className="w-full min-[540px]:w-52 lg:w-80 border-b min-[540px]:border-b-0 min-[540px]:border-r border-zinc-800/80 bg-zinc-950/60 p-2 lg:p-4 overflow-y-auto space-y-2 z-10 flex-shrink-0 max-h-32 min-[540px]:max-h-none">
          <div className="text-[10px] lg:text-xs font-mono-tactical text-zinc-500 uppercase tracking-widest px-1">
            Armory Catalog ({filteredWeapons.length})
          </div>

          <div className="space-y-1.5 lg:space-y-2">
            {filteredWeapons.map(w => {
              const isSelected = selectedWeapon.id === w.id;
              const isEquipped = equippedWeapon.id === w.id;

              return (
                <div
                  key={w.id}
                  onClick={() => handleSelectGun(w)}
                  className={`p-2 lg:p-3 rounded border transition-all cursor-pointer relative clip-tactical-sm ${
                    isSelected
                      ? 'bg-zinc-800/90 border-amber-500 shadow-lg shadow-amber-500/10'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  {isEquipped && (
                    <div className="hidden lg:flex absolute top-2 right-2 items-center space-x-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-mono-tactical font-bold rounded border border-amber-500/40">
                      <Check className="w-2.5 h-2.5" />
                      <span>EQUIPPED</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-1">
                    <div className="min-w-0">
                      <h4 className="font-heading font-bold text-xs lg:text-sm tracking-wide text-white uppercase truncate">
                        {w.name}
                      </h4>
                      <span className="text-[10px] lg:text-[11px] font-mono-tactical text-amber-400 uppercase block">
                        {w.type.toUpperCase()} CLASS
                      </span>
                    </div>
                    <span className="text-[10px] lg:text-xs font-mono-tactical text-zinc-400 shrink-0">
                      {w.magSize}/{w.reserveAmmo}
                    </span>
                  </div>

                  <p className="hidden lg:line-clamp-1 text-[11px] text-zinc-400 mt-1">{w.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center: 3D Gun Display Viewport */}
        <div className="flex-1 min-w-0 min-h-0 relative flex items-center justify-center">
          <div ref={previewMountRef} className="absolute inset-0 w-full h-full" />

          <div className="absolute top-2 left-3 lg:top-4 lg:left-6 pointer-events-none">
            <span className="text-[9px] lg:text-[11px] font-mono-tactical text-amber-400 uppercase tracking-widest block">
              // MILITARY SPECIFICATION INSPECT
            </span>
            <span className="text-lg lg:text-3xl font-black font-heading tracking-wide uppercase text-white">
              {selectedWeapon.name}
            </span>
          </div>

          <div className="absolute bottom-2 left-3 lg:bottom-4 lg:left-6 pointer-events-none text-[10px] lg:text-xs font-mono-tactical text-zinc-400 bg-zinc-950/75 px-2 py-1 lg:px-3 lg:py-1.5 rounded border border-zinc-800">
            AUTO 360° PREVIEW
          </div>
        </div>

        {/* Right: Weapon Specs & Gunsmith Attachments */}
        <div className="w-full min-[540px]:w-64 lg:w-96 min-h-0 border-t min-[540px]:border-t-0 min-[540px]:border-l border-zinc-800/80 bg-zinc-950/90 p-3 lg:p-5 overflow-hidden z-10 flex-shrink-0 flex flex-col justify-between gap-2">
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 lg:space-y-5 pr-0.5">
            {/* Description */}
            <div>
              <span className="text-xs uppercase font-mono-tactical text-zinc-500 tracking-wider">
                WEAPON ATTRIBUTES
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed mt-1">
                {selectedWeapon.description}
              </p>
            </div>

            {/* Tactical Stats Matrix */}
            <div className="bg-zinc-900/60 p-3.5 rounded border border-zinc-800 space-y-2.5">
              <span className="text-xs uppercase font-mono-tactical tracking-wider text-zinc-400 block">
                BALLISTIC PERFORMANCE
              </span>

              {/* Damage */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono-tactical">
                  <span className="text-zinc-400">DAMAGE IMPACT</span>
                  <span className="text-red-400 font-bold">{selectedWeapon.damage} DMG</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${Math.min(100, (selectedWeapon.damage / 120) * 100)}%` }} />
                </div>
              </div>

              {/* Fire Rate */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono-tactical">
                  <span className="text-zinc-400">CYCLIC FIRE RATE</span>
                  <span className="text-amber-400 font-bold">{selectedWeapon.fireRate} RPS</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (selectedWeapon.fireRate / 18) * 100)}%` }} />
                </div>
              </div>

              {/* Accuracy */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono-tactical">
                  <span className="text-zinc-400">SHOT ACCURACY</span>
                  <span className="text-cyan-400 font-bold">{selectedWeapon.accuracy}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500" style={{ width: `${selectedWeapon.accuracy}%` }} />
                </div>
              </div>

              {/* Mobility */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono-tactical">
                  <span className="text-zinc-400">OPERATOR MOBILITY</span>
                  <span className="text-emerald-400 font-bold">{selectedWeapon.mobility}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${selectedWeapon.mobility}%` }} />
                </div>
              </div>
            </div>

            {/* Gunsmith Attachments */}
            {selectedWeapon.attachments.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs uppercase font-mono-tactical tracking-wider text-zinc-400 block">
                  GUNSMITH MODIFICATIONS
                </span>
                <div className="space-y-1.5">
                  {selectedWeapon.attachments.map(att => (
                    <button
                      key={att.id}
                      onClick={() => handleToggleAttachment(att.id)}
                      className={`w-full p-2.5 rounded border text-left flex items-center justify-between text-xs transition-all ${
                        att.enabled
                          ? 'border-amber-400 bg-amber-500/10 text-white'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div>
                        <div className="font-heading uppercase tracking-wide font-bold">
                          {att.name}
                        </div>
                        <span className="text-[10px] font-mono-tactical text-amber-400/80 uppercase">
                          SLOT: {att.slot}
                        </span>
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        att.enabled ? 'border-amber-400 bg-amber-500 text-black' : 'border-zinc-700'
                      }`}>
                        {att.enabled && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Equip CTA */}
          <div className="pt-2 lg:pt-3 border-t border-zinc-800/80 shrink-0">
            <button
              onClick={handleEquip}
              className="w-full py-2.5 lg:py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold uppercase tracking-widest text-xs lg:text-sm clip-tactical-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>EQUIP WEAPON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
