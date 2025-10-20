"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const symbols = ["🍒", "🍋", "🍉", "🍇", "⭐"];
const reelsCount = 5;
const rowsCount = 3;
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
  const [autoSpin, setautoSpin] = useState<boolean>(false);
  const [fastSpin, setFastSpin] = useState(false);

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
    Array.from({ length: reelsCount }, (_, i) => [i, 0]), // Top
    Array.from({ length: reelsCount }, (_, i) => [i, 1]), // Middle
    Array.from({ length: reelsCount }, (_, i) => [i, 2]), // Bottom
    [
      [0, 0],
      [1, 1],
      [2, 2],
    ],
    [
      [0, 2],
      [1, 1],
      [2, 0],
    ],
    [
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 1],
      [4, 0],
    ],
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

    spinSoundRef.current!.currentTime = 0.5;
    spinSoundRef.current?.play().catch(() => {});

    setUnit((prev) => prev - bet);
    setLastWinAmount(0);
    setWinningCoordinates([]);
    setSpinning(true);
    setStoppedReels(Array(reelsCount).fill(false));

    let currentGrid = [...grid];

    if (fastSpin) {
      // 💨 Fast spin: instantly generate results
      for (let i = 0; i < reelsCount; i++) {
        const newReel = Array.from(
          { length: rowsCount },
          () =>
            weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)]
        );
        currentGrid[i] = newReel;
      }

      setGrid([...currentGrid]);

      const { payout, winningCoords, highestMatch } = checkWin(currentGrid);
      setLastWinAmount(payout);
      setWinningCoordinates(winningCoords);
      setHighestMatch(highestMatch);
      setUnit((prev) => prev + payout);
      setSpinning(false);
    } else {
      // 🎞 Normal spin: keep your beautiful animation
      for (let i = 0; i < reelsCount; i++) {
        setTimeout(() => {
          const newReel = Array.from(
            { length: rowsCount },
            () =>
              weightedSymbols[
                Math.floor(Math.random() * weightedSymbols.length)
              ]
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
    }
  };

  useEffect(() => {
    let interval;
    if (autoSpin) {
      interval = setInterval(
        () => {
          spin();
        },
        fastSpin ? 800 : 2000
      ); // faster interval when fast spin is on
    }
    return () => clearInterval(interval);
  }, [autoSpin, spin, fastSpin]);

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
    <div
      className="flex items-center justify-center min-h-screen"
      style={{
        backgroundImage: "url('/background/fruit_background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {" "}
      <audio ref={spinSoundRef} src="/music_effect/spinwheel.wav" />
      <div className="bg-white/50 backdrop-blur-md p-8 rounded-2xl shadow-2xl text-center max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Fruity Slot
        </h1>
        <div
          className={`inline-flex justify-center gap-4 mb-8 p-2 bg-gray-100 ${
            lastWinAmount > 0 && !spinning
              ? "border-4 border-yellow-500 shadow-[0_0_20px_rgba(252,211,77,0.8)] rounded-xl"
              : "border-4 border-gray-500 rounded-xl"
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
                  style={{
                    height: `${duplicatedArrayLength * symbolHeight}px`,
                  }}
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
        <div className="h-8 flex items-center justify-center">
          {!spinning && lastWinAmount > 0 ? (
            <div
              className={`text-xl font-bold animate-bounce ${
                highestMatch === 5 ? "text-yellow-500" : "text-green-600"
              }`}
            >
              {highestMatch === 5
                ? "MEGA JACKPOT! 🏆"
                : `Total Win: ${lastWinAmount} `}
            </div>
          ) : null}
        </div>

        <div className="mb-4">
          <div className="mx-4 text-lg font-semibold">Bet: {bet}</div>
          <div className="flex items-center justify-center mt-4">
            <Button
              onClick={() => setBet((prev) => Math.max(500, prev - 500))}
              disabled={spinning}
              className="mr-4"
            >
              -
            </Button>
            <Button
              style={{ backgroundColor: "transparent" }}
              onClick={spin}
              disabled={spinning || unit < bet}
            >
              {spinning ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{
                      display: "inline-block",
                      width: "40px",
                      height: "40px",
                      backgroundImage: "url('/wheel/wheel.png')",
                      backgroundSize: "cover",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "center",
                      borderRadius: "50%",
                    }}
                  ></motion.span>
                </>
              ) : (
                <span
                  style={{
                    display: "inline-block",
                    width: "40px",
                    height: "40px",
                    backgroundImage: "url('/wheel/wheel.png')",
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    borderRadius: "50%",
                  }}
                ></span>
              )}
            </Button>

            <Button
              onClick={() => setBet((prev) => prev + 500)}
              disabled={spinning}
              className="ml-4"
            >
              +
            </Button>
          </div>
        </div>
        <div className="flex justify-center gap-4 mt-4">
          <Button onClick={() => setautoSpin((prev) => !prev)}>
            {autoSpin ? "🛑 Stop Auto Spin" : "🔁 Start Auto Spin"}
          </Button>

          <Button onClick={() => setFastSpin((prev) => !prev)}>
            {fastSpin ? "🐢 Normal Spin" : "⚡ Fast Spin"}
          </Button>
        </div>
        <div className="mt-8">
          <p className="text-lg font-semibold">Units: {unit}</p>
          <div className="flex justify-center gap-4 mt-2">
            <Button onClick={() => setUnit(unit + 10000)}>
              Add 10000 Units
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
