import { useState, useEffect, useCallback, useRef } from 'react';

const NEGATIVE_WORDS = [
  'Stress', 'Anxiety', 'Overthinking', 'Burnout',
  'Worry', 'Self-Doubt', 'Fear', 'Pressure',
  'Exhaustion', 'Negativity'
];

const POSITIVE_WORDS = [
  'Confidence', 'Hope', 'Calm', 'Happiness',
  'Gratitude', 'Strength', 'Peace', 'Joy',
  'Growth', 'Clarity', 'Love', 'Energy'
];

const POSITIVE_COLORS = {
  Confidence: ['#4A7C59', '#6BAE7F'],
  Hope: ['#7C5C9E', '#A07CBE'],
  Calm: ['#3A6B8A', '#5A9BC0'],
  Happiness: ['#D4AF37', '#F0D060'],
  Gratitude: ['#8B7355', '#C4A882'],
  Strength: ['#2D5A3D', '#4A7C59'],
  Peace: ['#5A8A6B', '#7CB88F'],
  Joy: ['#C4A882', '#D4AF37'],
  Growth: ['#4A7C59', '#6BAE7F'],
  Clarity: ['#3A6B8A', '#6BAE7F'],
  Love: ['#C0705A', '#D4907A'],
  Energy: ['#D4AF37', '#E8C847'],
};

const FEEDBACK_TEXTS_L1 = ['Great!', 'Keep Going!', 'Smashed it!', 'You Got This!', 'Breathe Easy!', 'Release It!'];
const FEEDBACK_TEXTS_L2 = ['Beautiful!', "You're Growing!", 'Positivity Flows!', 'Amazing!', 'Keep Shining!'];

