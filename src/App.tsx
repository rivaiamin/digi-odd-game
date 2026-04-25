/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {useState, useEffect, Suspense} from 'react';
import {Canvas} from '@react-three/fiber';
import {OrbitControls, PerspectiveCamera} from '@react-three/drei';
import {motion, AnimatePresence} from 'motion/react';
import {Trophy, Heart, RefreshCw, Info, Loader2, Sparkles} from 'lucide-react';
import {Arena} from './components/Arena';
import {DigiCard} from './components/DigiCard';
import {generatePuzzle, type Puzzle} from './services/geminiService';
import {cn} from './lib/utils';

export default function App() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [gameState, setGameState] = useState<'dealing' | 'guessing' | 'revealing' | 'gameOver'>('dealing');
  const [isFlipped, setIsFlipped] = useState(false);

  const fetchNewPuzzle = async () => {
    setLoading(true);
    setGameState('dealing');
    setIsFlipped(false);
    setSelectedIndex(null);
    try {
      const newPuzzle = await generatePuzzle();
      setPuzzle(newPuzzle);
      
      // Delay flipping for "Dealing" effect
      setTimeout(() => {
        setGameState('guessing');
        setIsFlipped(true);
      }, 1500);
    } catch (error) {
      console.error("Failed to fetch puzzle", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewPuzzle();
  }, []);

  const handleSelect = (index: number) => {
    if (gameState !== 'guessing') return;
    setSelectedIndex(index);
    setGameState('revealing');

    if (index === puzzle?.answer_index) {
      setScore(s => s + 100);
    } else {
      setLives(l => l - 1);
      if (lives <= 1) {
        setTimeout(() => setGameState('gameOver'), 2000);
      }
    }
  };

  const restartGame = () => {
    setScore(0);
    setLives(3);
    fetchNewPuzzle();
  };

  return (
    <div className="relative w-full h-full font-sans select-none overflow-hidden bg-[#05070a]">
      {/* Background Theme Elements */}
      <div className="absolute inset-0 z-0 digital-grid opacity-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glow-orb w-[600px] h-[600px] z-0" />

      {/* 3D Viewport */}
      <div className="absolute inset-0 z-10">
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
          <Suspense fallback={<mesh><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="red" /></mesh>}>
            <Arena />
            {puzzle && (
              <group position={[0, 0.5, 0]}>
                {puzzle.cards.map((card, idx) => (
                  <DigiCard
                    key={idx}
                    position={[(idx - 1.5) * 2.8, 0, 0]}
                    name={card.name}
                    image={card.imageUrl!}
                    isFlipped={isFlipped}
                    isSelected={selectedIndex === idx}
                    isCorrect={puzzle.answer_index === idx}
                    isRevealed={gameState === 'revealing'}
                    onClick={() => handleSelect(idx)}
                  />
                ))}
              </group>
            )}
          </Suspense>
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            maxPolarAngle={Math.PI / 1.8} 
            minPolarAngle={Math.PI / 2.2}
            maxAzimuthAngle={Math.PI / 12}
            minAzimuthAngle={-Math.PI / 12}
          />
        </Canvas>
      </div>

      {/* UI Overlay: Header */}
      <header className="absolute top-12 inset-x-12 flex justify-between items-start z-20 pointer-events-none">
        <motion.div 
          initial={{opacity: 0, x: -20}}
          animate={{opacity: 1, x: 0}}
          className="flex flex-col"
        >
          <h1 className="text-5xl font-black italic tracking-tighter text-white underline decoration-digital-cyan decoration-4 underline-offset-4">
            DIGI-ODD ONE OUT
          </h1>
          <p className="font-mono text-digital-cyan text-xs tracking-[0.2em] mt-2 uppercase">
            [ SYSTEM STATUS: {loading ? "ANALYZING" : "LIVE_CORE"} ]
          </p>
        </motion.div>

        <motion.div 
          initial={{opacity: 0, x: 20}}
          animate={{opacity: 1, x: 0}}
          className="flex gap-12 pointer-events-auto"
        >
          <div className="text-right">
            <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-1">Lives Remaining</p>
            <div className="flex gap-2 justify-end">
              {Array.from({length: 3}).map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-8 h-2 transition-all duration-500",
                    i < lives ? "bg-digital-pink shadow-[0_0_10px_rgba(255,0,122,0.6)]" : "bg-slate-800"
                  )}
                />
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-1">Synchro Score</p>
            <p className="text-3xl font-bold text-digital-cyan tabular-nums tracking-tight">{score.toLocaleString()}</p>
          </div>
        </motion.div>
      </header>

      {/* UI Overlay: Footer (Logic Log) */}
      <footer className="absolute bottom-12 inset-x-12 flex justify-between items-end z-20 border-t border-slate-900 pt-8 pointer-events-none">
        <div className="max-w-md">
          <p className="font-mono text-[10px] text-digital-cyan uppercase mb-3 tracking-[0.3em]">
            LOGIC_LOG_V2.04
          </p>
          <p className="text-sm text-slate-400 leading-relaxed italic font-medium">
            {gameState === 'revealing' && puzzle 
              ? puzzle.explanation 
              : "Analyze the data nodes. Three entities share a structural compatibility tier. Identify the anomaly to resolve the loop."}
          </p>
        </div>

        <div className="flex flex-col items-end pointer-events-auto">
          <AnimatePresence mode="wait">
            {gameState === 'revealing' ? (
              <motion.button
                key="next-btn"
                initial={{opacity: 0, x: 10}}
                animate={{opacity: 1, x: 0}}
                exit={{opacity: 0, x: -10}}
                onClick={fetchNewPuzzle}
                className="bg-digital-cyan text-black font-black px-12 py-3 tracking-tighter text-sm uppercase skew-x-[-12deg] hover:bg-white transition-colors cursor-pointer"
              >
                INTIALIZE NEXT SEQUENCE
              </motion.button>
            ) : (
              <motion.div 
                key="sync-potential"
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                className="flex items-center gap-4"
              >
                <div className="flex gap-1">
                  <div className="w-8 h-2 bg-digital-cyan shadow-[0_0_8px_rgba(0,242,255,0.4)]" />
                  <div className="w-8 h-2 bg-digital-cyan shadow-[0_0_8px_rgba(0,242,255,0.4)]" />
                  <div className="w-8 h-2 bg-slate-800" />
                </div>
                <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Sync Potential</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </footer>

      {/* Loading & Game Over Overlays handled with theme aesthetics */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#05070a]/90 backdrop-blur-2xl z-[60] text-center"
          >
            <div className="w-20 h-20 border-4 border-digital-cyan border-t-transparent rounded-full animate-spin mb-8" />
            <h2 className="text-4xl font-black italic text-white tracking-tighter">DECRYPTING DATA NODES...</h2>
            <div className="mt-4 flex gap-2">
              <span className="w-12 h-1 bg-digital-cyan animate-pulse" />
              <span className="w-12 h-1 bg-digital-cyan animate-pulse delay-75" />
              <span className="w-12 h-1 bg-digital-cyan animate-pulse delay-150" />
            </div>
          </motion.div>
        )}

        {gameState === 'gameOver' && (
          <motion.div 
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-[#05070a]/95 backdrop-blur-3xl px-6"
          >
            <div className="max-w-md w-full text-center">
              <div className="w-24 h-24 bg-digital-pink text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_60px_rgba(255,0,122,0.4)] skew-x-[-12deg]">
                <RefreshCw className="w-12 h-12 skew-x-[12deg]" />
              </div>
              <h1 className="text-7xl font-black italic text-white mb-2 leading-[0.8] tracking-tighter">NETWORK<br/>COLLAPSE</h1>
              <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em] mb-12 mt-4">Critical system failure detected</p>
              
              <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl mb-12 skew-x-[-12deg]">
                <div className="skew-x-[12deg]">
                  <p className="text-slate-500 uppercase font-black text-xs tracking-[0.2em] mb-2">Cycle Potential Result</p>
                  <p className="text-6xl font-black text-digital-cyan tracking-tighter tabular-nums">{score}</p>
                </div>
              </div>

              <button 
                onClick={restartGame}
                className="w-full py-5 bg-digital-cyan text-black font-black text-xl rounded-xl skew-x-[-12deg] hover:bg-white transition-all active:scale-95 shadow-[0_20px_40px_-10px_rgba(0,242,255,0.4)]"
              >
                <span className="skew-x-[12deg] block uppercase tracking-tighter">Initialize Reboot</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Universal Theme Scanline */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] scanline z-50" />
    </div>
  );
}

