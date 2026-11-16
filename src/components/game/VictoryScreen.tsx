import React, { useEffect, useRef, useState } from 'react';
import { Trophy, Award, ShoppingBag, RotateCcw, Home, Sparkles, Flame, Check, Zap } from 'lucide-react';
import * as THREE from 'three';
import { OperatorData, OperatorSkin, WeaponData } from '../../types/game';
import { createOperatorMesh } from '../../game/threeModels';
import { soundEngine } from '../../audio/soundEngine';

interface VictoryScreenProps {
  operator: OperatorData;
  weapon: WeaponData;
  kills: number;
  deaths: number;
  score: number;
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
  onOpenStore?: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  operator,
  weapon,
  kills,
  deaths,
  score,
  onPlayAgain,
  onReturnToLobby,
  onOpenStore,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const isSaitama = operator.id === 'saitama';
  const isGoku = operator.id === 'son_goku';
  const [showDialogue, setShowDialogue] = useState(false);

  // 3D Personality Stage
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    soundEngine.playUIClick('deploy');
    soundEngine.playPowerUp('quad_damage');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 50);
    camera.position.set(0, 1.25, 3.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Golden victory hero spotlighting
    const spot = new THREE.SpotLight(isGoku ? '#38bdf8' : '#facc15', 3.5, 20, Math.PI / 4, 0.5);
    spot.position.set(0, 4, 3);
    scene.add(spot);

    const rim = new THREE.DirectionalLight(isSaitama ? '#ef4444' : '#eab308', 2.5);
    rim.position.set(-2, 2, -2);
    scene.add(rim);

    const amb = new THREE.AmbientLight('#ffffff', 0.6);
    scene.add(amb);

    // Golden victory confetti / spark particles
    const pCount = 80;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i += 3) {
      pPos[i] = (Math.random() - 0.5) * 4;
      pPos[i + 1] = Math.random() * 3;
      pPos[i + 2] = (Math.random() - 0.5) * 3;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: isGoku ? '#38bdf8' : '#fde047',
      size: 0.05,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const confetti = new THREE.Points(pGeo, pMat);
    scene.add(confetti);

    // Operator Mesh
    const activeSkin = operator.skins.find(s => s.id === operator.selectedSkinId) || operator.skins[0];
    const opMesh = createOperatorMesh(activeSkin, weapon);
    opMesh.position.set(0, 0, 0);
    scene.add(opMesh);

    let frameId = 0;
    let clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Slow cinematic camera pan
      camera.position.x = Math.sin(time * 0.4) * 0.4;
      camera.lookAt(0, 1.1, 0);

      // Character personality idle animation
      if (isSaitama) {
        // Casual bored breathing with slight shrug
        opMesh.position.y = Math.sin(time * 1.5) * 0.015;
        opMesh.rotation.y = Math.sin(time * 0.6) * 0.12;
      } else if (isGoku) {
        // Excited battle pulse with rapid ki fluctuations
        opMesh.position.y = Math.abs(Math.sin(time * 4)) * 0.025;
        opMesh.rotation.y = Math.sin(time * 0.8) * 0.2;
      } else {
        opMesh.rotation.y = Math.sin(time * 0.5) * 0.15;
      }

      // Confetti fall
      const posArr = confetti.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < posArr.length; i += 3) {
        posArr[i] -= delta * 0.6;
        if (posArr[i] < 0) posArr[i] = 3.0;
      }
      confetti.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const timer = setTimeout(() => setShowDialogue(true), 600);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [operator, weapon, isSaitama, isGoku]);

  return (
    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between overflow-hidden select-none animate-fadeIn">
      {/* 3D Model Stage Canvas */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full z-0 pointer-events-none" />

      {/* Top Banner: VICTORY & TITLE */}
      <div className="relative z-10 px-8 pt-6 flex flex-col items-center text-center">
        <div className="flex items-center space-x-2 text-xs font-mono-tactical text-amber-400 uppercase tracking-widest font-black px-3 py-1 rounded bg-black/70 border border-amber-500/50 backdrop-blur-xs">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>MATCH MVP · TACTICAL CHAMPION</span>
        </div>

        <h1 className="font-heading font-black text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 uppercase tracking-widest mt-1 drop-shadow-[0_0_25px_rgba(234,179,8,0.5)]">
          {isSaitama ? 'ONE PUNCH VICTORY' : isGoku ? 'SAIYAN TRIUMPH' : 'MISSION ACCOMPLISHED'}
        </h1>

        <span className="text-xs font-mono-tactical text-zinc-300 uppercase tracking-wider">
          {operator.name} [{operator.callsign}]
        </span>
      </div>

      {/* Center: Operator Personality Speech Bubble */}
      <div className="relative z-10 flex justify-center px-4 pointer-events-none">
        {showDialogue && (
          <div className="max-w-md w-full bg-black/80 border-2 border-amber-400/80 p-4 rounded-xl clip-tactical-diag shadow-2xl backdrop-blur-md animate-scaleUp text-center space-y-1.5">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-[10px] font-mono-tactical font-black text-amber-400 uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40">
                {isSaitama ? 'PERSONALITY: BOREDOM & APATHY' : isGoku ? 'PERSONALITY: BATTLE OBSESSION' : 'TACTICAL RADIO COMMS'}
              </span>
            </div>

            {/* Saitama's Authentic Bored Reaction */}
            {isSaitama && (
              <>
                <p className="font-heading font-bold text-base md:text-lg text-white leading-snug">
                  "Is that it? What a bore... Wait, what time is it?! Did I miss the Saturday supermarket discount sale?!"
                </p>
                <span className="text-xs text-zinc-400 font-mono-tactical block">
                  *casually yawns, checking grocery cabbage receipt in pocket*
                </span>
              </>
            )}

            {/* Goku's Authentic Enthusiastic Reaction */}
            {isGoku && (
              <>
                <p className="font-heading font-bold text-base md:text-lg text-white leading-snug">
                  "Haha! That was awesome! You guys were really tough, but I've still got way more transformations to show ya! Let's fight again sometime!"
                </p>
                <span className="text-xs text-cyan-400 font-mono-tactical block">
                  *grins widely, stretching arms with crackling Super Saiyan Ki*
                </span>
              </>
            )}

            {!isSaitama && !isGoku && (
              <p className="font-heading font-bold text-base text-white">
                "Sector neutralized. Target eliminated with complete tactical superiority."
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom: Combat Performance Cards & Action Buttons */}
      <div className="relative z-10 p-6 flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto w-full pointer-events-auto">
        {/* Performance Stats cluster */}
        <div className="flex items-center space-x-3 bg-zinc-950/85 border border-zinc-800 p-3 rounded clip-tactical-sm backdrop-blur-md text-xs font-mono-tactical shadow-xl">
          <div className="px-3 border-r border-zinc-800 text-center">
            <span className="text-zinc-500 block text-[10px]">TOTAL KILLS</span>
            <span className="text-white font-black text-base">{kills}</span>
          </div>
          <div className="px-3 border-r border-zinc-800 text-center">
            <span className="text-zinc-500 block text-[10px]">COMBAT SCORE</span>
            <span className="text-amber-400 font-black text-base">{score} XP</span>
          </div>
          <div className="px-3 border-r border-zinc-800 text-center">
            <span className="text-zinc-500 block text-[10px]">CREDITS EARNED</span>
            <span className="text-emerald-400 font-black text-base">+850 C</span>
          </div>
          <div className="px-3 text-center">
            <span className="text-zinc-500 block text-[10px]">COD POINTS</span>
            <span className="text-amber-300 font-black text-base">+50 CP</span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center space-x-3">
          {onOpenStore && (
            <button
              onClick={onOpenStore}
              className="px-4 py-3 bg-zinc-900 border border-amber-500/50 hover:border-amber-400 text-amber-300 font-mono-tactical text-xs font-bold uppercase rounded clip-tactical-sm flex items-center space-x-2 transition-all"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>GOKU FORMS (STORE)</span>
            </button>
          )}

          <button
            onClick={onReturnToLobby}
            className="px-5 py-3 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-200 font-heading text-xs font-bold uppercase tracking-wider rounded clip-tactical-sm flex items-center space-x-2 transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>MAIN LOBBY</span>
          </button>

          <button
            onClick={onPlayAgain}
            className="px-8 py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black font-heading font-black text-sm uppercase tracking-widest rounded clip-tactical-sm shadow-xl shadow-amber-500/25 hover:brightness-110 active:scale-95 transition-all flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4 stroke-[3]" />
            <span>PLAY AGAIN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
