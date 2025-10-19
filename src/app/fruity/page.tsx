"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const symbols = ["🍒", "🍋", "🍉", "🍇", "⭐"];
const reelsCount = 5;
const rowsCount = 4;
const symbolHeight = 70;

const weightedSymbols = [
  "⭐",
  "🍉",
  "🍉",
  "🍇",
  "🍇",
  "🍋",
  "🍋",
  "🍋",
  "🍒",
  "🍒",
  "🍒",
  "🍒",
  "🍍",
  "🍍",
  "🍍",
  "🍍",
  "🍍",
  "🥝",
  "🥝",
  "🥝",
  "🥝",
  "🥝",
  "🥝",
];

const payoutTable = {
  "⭐": { 5: 500, 4: 100, 3: 10 },
  "🍉": { 5: 200, 4: 40, 3: 5 },
  "🍇": { 5: 150, 4: 30, 3: 3 },
  "🍋": { 5: 50, 4: 10, 3: 2 },
  "🍒": { 5: 25, 4: 5, 3: 1 },
  "🍍": { 5: 10, 4: 3, 3: 1 },
  "🥝": { 5: 10, 4: 3, 3: 1 },
};

export default function SlotMachine() {
  const spinSoundRef = useRef<HTMLAudioElement>(null);
  const [bet, setBet] = useState(500);
  const [unit, setUnit] = useState(10000);
  const [grid, setGrid] = useState(
    Array.from({ length: reelsCount }, () =>
      Array.from(
        { length: rowsCount },
        () =>
          weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)]
      )
    )
  );
  const [spinning, setSpinning] = useState(false);
  const [stoppedReels, setStoppedReels] = useState(
    Array(reelsCount).fill(false)
  );
  const [lastWinAmount, setLastWinAmount] = useState(0);
  const [winningCoordinates, setWinningCoordinates] = useState<string[]>([]);
  const [highestMatch, setHighestMatch] = useState(0);

  const winningCombinations = [
    Array.from({ length: reelsCount }, (_, i) => [i, 0]), // Top row
    Array.from({ length: reelsCount }, (_, i) => [i, 1]), // Row 2
    Array.from({ length: reelsCount }, (_, i) => [i, 2]), // Row 3
    Array.from({ length: reelsCount }, (_, i) => [i, 3]), // Bottom row
    Array.from({ length: reelsCount }, (_, i) => [i, i % rowsCount]), // Diagonal TL-BR
    Array.from({ length: reelsCount }, (_, i) => [
      i,
      (rowsCount - 1 - i + rowsCount) % rowsCount,
    ]), // Diagonal TR-BL
  ];

  const checkWin = (newGrid: string[][]) => {
    let totalPayout = 0;
    let maxMatch = 0;
    const coords = new Set<string>();

    for (const combo of winningCombinations) {
      const lineSymbols = combo.map(([r, c]) => newGrid[r][c]);
      const first = lineSymbols[0];
      let consecutive = 1;
      for (let i = 1; i < lineSymbols.length; i++) {
        if (lineSymbols[i] === first) consecutive++;
        else break;
      }
      if (consecutive >= 3) {
        const multiplier = payoutTable[first]?.[consecutive];
        if (multiplier) {
          totalPayout += bet * multiplier;
          maxMatch = Math.max(maxMatch, consecutive);
          for (let i = 0; i < consecutive; i++)
            coords.add(`${combo[i][0]},${combo[i][1]}`);
        }
      }
    }

    return {
      payout: totalPayout,
      highestMatch: maxMatch,
      winningCoords: Array.from(coords),
    };
  };

  const spin = () => {
    if (spinning || unit < bet) return;
    spinSoundRef.current!.currentTime = .5;
    spinSoundRef.current?.play().catch(() => {});

    setUnit((prev) => prev - bet);
    setLastWinAmount(0);
    setWinningCoordinates([]);
    setSpinning(true);
    setStoppedReels(Array(reelsCount).fill(false));

    let currentGrid = [...grid];

    for (let i = 0; i < reelsCount; i++) {
      setTimeout(() => {
        const newReel = Array.from(
          { length: rowsCount },
          () =>
            weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)]
        );
        currentGrid[i] = newReel;
        setGrid([...currentGrid]);
        setStoppedReels((prev) => {
          const copy = [...prev];
          copy[i] = true;
          return copy;
        });

        if (i === reelsCount - 1) {
          setTimeout(() => {
            const { payout, winningCoords, highestMatch } =
              checkWin(currentGrid);
            setLastWinAmount(payout);
            setWinningCoordinates(winningCoords);
            setHighestMatch(highestMatch);
            setUnit((prev) => prev + payout);
            setSpinning(false);
          }, 650);
        }
      }, i * 500 + 1500);
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if ((e.key === " " || e.key === "Enter") && !spinning && unit >= bet)
      spin();
  };

  useEffect(() => {
    window.addEventListener("keyup", handleKeyUp);
    return () => window.removeEventListener("keyup", handleKeyUp);
  }, [spinning, unit, bet]);

  const duplicatedArrayLength = rowsCount * 3;
  const loopScrollDistance = symbolHeight * rowsCount * 3;

  return (
    <div className="p-8 text-center">
      <audio ref={spinSoundRef} src="/music_effect/spinwheel.wav" />
      <h1 className="text-3xl font-bold mb-8">🎰 Fruity Slot Machine 🎰</h1>

      <div
        className={`inline-flex justify-center gap-4 mb-8 p-2 bg-gray-100 ${
          lastWinAmount > 0 && !spinning
            ? "border-4 border-yellow-500 shadow-[0_0_20px_rgba(252,211,77,0.8)] rounded-xl"
            : "border-4 border-gray-800 rounded-xl"
        }`}
      >
        {grid.map((reel, reelIdx) => {
          const isSpinning = spinning && !stoppedReels[reelIdx];
          return (
            <div
              key={reelIdx}
              className="overflow-hidden rounded-lg bg-white border border-gray-300"
              style={{
                width: `${symbolHeight}px`,
                height: `${rowsCount * symbolHeight}px`,
              }}
            >
              <motion.div
                animate={
                  isSpinning
                    ? { y: [-symbolHeight, loopScrollDistance] }
                    : { y: 0 }
                }
                transition={
                  isSpinning
                    ? { duration: 0.15, ease: "linear", repeat: Infinity }
                    : { duration: 0.3, ease: [0.17, 0.67, 0.83, 0.99] }
                }
                className="flex flex-col items-center"
                style={{ height: `${duplicatedArrayLength * symbolHeight}px` }}
              >
                {[...reel, ...reel, ...reel].map((symbol, rowIdx) => {
                  const coordKey = `${reelIdx},${rowIdx % rowsCount}`;
                  const isWin =
                    !spinning && winningCoordinates.includes(coordKey);
                  return (
                    <div
                      key={rowIdx}
                      className={`flex items-center justify-center text-5xl transition-all duration-200 ${
                        isWin
                          ? "bg-yellow-200 border-2 rounded-md shadow-lg scale-110"
                          : ""
                      }`}
                      style={{
                        width: `${symbolHeight}px`,
                        height: `${symbolHeight}px`,
                      }}
                    >
                      {symbol}
                    </div>
                  );
                })}
              </motion.div>
            </div>
          );
        })}
      </div>

      <div className="mb-4">
        <div className="mx-4 text-lg font-semibold">Bet: {bet}</div>
        <Button
          onClick={() => setBet((prev) => Math.max(500, prev - 500))}
          disabled={spinning}
          className="mr-4"
        >
          -
        </Button>
        <Button onClick={spin} disabled={spinning || unit < bet}>
          {spinning ? "Spinning..." : `Spin (${bet})`}
        </Button>
        <Button
          onClick={() => setBet((prev) => prev + 500)}
          disabled={spinning}
          className="ml-4"
        >
          +
        </Button>
      </div>

      {!spinning && lastWinAmount > 0 && (
        <div
          className={`mt-4 text-2xl font-bold animate-bounce ${
            highestMatch === 5 ? "text-yellow-500" : "text-green-600"
          }`}
        >
          {highestMatch === 5
            ? "MEGA JACKPOT! 🏆"
            : `🎉 Total Win: ${lastWinAmount} Units! 🎉`}
        </div>
      )}

      <div className="mt-8">
        <p className="text-lg font-semibold">Units: {unit}</p>
        <div className="flex justify-center gap-4 mt-2">
          <Button onClick={() => setUnit(unit + 10000)}>Add 10000 Units</Button>
        </div>
      </div>
    </div>
  );
}