const StressBusterGame = () => {
  const [gameState, setGameState] = useState('idle'); // idle | level1 | level2 | transition | gameover
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(60);
  const [items, setItems] = useState([]);
  const [destroyed, setDestroyed] = useState(0);
  const [collected, setCollected] = useState(0);
  const [escaped, setEscaped] = useState(0);
  const [particles, setParticles] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [breathePhase, setBreathePhase] = useState('in');

  const containerRef = useRef(null);
  const timerRef = useRef(null);
  const spawnRef = useRef(null);
  const idCounter = useRef(0);

  // Cleanup function
  const clearAllIntervals = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
  }, []);

  // Start game
  const startGame = useCallback(() => {
    clearAllIntervals();
    setScore(0);
    setTimer(60);
    setItems([]);
    setDestroyed(0);
    setCollected(0);
    setEscaped(0);
    setParticles([]);
    setFeedbacks([]);
    setGameState('level1');
    idCounter.current = 0;
  }, [clearAllIntervals]);

  // Timer countdown
  useEffect(() => {
    if (gameState !== 'level1' && gameState !== 'level2') return;
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearAllIntervals();
          setGameState('gameover');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameState, clearAllIntervals]);

  // Spawn logic for Level 1
  useEffect(() => {
    if (gameState !== 'level1') return;
    const getDelay = () => {
      if (destroyed >= 10) return 1000;
      if (destroyed >= 5) return 1500;
      return 2000;
    };
    const spawn = () => {
      setItems(prev => {
        if (prev.length >= 5) return prev;
        const word = NEGATIVE_WORDS[Math.floor(Math.random() * NEGATIVE_WORDS.length)];
        const x = 10 + Math.random() * 70;
        const y = 10 + Math.random() * 60;
        idCounter.current++;
        return [...prev, { id: idCounter.current, word, x, y, type: 'negative', createdAt: Date.now() }];
      });
    };
    spawn();
    spawnRef.current = setInterval(spawn, getDelay());
    return () => clearInterval(spawnRef.current);
  }, [gameState, destroyed]);

  // Auto-remove words after 3.5s in Level 1
  useEffect(() => {
    if (gameState !== 'level1') return;
    const cleanup = setInterval(() => {
      setItems(prev => prev.filter(item => Date.now() - item.createdAt < 3500));
    }, 500);
    return () => clearInterval(cleanup);
  }, [gameState]);

  // Level 1 → Level 2 transition
  useEffect(() => {
    if (gameState === 'level1' && destroyed >= 15) {
      clearAllIntervals();
      setItems([]);
      setGameState('transition');
      setTimeout(() => {
        setTimer(60);
        setGameState('level2');
      }, 2500);
    }
  }, [destroyed, gameState, clearAllIntervals]);

  // Spawn logic for Level 2
  useEffect(() => {
    if (gameState !== 'level2') return;
    const getDelay = () => {
      if (collected >= 10) return 1500;
      if (collected >= 5) return 2000;
      return 3000;
    };
    const spawn = () => {
      setItems(prev => {
        if (prev.length >= 4) return prev;
        const word = POSITIVE_WORDS[Math.floor(Math.random() * POSITIVE_WORDS.length)];
        const x = 10 + Math.random() * 70;
        idCounter.current++;
        return [...prev, { id: idCounter.current, word, x, y: 100, type: 'positive', createdAt: Date.now() }];
      });
    };
    spawn();
    spawnRef.current = setInterval(spawn, getDelay());
    return () => clearInterval(spawnRef.current);
  }, [gameState, collected]);

  // Animate balloons floating up in Level 2
  useEffect(() => {
    if (gameState !== 'level2') return;
    const anim = setInterval(() => {
      setItems(prev => {
        const updated = prev.map(item => ({
          ...item,
          y: item.y - 0.6,
          x: item.x + Math.sin(Date.now() / 800 + item.id) * 0.3,
        }));
        const escaped_items = updated.filter(item => item.y < -15);
        if (escaped_items.length > 0) {
          setEscaped(e => e + escaped_items.length);
        }
        return updated.filter(item => item.y >= -15);
      });
    }, 50);
    return () => clearInterval(anim);
  }, [gameState]);

  // Handle click on negative word (Level 1)
  const handleClickNegative = useCallback((item, e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const px = e.clientX - (rect?.left || 0);
    const py = e.clientY - (rect?.top || 0);

    // Add particles
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: px,
      y: py,
      angle: (i * 45) * (Math.PI / 180),
      color: ['#C0705A', '#D4AF37', '#6BAE7F', '#7C5C9E'][i % 4],
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => setParticles(prev => prev.filter(p => !newParticles.includes(p))), 600);

    // Feedback text
    const fb = { id: Date.now(), text: FEEDBACK_TEXTS_L1[Math.floor(Math.random() * FEEDBACK_TEXTS_L1.length)], x: px, y: py };
    setFeedbacks(prev => [...prev, fb]);
    setTimeout(() => setFeedbacks(prev => prev.filter(f => f.id !== fb.id)), 900);

    setItems(prev => prev.filter(i => i.id !== item.id));
    setScore(s => s + 10);
    setDestroyed(d => d + 1);
  }, []);

  // Handle click on positive balloon (Level 2)
  const handleClickPositive = useCallback((item, e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const px = e.clientX - (rect?.left || 0);
    const py = e.clientY - (rect?.top || 0);

    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x: px,
      y: py,
      angle: (i * 30) * (Math.PI / 180),
      color: POSITIVE_COLORS[item.word]?.[1] || '#6BAE7F',
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => setParticles(prev => prev.filter(p => !newParticles.includes(p))), 600);

    const fb = { id: Date.now(), text: FEEDBACK_TEXTS_L2[Math.floor(Math.random() * FEEDBACK_TEXTS_L2.length)], x: px, y: py };
    setFeedbacks(prev => [...prev, fb]);
    setTimeout(() => setFeedbacks(prev => prev.filter(f => f.id !== fb.id)), 900);

    setItems(prev => prev.filter(i => i.id !== item.id));
    setScore(s => s + 15);
    setCollected(c => c + 1);
  }, []);

  // Breathing animation for game over
  useEffect(() => {
    if (gameState !== 'gameover') return;
    const interval = setInterval(() => {
      setBreathePhase(p => p === 'in' ? 'out' : 'in');
    }, 4000);
    return () => clearInterval(interval);
  }, [gameState]);

  const getRating = () => {
    if (score >= 501) return { text: 'Zen Master! 🏆', pct: 100 };
    if (score >= 351) return { text: 'Finding Your Calm 🌳', pct: 85 };
    if (score >= 201) return { text: 'Growing Stronger 🌿', pct: 65 };
    return { text: "You're Starting 🌱", pct: 40 };
  };

  return (
    <div className="w-full max-w-[640px] mx-auto">
      {/* Game Container */}
      <div
        ref={containerRef}
        className="relative w-full rounded-3xl overflow-hidden select-none"
        style={{
          height: '380px',
          background: gameState === 'level2' || gameState === 'gameover'
            ? 'linear-gradient(180deg, #1A3A2A, #2D5A3D)'
            : 'linear-gradient(180deg, #1A2A1A, #0D1A0D)',
          border: '1px solid rgba(74, 124, 89, 0.3)',
        }}
      >
        {/* ═══ IDLE STATE ═══ */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 p-6">
            <div className="text-6xl mb-4 animate-bounce-soft">💥</div>
            <h3 className="font-heading text-2xl font-bold mb-2">Stress Buster</h3>
            <p className="text-white/60 text-sm text-center mb-8 max-w-xs">
              Destroy negative thoughts, collect positivity. Ready?
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3 rounded-full font-bold text-white transition-all hover:scale-105 glow-primary"
              style={{ background: 'linear-gradient(135deg, #4A7C59, #6BAE7F)' }}
            >
              Start Game →
            </button>
          </div>
        )}

        {/* ═══ GAME HUD ═══ */}
        {(gameState === 'level1' || gameState === 'level2') && (
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2 bg-black/30 backdrop-blur-sm text-white text-xs font-mono font-semibold">
            <span>
              {gameState === 'level1' ? '⚡ Level 1: Destroy Stress' : '🌟 Level 2: Collect Positivity'}
            </span>
            <span className="text-cr-primary-light">💚 {score} pts</span>
            <span>⏱ {timer}s</span>
          </div>
        )}

        {/* ═══ PROGRESS BAR (Level 1) ═══ */}
        {gameState === 'level1' && (
          <div className="absolute top-8 left-4 right-4 z-20">
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((destroyed / 15) * 100, 100)}%`,
                  background: 'linear-gradient(90deg, #4A7C59, #6BAE7F)',
                }}
              />
            </div>
            <p className="text-white/40 text-[10px] mt-1 text-center font-mono">
              {15 - destroyed > 0 ? `${15 - destroyed} more to unlock Level 2` : 'Level 2 unlocking!'}
            </p>
          </div>
        )}

        {/* ═══ LEVEL 1 ITEMS ═══ */}
        {gameState === 'level1' && items.map(item => (
          <button
            key={item.id}
            onClick={(e) => handleClickNegative(item, e)}
            className="absolute z-10 cursor-pointer animate-bounce-soft transition-transform hover:scale-110 active:scale-90"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              background: 'linear-gradient(135deg, #C0705A, #8B4040)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '100px',
              padding: '8px 18px',
              color: 'white',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: '13px',
              boxShadow: '0 4px 15px rgba(192, 112, 90, 0.4)',
              animation: 'fadeIn 0.3s ease-out',
            }}
          >
            {item.word}
          </button>
        ))}

        {/* ═══ LEVEL 2 ITEMS (Balloons) ═══ */}
        {gameState === 'level2' && items.map(item => {
          const colors = POSITIVE_COLORS[item.word] || ['#4A7C59', '#6BAE7F'];
          return (
            <button
              key={item.id}
              onClick={(e) => handleClickPositive(item, e)}
              className="absolute z-10 cursor-pointer transition-transform hover:scale-110 active:scale-90 flex flex-col items-center"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
              }}
            >
              <div
                className="rounded-full flex items-center justify-center shadow-lg"
                style={{
                  width: '68px',
                  height: '78px',
                  background: `linear-gradient(180deg, ${colors[0]}, ${colors[1]})`,
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                <span className="text-white text-[10px] font-bold text-center px-1 leading-tight">{item.word}</span>
              </div>
              {/* String */}
              <svg width="2" height="20" className="opacity-40">
                <line x1="1" y1="0" x2="1" y2="20" stroke="white" strokeWidth="1" />
              </svg>
            </button>
          );
        })}

        {/* ═══ PARTICLES ═══ */}
        {particles.map(p => (
          <span
            key={p.id}
            className="absolute z-30 rounded-full pointer-events-none"
            style={{
              left: p.x,
              top: p.y,
              width: 6,
              height: 6,
              backgroundColor: p.color,
              animation: 'particleExplode 0.5s ease-out forwards',
              '--px': `${Math.cos(p.angle) * 40}px`,
              '--py': `${Math.sin(p.angle) * 40}px`,
            }}
          />
        ))}

        {/* ═══ FEEDBACK TEXT ═══ */}
        {feedbacks.map(fb => (
          <span
            key={fb.id}
            className="absolute z-30 pointer-events-none font-heading font-bold text-sm"
            style={{
              left: fb.x,
              top: fb.y,
              color: '#6BAE7F',
              animation: 'floatUpFade 0.8s ease-out forwards',
            }}
          >
            {fb.text}
          </span>
        ))}

        {/* ═══ TRANSITION SCREEN ═══ */}
        {gameState === 'transition' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/60 backdrop-blur-sm text-white">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="font-heading text-2xl font-bold mb-2">Level 1 Complete!</h3>
            <p className="text-white/70 text-sm">{destroyed} stress thoughts destroyed!</p>
            <p className="text-white/50 text-xs mt-3 animate-pulse">Loading Level 2...</p>
          </div>
        )}

        {/* ═══ GAME OVER ═══ */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 p-6 text-white"
            style={{ background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(12px)' }}
          >
            <h3 className="font-heading text-xl font-bold mb-4">✨ Amazing Session! ✨</h3>

            <div className="grid grid-cols-3 gap-4 mb-4 text-center w-full max-w-xs">
              <div>
                <div className="text-2xl font-bold text-cr-error">{destroyed}</div>
                <div className="text-[10px] text-white/50">🗑️ Stress Removed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-cr-primary-light">{collected}</div>
                <div className="text-[10px] text-white/50">💚 Positivity</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-cr-gold">{score}</div>
                <div className="text-[10px] text-white/50">🏆 Calm Points</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-xs mb-2">
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${getRating().pct}%`,
                    background: 'linear-gradient(90deg, #4A7C59, #6BAE7F, #D4AF37)',
                  }}
                />
              </div>
              <p className="text-center text-sm font-bold mt-1 text-cr-primary-light">{getRating().text}</p>
            </div>

            {/* Breathing circle */}
            <div className="my-3 flex flex-col items-center">
              <div
                className="w-16 h-16 rounded-full border-2 border-cr-primary-light/50 flex items-center justify-center transition-all duration-[4000ms]"
                style={{
                  transform: breathePhase === 'in' ? 'scale(1)' : 'scale(0.6)',
                  opacity: breathePhase === 'in' ? 1 : 0.5,
                  boxShadow: breathePhase === 'in' ? '0 0 30px rgba(107,174,127,0.5)' : '0 0 10px rgba(107,174,127,0.2)',
                }}
              >
                <span className="text-2xl">🌿</span>
              </div>
              <p className="text-white/50 text-xs mt-1">{breathePhase === 'in' ? 'Breathe in...' : 'Breathe out...'}</p>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={startGame}
                className="px-5 py-2 rounded-full text-sm font-bold border border-white/20 text-white hover:bg-white/10 transition-all"
              >
                🔄 Play Again
              </button>
              <a
                href="/register"
                className="px-5 py-2 rounded-full text-sm font-bold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #4A7C59, #6BAE7F)' }}
              >
                Start Journey →
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Inline keyframes for particles and feedback */}
      <style>{`
        @keyframes particleExplode {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--px, 30px), var(--py, -30px)) scale(0); opacity: 0; }
        }
        @keyframes floatUpFade {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-40px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default StressBusterGame;
