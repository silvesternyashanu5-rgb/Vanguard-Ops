import React, { useState } from 'react';
import { ArrowLeft, ShoppingBag, Coins, Zap, Shield, Sparkles, Check, Flame, Lock } from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine';
import { OPERATORS } from '../../data/gameData';

interface StoreLayerProps {
  unlockedSkinIds: string[];
  onUnlockSkin: (skinId: string) => void;
  onBack: () => void;
}

export const StoreLayer: React.FC<StoreLayerProps> = ({
  unlockedSkinIds,
  onUnlockSkin,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'characters' | 'crates' | 'mythic'>('characters');
  const [credits, setCredits] = useState<number>(40334);
  const [cp, setCp] = useState<number>(1250);
  const [purchasedSkinIds, setPurchasedSkinIds] = useState<string[]>(unlockedSkinIds);
  const [storeToast, setStoreToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setStoreToast(msg);
    setTimeout(() => setStoreToast(null), 2800);
  };

  const gokuOperator = OPERATORS.find(o => o.id === 'son_goku');
  const gokuStoreForms = gokuOperator?.skins.filter(s => (s.formNumber || 0) >= 4) || [];

  const handlePurchaseForm = (skinId: string, costCP: number, name: string) => {
    if (cp >= costCP) {
      setCp(prev => prev - costCP);
      setPurchasedSkinIds(prev => [...prev, skinId]);
      onUnlockSkin(skinId);
      soundEngine.playUIClick('deploy');
      soundEngine.playPowerUp('quad_damage');
      showToast(`Unlocked ${name}!`);
    } else {
      soundEngine.playUIClick('select');
      showToast('Insufficient COD Points (CP). Complete matches to earn more!');
    }
  };

  const storeCrates = [
    {
      id: 'item_samurai',
      title: "Samurai's Soul Mythic Series",
      subtitle: 'Legendary Damascus & Katana Blueprint',
      cost: 450,
      badge: 'MYTHIC DRAW',
      color: 'from-amber-600 to-red-600',
    },
    {
      id: 'item_cyber_crate',
      title: 'Neon Overclock Crate',
      subtitle: '5 Epic Cyber Glitch Camouflages',
      cost: 160,
      badge: 'FEATURED',
      color: 'from-cyan-600 to-blue-600',
    },
    {
      id: 'item_apex_pack',
      title: 'Titan Exosuit Bundle',
      subtitle: 'Includes Reaper Heavy Exoskeleton Skin',
      cost: 320,
      badge: 'LIMITED TIME',
      color: 'from-purple-600 to-indigo-600',
    },
  ];

  return (
    <div className="absolute inset-0 z-40 h-dvh bg-[#080a0f] text-white flex flex-col overflow-hidden select-none">
      {storeToast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded bg-zinc-950/95 border border-amber-400 text-amber-300 text-xs font-mono-tactical font-bold shadow-xl">
          {storeToast}
        </div>
      )}

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
            <span className="text-amber-400 whitespace-nowrap">STORE</span>
            <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono-tactical border border-amber-500/30 whitespace-nowrap">
              ARSENAL & TRANSFORMATIONS
            </span>
          </h1>
        </div>

        {/* Currency Display */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] lg:text-xs font-mono-tactical">
            <span className="w-3.5 h-3.5 lg:w-4 lg:h-4 rounded-full bg-zinc-700 text-[9px] flex items-center justify-center font-bold text-zinc-300">C</span>
            <span className="font-bold text-zinc-200">{credits.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-amber-500/40 text-[11px] lg:text-xs font-mono-tactical">
            <span className="w-3.5 h-3.5 lg:w-4 lg:h-4 rounded-full bg-amber-500 text-[9px] flex items-center justify-center font-bold text-black">CP</span>
            <span className="font-bold text-amber-400">{cp.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="px-3 lg:px-6 py-1.5 lg:py-2.5 bg-zinc-950/90 border-b border-zinc-800 flex items-center space-x-2 overflow-x-auto shrink-0">
        <button
          onClick={() => {
            setActiveTab('characters');
            soundEngine.playUIClick('tab');
          }}
          className={`flex items-center space-x-1.5 px-3 py-1 lg:px-4 lg:py-1.5 rounded text-[10px] lg:text-xs font-mono-tactical font-black uppercase tracking-wider transition-all border whitespace-nowrap shrink-0 ${
            activeTab === 'characters'
              ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>CHARACTERS & TRANSFORMATIONS</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('crates');
            soundEngine.playUIClick('tab');
          }}
          className={`flex items-center space-x-1.5 px-3 py-1 lg:px-4 lg:py-1.5 rounded text-[10px] lg:text-xs font-mono-tactical font-bold uppercase tracking-wider transition-all border whitespace-nowrap shrink-0 ${
            activeTab === 'crates'
              ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>SUPPLY CRATES</span>
        </button>
      </div>

      {/* Main Grid Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 lg:p-6 max-w-6xl mx-auto w-full space-y-4 lg:space-y-6">
        {/* CHARACTERS SECTION (Goku's Form 4 and above) */}
        {activeTab === 'characters' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div>
                <span className="text-xs font-mono-tactical text-amber-400 uppercase font-black tracking-widest block">
                  // DRAGON BALL UNIVERSE · SAIYAN TRANSCENDENCE
                </span>
                <h2 className="font-heading font-black text-2xl text-white uppercase tracking-wider">
                  Son Goku Transformations (Form 4 & Above)
                </h2>
              </div>
              <span className="text-xs text-zinc-400 font-mono-tactical">
                UNLOCK ONCE · PERMANENT ACROSS OPERATOR ROSTER
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {gokuStoreForms.map(form => {
                const isOwned = purchasedSkinIds.includes(form.id);

                return (
                  <div
                    key={form.id}
                    className={`bg-zinc-900/80 border rounded-lg overflow-hidden flex flex-col justify-between clip-tactical-sm transition-all shadow-xl ${
                      isOwned ? 'border-emerald-500/50' : 'border-zinc-800 hover:border-amber-400/80'
                    }`}
                  >
                    {/* Header banner with aura color gradient */}
                    <div
                      className="p-4 relative flex flex-col justify-between h-40 bg-gradient-to-b from-black/50 via-zinc-900 to-zinc-950"
                      style={{
                        borderTop: `4px solid ${form.hairColor || '#facc15'}`
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-4 h-4 rounded-full border border-white/60 shadow-md"
                            style={{ backgroundColor: form.hairColor }}
                          />
                          <span className="text-[10px] font-mono-tactical font-black text-amber-400 uppercase tracking-widest">
                            {form.multiplier}
                          </span>
                        </div>
                        <span className={`text-[10px] font-mono-tactical font-bold px-2 py-0.5 rounded uppercase ${
                          form.rarity === 'Mythic' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                          form.rarity === 'Legendary' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                          'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        }`}>
                          {form.rarity}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-heading font-black text-lg text-white uppercase drop-shadow">
                          {form.name}
                        </h3>
                        <p className="text-[11px] text-zinc-300 font-sans leading-relaxed mt-0.5 line-clamp-2">
                          {form.transformationLore}
                        </p>
                      </div>
                    </div>

                    {/* Bottom buy/owned button */}
                    <div className="p-3.5 bg-zinc-950/80 border-t border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-xs font-mono-tactical">
                        <span className="w-4 h-4 rounded-full bg-amber-500 text-[10px] flex items-center justify-center font-bold text-black">CP</span>
                        <span className="font-bold text-amber-400">{form.priceCP || 350}</span>
                      </div>

                      <button
                        onClick={() => handlePurchaseForm(form.id, form.priceCP || 350, form.name)}
                        disabled={isOwned}
                        className={`px-4 py-2 text-xs font-mono-tactical font-black uppercase tracking-wider rounded clip-tactical-sm transition-all flex items-center space-x-1.5 ${
                          isOwned
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                            : 'bg-amber-500 text-black hover:bg-amber-400 active:scale-95 shadow-md shadow-amber-500/20'
                        }`}
                      >
                        {isOwned ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>UNLOCKED</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>UNLOCK FORM</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUPPLY CRATES TAB */}
        {activeTab === 'crates' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {storeCrates.map(item => (
              <div
                key={item.id}
                className="bg-zinc-900/60 border border-zinc-800 rounded-lg overflow-hidden flex flex-col justify-between clip-tactical-sm hover:border-zinc-700 transition-all"
              >
                <div className={`h-48 p-5 bg-gradient-to-br ${item.color} flex flex-col justify-between relative`}>
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded bg-black/60 text-[10px] font-mono-tactical font-bold text-amber-400 border border-amber-500/30">
                      {item.badge}
                    </span>
                    <Sparkles className="w-5 h-5 text-white/70" />
                  </div>

                  <div>
                    <h3 className="font-heading font-black text-xl text-white uppercase drop-shadow">
                      {item.title}
                    </h3>
                    <p className="text-xs text-white/80 font-sans mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between border-t border-zinc-800/80 bg-zinc-950/40">
                  <div className="flex items-center space-x-1.5 text-sm font-mono-tactical">
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-[10px] flex items-center justify-center font-bold text-black">CP</span>
                    <span className="font-bold text-amber-400">{item.cost}</span>
                  </div>

                  <button
                    onClick={() => {
                      if (cp >= item.cost) {
                        setCp(cp - item.cost);
                        soundEngine.playUIClick('deploy');
                        soundEngine.playPowerUp('quad_damage');
                        showToast(`Unlocked ${item.title}!`);
                      } else {
                        showToast('Insufficient COD Points (CP)!');
                      }
                    }}
                    className="px-4 py-2 text-xs font-mono-tactical font-bold uppercase tracking-wider rounded clip-tactical-sm bg-amber-500 text-black hover:bg-amber-400 active:scale-95"
                  >
                    UNLOCK CRATE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
