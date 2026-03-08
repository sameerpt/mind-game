"use client";
import Image from "next/image";
import { useEffect, useState, useRef, useCallback } from "react";
import Confetti from "react-confetti";

const getInitialDeck = () => {
  const memoryCards = [
    "blues",
    "Bomb",
    "chuck",
    "Eagle",
    "pig",
    "red",
    "small",
    "smallpig",
  ];

  return [...memoryCards, ...memoryCards];
};

export default function MindGame() {
  const [cards, setCards] = useState<string[]>(getInitialDeck);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [solved, setSolved] = useState<number[]>([]);
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [bestTime, setBestTime] = useState<number | null>(null);

  // High-reliability sound URLs
  const FLIP_SOUND = "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3";
  const MATCH_SOUND = "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3";
  const WIN_FANFARE = "https://www.soundjay.com/misc/sounds/success-fanfare-trumpet-01.mp3";

  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const savedBest = localStorage.getItem("mind-game-best-time");
    if (savedBest) setBestTime(parseInt(savedBest));

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Shuffle on mount
  useEffect(() => {
    setCards((prev) => [...prev].sort(() => Math.random() - 0.5));
  }, []);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  // ROBUST SOUND PLAYER
  const triggerSound = (url: string, loop = false) => {
    try {
      const audio = new Audio(url);
      audio.loop = loop;
      audio.play().catch((err) => console.log("Audio play blocked/failed:", err));
      if (loop) backgroundMusicRef.current = audio;
    } catch (e) { }
  };

  const checkResult = useCallback(() => {
    const [first, second] = flipped;
    if (cards[first] === cards[second]) {
      setSolved((prev) => [...prev, ...flipped]);
      triggerSound(MATCH_SOUND);
    }
    setFlipped([]);
  }, [cards, flipped]);

  useEffect(() => {
    if (flipped.length === 2) {
      const timer = setTimeout(() => checkResult(), 600);
      return () => clearTimeout(timer);
    }
  }, [flipped, checkResult]);

  const matchWinner = solved.length === cards.length && cards.length > 0;

  useEffect(() => {
    if (matchWinner) {
      setIsActive(false);
      triggerSound(WIN_FANFARE, true);
      if (!bestTime || time < bestTime) {
        setBestTime(time);
        localStorage.setItem("mind-game-best-time", time.toString());
      }
    }
  }, [matchWinner, time, bestTime]);

  const checkCard = (index: number) => {
    // TRIGGER SOUND FOR EVERY CLICK IMMEDIATELY
    triggerSound(FLIP_SOUND);

    if (matchWinner) return;
    if (!isActive) setIsActive(true);
    if (!flipped.includes(index) && !solved.includes(index) && flipped.length < 2) {
      setFlipped(prev => [...prev, index]);
    }
  };

  const restartMatch = () => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause();
      backgroundMusicRef.current.currentTime = 0;
    }
    setCards(getInitialDeck().sort(() => Math.random() - 0.5));
    setFlipped([]);
    setSolved([]);
    setTime(0);
    setIsActive(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-between h-screen w-screen overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <Image
          src="/angry_birds_bg.png"
          fill
          alt="Angry Birds Island"
          className="object-cover transition-opacity duration-1000"
          priority
        />
        <div className="absolute inset-0 bg-black/20" /> {/* Subtle darkening overlay */}
      </div>

      {matchWinner && (
        <Confetti width={windowSize.width} height={windowSize.height} recycle={true} numberOfPieces={300} />
      )}

      {/* Header */}
      <header className="text-center z-10 mt-4 px-6 py-3 bg-yellow-400/90 border-4 border-amber-900 rounded-2xl shadow-2xl rotate-1">
        <h1 className="text-amber-900 text-3xl sm:text-5xl font-black tracking-tighter uppercase [text-shadow:2px_2px_0_#fff]">
          MIND <span className="text-red-600">ISLAND</span>
        </h1>
      </header>

      {/* Main Board */}
      <div className="grow flex flex-col items-center justify-center w-full max-w-2xl z-20 px-4 py-4">
        <div className="bg-amber-100/30 backdrop-blur-sm p-4 sm:p-6 rounded-[2.5rem] w-full flex flex-col items-center shadow-2xl border-4 border-amber-900/40 relative">

          <div className="flex justify-between items-center w-full mb-6 px-4">
            <div className="bg-red-600 text-white px-4 py-1 rounded-xl border-2 border-amber-900 font-black shadow-lg">
              <span className="text-[10px] block uppercase leading-tight">Time</span>
              <span className="text-xl font-mono leading-none">{formatTime(time)}</span>
            </div>
            {bestTime !== null && (
              <div className="bg-yellow-400 text-amber-900 px-4 py-1 rounded-xl border-2 border-amber-900 font-black shadow-lg">
                <span className="text-[10px] block uppercase leading-tight">Record</span>
                <span className="text-xl font-mono leading-none">{formatTime(bestTime)}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-5 perspective">
            {cards.map((card, index) => {
              const isSolved = solved.includes(index);
              const isFlipped = flipped.includes(index) || isSolved;

              return (
                <div
                  key={index}
                  className={`w-[4.2rem] h-[4.2rem] xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 relative preserve-3d transition-all duration-500 cursor-pointer ${isFlipped ? "rotate-y-180" : ""
                    } ${isSolved ? "scale-90" : "hover:scale-105 active:scale-95"}`}
                  onClick={() => checkCard(index)}
                >
                  {/* BACK OF THE CARD: Wooden Crate Style */}
                  <div className="absolute inset-0 w-full h-full bg-amber-800 border-4 border-amber-950 rounded-2xl flex justify-center items-center font-black text-4xl text-amber-950/40 backface-hidden overflow-hidden shadow-inner bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]">
                    {!isSolved && "?"}
                  </div>

                  {/* FRONT OF THE CARD */}
                  <div className="absolute inset-0 w-full h-full rotate-y-180 backface-hidden">
                    <div className="relative w-full h-full">
                      <Image
                        src={`/memory-card/${card}.jpg`}
                        fill
                        alt="card"
                        className={`rounded-2xl object-cover border-2 transition-all duration-300 ${isSolved ? 'border-green-500' : 'border-amber-400'}`}
                        sizes="(max-width: 768px) 80px, 128px"
                        priority={true}
                      />

                      {/* PERMANENT MATCHED LABEL - DEFINITIVELY SHOWN */}
                      {isSolved && (
                        <div className="absolute inset-0 bg-white/40 flex items-center justify-center p-1 rounded-2xl">
                          <div className="bg-red-600 text-white font-black text-[10px] sm:text-xs md:text-sm py-1 px-2 md:px-3 rounded-lg border-2 border-white shadow-xl rotate-12 uppercase">
                            MATCHED!
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="z-10 shrink-0 w-full text-center pb-15 flex flex-col items-center">
        {matchWinner ? (
          <div className="lg:absolute top-35 right-1 bg-yellow-400 border-4 border-amber-900 px-3 py-4 rounded-3xl shadow-2xl mb-2 animate-bounce">
            <h2 className="text-amber-900 text-2xl sm:text-4xl font-black uppercase tracking-tighter">
              ISLAND CONQUERED! 🏆
            </h2>
            <p className="text-amber-900/60 font-bold">You did it in {formatTime(time)}</p>
          </div>
        ) : (
          <div className="h-20 mb-4" />
        )}

        <button
          onClick={restartMatch}
          className="group lg:absolute px-12 py-4 lg:top-10 lg:right-23 font-black text-lg tracking-widest uppercase text-white transition-all duration-300 cursor-pointer bg-red-600 border-b-8 border-red-800 rounded-3xl hover:bg-green-500 hover:border-green-700 active:border-b-0 active:translate-y-2 shadow-2xl"
        >
          {matchWinner ? "NEW ADVENTURE" : "RESTART GRID"}
        </button>
        
      </div>
    </div>
  );
}
