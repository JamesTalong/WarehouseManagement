import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion"; // npm install framer-motion
import { Terminal, activity, Shield, Cpu } from "lucide-react";

// Configuration
const GRID_SIZE = 30;
const SPEED = 100;

const WelcomingPage = () => {
  // --- Logic State (Hidden Game) ---
  const [snake, setSnake] = useState([{ x: 15, y: 15 }]);
  const [food, setFood] = useState({ x: 20, y: 10 });
  const [isManualMode, setIsManualMode] = useState(false);
  const [dataSynced, setDataSynced] = useState(0);

  const directionRef = useRef({ x: 1, y: 0 });
  const lastTimeRef = useRef(0);
  const requestRef = useRef();

  const generateFood = useCallback((currentSnake) => {
    let newFood;
    let isOnSnake = true;
    while (isOnSnake) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      isOnSnake = currentSnake.some(
        (seg) => seg.x === newFood.x && seg.y === newFood.y,
      );
    }
    return newFood;
  }, []);

  // Controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      if (keys.includes(e.key)) {
        if (!isManualMode) setIsManualMode(true);
        e.preventDefault();
      }
      switch (e.key) {
        case "ArrowUp":
          if (directionRef.current.y === 0)
            directionRef.current = { x: 0, y: -1 };
          break;
        case "ArrowDown":
          if (directionRef.current.y === 0)
            directionRef.current = { x: 0, y: 1 };
          break;
        case "ArrowLeft":
          if (directionRef.current.x === 0)
            directionRef.current = { x: -1, y: 0 };
          break;
        case "ArrowRight":
          if (directionRef.current.x === 0)
            directionRef.current = { x: 1, y: 0 };
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isManualMode]);

  // Main System Loop
  const systemLoop = useCallback(
    (time) => {
      if (time - lastTimeRef.current > SPEED) {
        setSnake((prev) => {
          const head = { ...prev[0] };

          // Ambient movement if user is idle
          if (!isManualMode && Math.random() > 0.9) {
            const moves = [
              { x: 0, y: 1 },
              { x: 0, y: -1 },
              { x: 1, y: 0 },
              { x: -1, y: 0 },
            ];
            directionRef.current =
              moves[Math.floor(Math.random() * moves.length)];
          }

          head.x += directionRef.current.x;
          head.y += directionRef.current.y;

          // Boundary Wrap
          if (head.x >= GRID_SIZE) head.x = 0;
          if (head.x < 0) head.x = GRID_SIZE - 1;
          if (head.y >= GRID_SIZE) head.y = 0;
          if (head.y < 0) head.y = GRID_SIZE - 1;

          // Collision logic (Reset)
          if (
            isManualMode &&
            prev.some((s) => s.x === head.x && s.y === head.y)
          ) {
            setDataSynced(0);
            return [{ x: 15, y: 15 }];
          }

          const newSnake = [head, ...prev];
          if (head.x === food.x && head.y === food.y) {
            setDataSynced((s) => s + 1);
            setFood(generateFood(newSnake));
          } else {
            newSnake.pop();
          }
          return newSnake;
        });
        lastTimeRef.current = time;
      }
      requestRef.current = requestAnimationFrame(systemLoop);
    },
    [isManualMode, food, generateFood],
  );

  useEffect(() => {
    requestRef.current = requestAnimationFrame(systemLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [systemLoop]);

  return (
    <div className="relative min-h-screen w-full bg-gray-100 text-gray-900 font-sans overflow-hidden flex flex-col items-center justify-center">
      {/* Background Grid Activity (The "Game") */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div
          className="grid w-full h-full"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            maskImage:
              "radial-gradient(circle at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)",
            WebkitMaskImage:
              "radial-gradient(circle at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)",
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            const isHead = snake[0].x === x && snake[0].y === y;
            const isBody = snake.some(
              (s, idx) => idx !== 0 && s.x === x && s.y === y,
            );
            const isFood = food.x === x && food.y === y;

            return (
              <div
                key={i}
                className="border-[0.2px] border-gray-300 flex items-center justify-center"
              >
                {isHead && (
                  <motion.div
                    layoutId="head"
                    className="w-full h-full bg-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  />
                )}
                {isBody && (
                  <div className="w-[80%] h-[80%] bg-gray-300 rounded-sm" />
                )}
                {isFood && (
                  <div className="w-1.5 h-1.5 bg-emerald-500 rotate-45 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-4xl px-8 flex flex-col items-center">
        {/* Animated Icon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6"
        >
          <div className="p-3 rounded-full border border-gray-300 bg-white/80 backdrop-blur-md shadow-sm">
            <Cpu className="w-6 h-6 text-emerald-600" />
          </div>
        </motion.div>

        {/* Welcome Text with Framer Motion */}
        <motion.h1
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold tracking-tighter text-center mb-6 bg-gradient-to-b from-gray-900 to-gray-500 bg-clip-text text-transparent"
        >
          Welcome to the System
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-gray-500 text-lg md:text-xl text-center max-w-2xl font-light leading-relaxed"
        >
          Manage data, track activity, and stay organized —{" "}
          <br className="hidden md:block" />
          <span className="text-gray-800 font-medium">all in one place.</span>
        </motion.p>

        {/* Interaction Prompt */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="mt-12 flex flex-col items-center gap-4"
        >
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          <span className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">
            {isManualMode
              ? "Manual Override Active"
              : "Press Arrow Keys to Interact"}
          </span>
        </motion.div>
      </div>

      {/* Bottom Interface Elements */}
      <div className="absolute bottom-12 w-full px-12 flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest text-gray-400">
            Network Status
          </span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-gray-600 uppercase">
              Secure Connection
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] uppercase tracking-widest text-gray-400">
            Data Processed
          </span>
          <span className="text-xl font-mono text-gray-900 tracking-tighter">
            {dataSynced.toString().padStart(4, "0")}
          </span>
        </div>
      </div>

      {/* Side Decorative Lines */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-emerald-500/30 to-transparent" />
      <div className="absolute bottom-0 left-24 w-px h-32 bg-gray-300" />
      <div className="absolute bottom-0 right-24 w-px h-32 bg-gray-300" />
    </div>
  );
};

export default WelcomingPage;
