import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Award, 
  ShoppingBag, 
  RotateCcw, 
  Home, 
  Sparkles, 
  Flame, 
  Check, 
  Zap, 
  Target, 
  Crosshair, 
  Shield, 
  Activity, 
  TrendingUp, 
  Star, 
  Users, 
  Share2, 
  ChevronRight, 
  Crown,
  Wifi,
  Clock
} from 'lucide-react';
import * as THREE from 'three';
import { EndOfMatchStats, MatchAward, OperatorData, WeaponData } from '../../types/game';
import { createOperatorMesh } from '../../game/threeModels';
import { soundEngine } from '../../audio/soundEngine';

interface EndOfMatchScreenProps {
  stats: EndOfMatchStats;
  operator: OperatorData;
  weapon: WeaponData;
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
  onOpenStore?: () => void;
}

type TabType = 'overview' | 'performance' | 'awards' | 'scoreboard' | 'progression';

export const EndOfMatchScreen: React.FC<EndOfMatchScreenProps> = ({
  stats,
  operator,
  weapon,
  onPlayAgain,
  onReturnToLobby,
  onOpenStore,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedAward, setSelectedAward] = useState<MatchAward | null>(stats.awards[0] || null);
  const [animatedXp, setAnimatedXp] = useState(0);
  const mountRef = useRef<HTMLDivElement>(null);

  const isSaitama = operator.id === 'saitama';
  const isGoku = operator.id === 'son_goku';
  const isWin = stats.isPlayerWinner;

  // Sound & XP Fill Animation on mount
  useEffect(() => {
    soundEngine.playUIClick('deploy');
    if (isWin) {
      soundEngine.playAnnouncer('victory');
    } else {
      soundEngine.playAnnouncer('defeat');
    }

    // Animate XP
    const targetXp = stats.rewards.xpGained;
    let current = 0;
    const step = Math.max(10, Math.floor(targetXp / 30));
    const interval = setInterval(() => {
      current += step;
      if (current >= targetXp) {
        current = targetXp;
        clearInterval(interval);
        soundEngine.playAwardUnlock();
      }
      setAnimatedXp(current);
    }, 25);

    return () => clearInterval(interval);
  }, [isWin, stats.rewards.xpGained]);

  // 3D Personality Stage in Background
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 50);
    camera.position.set(0, 1.25, 3.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Hero Spotlights
    const primaryColor = isWin ? (isGoku ? '#38bdf8' : '#facc15') : '#ef4444';
    const spot = new THREE.SpotLight(primaryColor, 3.5, 20, Math.PI / 4, 0.5);
    spot.position.set(0, 4, 3);
    scene.add(spot);

    const rim = new THREE.DirectionalLight(isSaitama ? '#ef4444' : isGoku ? '#f59e0b' : '#3b82f6', 2.0);
    rim.position.set(-2, 2, -2);
    scene.add(rim);

    const amb = new THREE.AmbientLight('#ffffff', 0.65);
    scene.add(amb);

    // Confetti or Smoke particles
    const pCount = isWin ? 90 : 35;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i += 3) {
      pPos[i] = (Math.random() - 0.5) * 4.5;
      pPos[i + 1] = Math.random() * 3.5;
      pPos[i + 2] = (Math.random() - 0.5) * 3.5;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: isWin ? (isGoku ? '#38bdf8' : '#fde047') : '#94a3b8',
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      blending: isWin ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Operator Mesh
    const activeSkin = operator.skins.find(s => s.id === operator.selectedSkinId) || operator.skins[0];
    const opMesh = createOperatorMesh(activeSkin, weapon);
    opMesh.position.set(0, 0, 0);
    scene.add(opMesh);

    let frameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Camera pan
      camera.position.x = Math.sin(time * 0.35) * 0.35;
      camera.lookAt(0, 1.1, 0);

      // Character personality idle animation
      if (isSaitama) {
        // Casual bored breathing
        opMesh.position.y = Math.sin(time * 1.4) * 0.015;
        opMesh.rotation.y = Math.sin(time * 0.5) * 0.12;
      } else if (isGoku) {
        // High-energy combat readiness
        opMesh.position.y = Math.abs(Math.sin(time * 4)) * 0.025;
        opMesh.rotation.y = Math.sin(time * 0.8) * 0.2;
      } else {
        opMesh.rotation.y = Math.sin(time * 0.5) * 0.15;
      }

      // Particle update
      const posArr = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < posArr.length; i += 3) {
        posArr[i] -= delta * 0.5;
        if (posArr[i] < 0) posArr[i] = 3.5;
      }
      particles.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
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
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [operator, weapon, isSaitama, isGoku, isWin]);

  const handleShare = () => {
    soundEngine.playUIClick('select');
    navigator.clipboard?.writeText?.(
      `💥 Match MVP in Vanguard Ops! Kills: ${stats.playerStats.kills} | Damage: ${stats.playerStats.totalDamage} | Score: ${stats.playerStats.score}`
    );
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#06080d]/92 backdrop-blur-lg flex flex-col justify-between overflow-hidden select-none animate-fadeIn text-white">
      {/* 3D Background Canvas */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-60" />

      {/* Top Tactical Banner */}
      <div className="relative z-10 px-6 pt-4 pb-2 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className={`w-9 h-9 rounded flex items-center justify-center font-heading font-black text-lg border ${
            isWin 
              ? 'bg-amber-500/20 border-amber-500 text-amber-400' 
              : 'bg-red-500/20 border-red-500 text-red-400'
          }`}>
            {isWin ? <Trophy className="w-5 h-5" /> : <Flame className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-[11px] font-mono-tactical font-black tracking-widest uppercase px-2 py-0.5 rounded border ${
                isWin 
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' 
                  : 'bg-red-500/15 border-red-500/40 text-red-300'
              }`}>
                {isWin ? 'TACTICAL VICTORY' : 'MISSION COMPLETE · DEFEAT'}
              </span>
              <span className="text-xs text-zinc-400 font-mono-tactical">
                MATCH TIME: {Math.floor(stats.playerStats.matchDurationSeconds / 60)}:{(stats.playerStats.matchDurationSeconds % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-heading font-black tracking-wider text-white uppercase mt-0.5">
              {stats.mvp.title}
            </h1>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-zinc-900/90 border border-zinc-800 p-1 rounded-lg clip-tactical-sm">
          {[
            { id: 'overview', label: 'MVP PODIUM', icon: Crown },
            { id: 'performance', label: 'METRICS', icon: Activity },
            { id: 'awards', label: 'MEDALS', icon: Award },
            { id: 'scoreboard', label: 'SCOREBOARD', icon: Users },
            { id: 'progression', label: 'REWARDS', icon: TrendingUp },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundEngine.playUIClick('tab');
                  setActiveTab(tab.id as TabType);
                }}
                className={`px-3 py-1.5 rounded text-xs font-mono-tactical uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
                  isActive 
                    ? 'bg-amber-500 text-black font-black shadow-md shadow-amber-500/30' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content Display */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-6 flex flex-col items-center justify-center max-w-6xl mx-auto w-full">
        {/* TAB 1: OVERVIEW & MVP PODIUM */}
        {activeTab === 'overview' && (
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left: MVP Crown Card */}
            <div className="flex-1 max-w-md w-full bg-zinc-950/85 border border-amber-500/50 p-5 rounded-xl clip-tactical-diag shadow-2xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-amber-400 animate-pulse" />
                  <span className="font-heading font-black text-sm text-amber-400 uppercase tracking-widest">
                    MATCH MVP AWARD
                  </span>
                </div>
                <span className="text-xs font-mono-tactical text-zinc-400">
                  {stats.mvp.kd} K/D
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-heading font-black text-white tracking-wider uppercase">
                  {stats.mvp.name}
                </h2>
                <span className="text-xs font-mono-tactical text-amber-400/90 block mt-0.5">
                  OPERATOR: {stats.mvp.operatorName} · {stats.mvp.score} XP
                </span>
              </div>

              {/* Personality Dialogue Box */}
              <div className="bg-black/60 border border-zinc-800 p-3.5 rounded-lg space-y-1">
                <span className="text-[10px] font-mono-tactical text-amber-400 font-bold uppercase tracking-widest block">
                  {isSaitama ? 'SAITAMA (HERO FOR FUN)' : isGoku ? 'SON GOKU (MARTIAL ARTIST)' : 'RADIO TRANSMISSION'}
                </span>
                <p className="text-sm font-heading font-medium text-zinc-200 leading-snug italic">
                  {stats.mvp.quote}
                </p>
                {isSaitama && (
                  <span className="text-[11px] text-zinc-500 font-mono-tactical block mt-1">
                    *casually yawns, checking grocery cabbage receipt in pocket*
                  </span>
                )}
                {isGoku && (
                  <span className="text-[11px] text-cyan-400 font-mono-tactical block mt-1">
                    *stretches arms with crackling Super Saiyan ki sparks*
                  </span>
                )}
              </div>

              {/* Quick High-Impact Highlights */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono-tactical pt-1">
                <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">TOTAL KILLS</span>
                  <span className="text-amber-400 font-black text-base">{stats.playerStats.kills}</span>
                </div>
                <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">TOTAL DAMAGE</span>
                  <span className="text-white font-black text-base">{stats.playerStats.totalDamage}</span>
                </div>
                <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">ACCURACY</span>
                  <span className="text-emerald-400 font-black text-base">{stats.playerStats.accuracyPercentage}%</span>
                </div>
              </div>
            </div>

            {/* Right: Quick Action Cards & Match Badges */}
            <div className="flex-1 max-w-md w-full space-y-3">
              <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl clip-tactical-sm space-y-3">
                <span className="text-xs font-mono-tactical font-black text-zinc-400 uppercase tracking-wider block">
                  COMBAT MERIT SUMMARY
                </span>

                <div className="space-y-2">
                  {stats.awards.slice(0, 3).map(award => (
                    <div 
                      key={award.id}
                      className="flex items-center justify-between p-2.5 rounded bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/50 transition-colors"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Award className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <div className="text-xs font-heading font-black text-white">{award.title}</div>
                          <div className="text-[10px] text-zinc-400 font-mono-tactical line-clamp-1">{award.description}</div>
                        </div>
                      </div>
                      <span className="text-xs font-mono-tactical font-black text-emerald-400 shrink-0">
                        +{award.xpBonus} XP
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Level Up Banner */}
              <div className="bg-gradient-to-r from-amber-500/20 via-zinc-900 to-amber-500/20 border border-amber-500/40 p-3.5 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <div>
                    <span className="text-xs font-heading font-black text-white block">
                      LEVEL PROGRESSION (LV. {stats.rewards.currentLevel})
                    </span>
                    <span className="text-[10px] font-mono-tactical text-amber-300">
                      +{animatedXp} MATCH XP GAINED
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono-tactical font-black text-emerald-400">
                  +{stats.rewards.creditsEarned} C
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DETAILED PERFORMANCE METRICS */}
        {activeTab === 'performance' && (
          <div className="w-full max-w-4xl bg-zinc-950/90 border border-zinc-800 rounded-xl p-6 shadow-2xl backdrop-blur-md space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="font-heading font-black text-xl text-white uppercase tracking-wider">
                  TACTICAL COMBAT TELEMETRY
                </h3>
                <span className="text-xs font-mono-tactical text-zinc-400">
                  REAL-TIME STATISTICAL BREAKDOWN OF ARENA ENGAGEMENTS
                </span>
              </div>
              <div className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded text-amber-300 font-mono-tactical text-xs font-black">
                RATING: S+ APEX
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[
                { label: 'CONFIRMED ELIMINATIONS', val: stats.playerStats.kills, sub: 'Kills', color: 'text-amber-400' },
                { label: 'TACTICAL CASUALTIES', val: stats.playerStats.deaths, sub: 'Deaths', color: 'text-zinc-300' },
                { label: 'KILL / DEATH RATIO', val: stats.playerStats.kdRatio.toFixed(2), sub: 'K/D Ratio', color: 'text-emerald-400' },
                { label: 'TOTAL DAMAGE DEALT', val: stats.playerStats.totalDamage, sub: 'Hit Points', color: 'text-red-400' },
                { label: 'HEADSHOTS LANDED', val: stats.playerStats.headshots, sub: `${stats.playerStats.headshotPercentage}% of kills`, color: 'text-amber-300' },
                { label: 'WEAPON ACCURACY', val: `${stats.playerStats.accuracyPercentage}%`, sub: 'Direct hits', color: 'text-cyan-400' },
                { label: 'HIGHEST KILL STREAK', val: stats.playerStats.highestStreak, sub: 'Unbroken kills', color: 'text-amber-500' },
                { label: 'POWER-UPS HARVESTED', val: stats.playerStats.powerUpsCollected, sub: 'Pickups', color: 'text-purple-400' },
                { label: 'SUPERS / ABILITIES USED', val: stats.playerStats.abilitiesUsed, sub: 'Special Attacks', color: 'text-blue-400' },
                { label: 'COMBAT SCORE', val: `${stats.playerStats.score} XP`, sub: 'Score Points', color: 'text-yellow-400' },
                { label: 'MATCH DURATION', val: `${Math.floor(stats.playerStats.matchDurationSeconds / 60)}m ${stats.playerStats.matchDurationSeconds % 60}s`, sub: 'Active combat', color: 'text-zinc-300' },
                { label: 'RANK POINTS EARNED', val: `${stats.rewards.rankPointsGained > 0 ? '+' : ''}${stats.rewards.rankPointsGained} LP`, sub: stats.rewards.rankTier, color: 'text-emerald-400' },
              ].map((stat, i) => (
                <div key={i} className="bg-zinc-900/80 border border-zinc-800/90 p-3.5 rounded-lg clip-tactical-sm">
                  <span className="text-[10px] font-mono-tactical text-zinc-500 block tracking-wider uppercase mb-1">
                    {stat.label}
                  </span>
                  <div className={`text-xl font-heading font-black ${stat.color}`}>
                    {stat.val}
                  </div>
                  <span className="text-[11px] font-mono-tactical text-zinc-400 block mt-0.5">
                    {stat.sub}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AWARDS & MEDALS */}
        {activeTab === 'awards' && (
          <div className="w-full max-w-4xl bg-zinc-950/90 border border-zinc-800 rounded-xl p-6 shadow-2xl backdrop-blur-md flex flex-col md:flex-row gap-6">
            {/* Award Badges Grid */}
            <div className="flex-1 space-y-3">
              <span className="text-xs font-mono-tactical font-black text-zinc-400 uppercase tracking-wider block">
                EARNED BATTLEFIELD HONORS ({stats.awards.length})
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                {stats.awards.map(award => {
                  const isSelected = selectedAward?.id === award.id;
                  return (
                    <div
                      key={award.id}
                      onClick={() => {
                        soundEngine.playUIClick('select');
                        setSelectedAward(award);
                      }}
                      className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-start space-x-3 ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 shadow-lg shadow-amber-500/20'
                          : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                        award.rarity === 'mythic' ? 'bg-amber-500/30 border-amber-400 text-amber-300' :
                        award.rarity === 'legendary' ? 'bg-orange-500/30 border-orange-400 text-orange-300' :
                        award.rarity === 'epic' ? 'bg-purple-500/30 border-purple-400 text-purple-300' :
                        'bg-blue-500/30 border-blue-400 text-blue-300'
                      }`}>
                        <Award className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-heading font-black text-white truncate">
                            {award.title}
                          </span>
                          <span className="text-[10px] font-mono-tactical font-black text-amber-400">
                            +{award.xpBonus} XP
                          </span>
                        </div>
                        <span className="text-[10px] font-mono-tactical text-zinc-400 uppercase tracking-widest block mt-0.5">
                          {award.category} · {award.rarity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Award Detail Panel */}
            {selectedAward && (
              <div className="w-full md:w-72 bg-zinc-900/90 border border-zinc-700 p-5 rounded-xl clip-tactical-sm flex flex-col items-center text-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/25">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-heading font-black text-lg text-white uppercase tracking-wider">
                    {selectedAward.title}
                  </h4>
                  <span className="text-xs font-mono-tactical text-amber-400 font-bold uppercase tracking-widest">
                    {selectedAward.rarity} MERIT · +{selectedAward.xpBonus} XP
                  </span>
                </div>
                <p className="text-xs font-mono-tactical text-zinc-300 leading-relaxed">
                  {selectedAward.description}
                </p>
                <div className="w-full pt-3 border-t border-zinc-800 text-[10px] font-mono-tactical text-zinc-500">
                  PERMANENTLY SAVED TO OPERATOR DOSSIER
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: COMPLETE MATCH SCOREBOARD */}
        {activeTab === 'scoreboard' && (
          <div className="w-full max-w-4xl bg-zinc-950/90 border border-zinc-800 rounded-xl p-5 shadow-2xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="font-heading font-black text-lg text-white uppercase tracking-wider">
                  ALL-COMBATANT SCOREBOARD
                </h3>
              </div>
              <div className="flex items-center space-x-2 text-xs font-mono-tactical text-zinc-400">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>SERVER: EU-WEST-2 (32ms)</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-tactical">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
                    <th className="pb-2">RANK & PLAYER</th>
                    <th className="pb-2">TEAM</th>
                    <th className="pb-2 text-center">KILLS</th>
                    <th className="pb-2 text-center">DEATHS</th>
                    <th className="pb-2 text-center">K/D</th>
                    <th className="pb-2 text-center">PING</th>
                    <th className="pb-2 text-right">SCORE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {stats.scoreboard.map((row, idx) => {
                    const isMvp = idx === 0;
                    return (
                      <tr 
                        key={row.id}
                        className={`transition-colors ${
                          row.isPlayer 
                            ? 'bg-amber-500/15 font-black text-amber-200' 
                            : 'hover:bg-zinc-900/60 text-zinc-300'
                        }`}
                      >
                        <td className="py-2.5 flex items-center space-x-2">
                          <span className={`w-5 h-5 rounded text-[10px] font-black flex items-center justify-center ${
                            isMvp ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="font-heading font-bold text-sm">
                            {row.name} {row.isPlayer && '(YOU)'}
                          </span>
                          {isMvp && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            row.team === 'blue' ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'
                          }`}>
                            {row.team}
                          </span>
                        </td>
                        <td className="py-2.5 text-center font-bold text-white">{row.kills}</td>
                        <td className="py-2.5 text-center text-zinc-400">{row.deaths}</td>
                        <td className="py-2.5 text-center text-emerald-400">
                          {row.deaths > 0 ? (row.kills / row.deaths).toFixed(2) : row.kills.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-center text-zinc-400">{row.ping}ms</td>
                        <td className="py-2.5 text-right font-black text-amber-400">{row.score}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: PROGRESSION & BATTLE PASS REWARDS */}
        {activeTab === 'progression' && (
          <div className="w-full max-w-4xl bg-zinc-950/90 border border-zinc-800 rounded-xl p-6 shadow-2xl backdrop-blur-md space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="font-heading font-black text-xl text-white uppercase tracking-wider">
                  PROGRESSION & TACTICAL CRATES
                </h3>
                <span className="text-xs font-mono-tactical text-zinc-400">
                  XP LEVEL-UPS, BATTLE PASS TIERS, AND WEAPON PROFICIENCY
                </span>
              </div>
              <div className="text-xs font-mono-tactical font-black text-amber-400">
                SEASON 1: TACTICAL AWAKENING
              </div>
            </div>

            {/* Level Bar */}
            <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-tactical">
                <span className="text-zinc-400 uppercase">
                  OPERATOR RANK: <span className="text-white font-bold">LEVEL {stats.rewards.currentLevel}</span>
                </span>
                <span className="text-amber-400 font-black">
                  +{stats.rewards.xpGained} XP GAINED
                </span>
              </div>

              {/* Progress track */}
              <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-full transition-all duration-1000 shadow-md shadow-amber-500/50"
                  style={{ width: `${stats.rewards.levelProgressPercent}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-mono-tactical text-zinc-500">
                <span>LVL {stats.rewards.previousLevel}</span>
                <span>LEVEL UP BONUS UNLOCKED!</span>
                <span>LVL {stats.rewards.currentLevel + 1} (NEXT)</span>
              </div>
            </div>

            {/* Currency Rewards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl clip-tactical-sm flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black">
                  C
                </div>
                <div>
                  <span className="text-[10px] font-mono-tactical text-zinc-400 uppercase block">CREDITS GAINED</span>
                  <span className="text-lg font-heading font-black text-emerald-400">+{stats.rewards.creditsEarned} C</span>
                </div>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl clip-tactical-sm flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black">
                  CP
                </div>
                <div>
                  <span className="text-[10px] font-mono-tactical text-zinc-400 uppercase block">COD POINTS BONUS</span>
                  <span className="text-lg font-heading font-black text-amber-300">+{stats.rewards.codPoints} CP</span>
                </div>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl clip-tactical-sm flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-black">
                  BP
                </div>
                <div>
                  <span className="text-[10px] font-mono-tactical text-zinc-400 uppercase block">BATTLE PASS</span>
                  <span className="text-lg font-heading font-black text-purple-300">TIER {stats.rewards.battlePassTier}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA Action Bar */}
      <div className="relative z-10 px-6 py-4 border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 max-w-6xl mx-auto w-full">
        {/* Share Button */}
        <button
          onClick={handleShare}
          className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-xs font-mono-tactical text-zinc-300 flex items-center space-x-2 transition-all active:scale-95"
        >
          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copiedLink ? 'RESULTS COPIED!' : 'SHARE COMBAT STATS'}</span>
        </button>

        {/* Primary Action Buttons */}
        <div className="flex items-center space-x-3">
          {onOpenStore && (
            <button
              onClick={() => {
                soundEngine.playUIClick('select');
                onOpenStore();
              }}
              className="px-4 py-3 bg-zinc-900 border border-amber-500/40 hover:border-amber-400 text-amber-300 font-mono-tactical text-xs font-bold uppercase rounded clip-tactical-sm flex items-center space-x-2 transition-all"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>VISIT STORE / SKINS</span>
            </button>
          )}

          <button
            onClick={() => {
              soundEngine.playUIClick('back');
              onReturnToLobby();
            }}
            className="px-5 py-3 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-200 font-heading text-xs font-bold uppercase tracking-wider rounded clip-tactical-sm flex items-center space-x-2 transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>RETURN TO LOBBY</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playUIClick('deploy');
              onPlayAgain();
            }}
            className="px-8 py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black font-heading font-black text-sm uppercase tracking-widest rounded clip-tactical-sm shadow-xl shadow-amber-500/25 hover:brightness-110 active:scale-95 transition-all flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4 stroke-[3]" />
            <span>PLAY AGAIN (REMATCH)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
