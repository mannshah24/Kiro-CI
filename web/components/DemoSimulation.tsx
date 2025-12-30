"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Terminal as TerminalIcon,
  AlertCircle,
  CheckCircle,
  Shield,
  X,
} from "lucide-react";

type SimulationState = "idle" | "detecting" | "fixing" | "verified";

interface CodeLine {
  text: string;
  highlight?: "red" | "yellow" | "green" | "none";
}

const vulnerableCode: CodeLine[] = [
  { text: "pragma solidity ^0.8.0;", highlight: "none" },
  { text: "", highlight: "none" },
  { text: "contract Vulnerable {", highlight: "none" },
  { text: "  mapping(address => uint) public balances;", highlight: "none" },
  { text: "", highlight: "none" },
  { text: "  function withdraw() public {", highlight: "none" },
  {
    text: '    (bool s,) = msg.sender.call{value: balances[msg.sender]}("");',
    highlight: "red",
  },
  { text: "    balances[msg.sender] = 0;", highlight: "red" },
  { text: "  }", highlight: "none" },
  { text: "}", highlight: "none" },
];

const fixedCode: CodeLine[] = [
  { text: "pragma solidity ^0.8.0;", highlight: "none" },
  { text: "", highlight: "none" },
  { text: "contract Vulnerable {", highlight: "none" },
  { text: "  mapping(address => uint) public balances;", highlight: "none" },
  { text: "", highlight: "none" },
  { text: "  function withdraw() public nonReentrant {", highlight: "yellow" },
  { text: "    balances[msg.sender] = 0;", highlight: "yellow" },
  {
    text: '    (bool s,) = msg.sender.call{value: balances[msg.sender]}("");',
    highlight: "yellow",
  },
  { text: "  }", highlight: "none" },
  { text: "}", highlight: "none" },
];

export default function DemoSimulation() {
  const [state, setState] = useState<SimulationState>("idle");
  const [displayedCode, setDisplayedCode] =
    useState<CodeLine[]>(vulnerableCode);
  const [terminalLines, setTerminalLines] = useState<string[]>([
    "$ Idle. Waiting for command...",
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [typingLineIndex, setTypingLineIndex] = useState(-1);
  const [typingCharIndex, setTypingCharIndex] = useState(0);
  const [badgeVisible, setBadgeVisible] = useState(false);

  // Run simulation
  const startSimulation = () => {
    setIsRunning(true);
    setState("idle");
    setDisplayedCode(vulnerableCode);
    setTerminalLines(["$ Idle. Waiting for command..."]);
    setTypingLineIndex(-1);
    setTypingCharIndex(0);
    setBadgeVisible(false);
    // State 1 -> 2: Detection (after 500ms)
    setTimeout(() => {
      setState("detecting");
      setTerminalLines([
        "$ npx kiro-ci scan",
        "> Scanning contract...",
        "> 🚨 CRITICAL ERROR: REENTRANCY DETECTED",
        "> Location: withdraw() function, line 7-8",
      ]);
    }, 500);

    // State 2 -> 3: Fixing (after 3s)
    setTimeout(() => {
      setState("fixing");
      setTerminalLines((prev) => [
        ...prev,
        "",
        "> 🤖 Kiro Agent initializing...",
        "> Analyzing vulnerability pattern...",
        "> Applying security patch...",
      ]);

      // Start typing animation for code fix
      setTypingLineIndex(5); // Start from line 6 (function withdraw)
    }, 3500);

    // State 3 -> 4: Verified (after 6s)
    setTimeout(() => {
      setState("verified");
      setTerminalLines((prev) => [
        ...prev,
        "",
        "> ✅ Code patched successfully",
        "> Running tests... ALL PASSED",
        "> ⛓️  Minting EAS Attestation on Base...",
        "> 🎉 VERIFICATION COMPLETE",
      ]);

      setTimeout(() => {
        setIsRunning(false);
      }, 3000);
      // show badge when verified
      setBadgeVisible(true);
    }, 7500);
  };

  // Typing animation effect for code fix
  useEffect(() => {
    // Close badge on Escape
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBadgeVisible(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    // Ensure badge hidden when leaving verified state
    if (state !== "verified") setBadgeVisible(false);
    if (
      state === "fixing" &&
      typingLineIndex >= 0 &&
      typingLineIndex < fixedCode.length
    ) {
      const targetLine = fixedCode[typingLineIndex];

      if (typingCharIndex < targetLine.text.length) {
        const timer = setTimeout(() => {
          setDisplayedCode((prev) => {
            const newCode = [...prev];
            newCode[typingLineIndex] = {
              text: targetLine.text.substring(0, typingCharIndex + 1),
              highlight: targetLine.highlight,
            };
            return newCode;
          });
          setTypingCharIndex(typingCharIndex + 1);
        }, 30); // Typing speed

        return () => clearTimeout(timer);
      } else if (typingLineIndex < 7) {
        // Stop at line 8 (index 7)
        // Move to next line
        setTimeout(() => {
          setTypingLineIndex(typingLineIndex + 1);
          setTypingCharIndex(0);
        }, 200);
      } else {
        // Typing complete, show full fixed code
        setDisplayedCode(fixedCode);
      }
    }
  }, [state, typingLineIndex, typingCharIndex]);

  const getHighlightClass = (highlight?: string) => {
    switch (highlight) {
      case "red":
        return "bg-red-500/20 border-l-2 border-red-500 text-red-300";
      case "yellow":
        return "bg-yellow-500/20 border-l-2 border-yellow-500 text-yellow-300";
      case "green":
        return "bg-green-500/20 border-l-2 border-green-500 text-green-300";
      default:
        return "";
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-zinc-900 border border-green-500/30 rounded-xl overflow-hidden shadow-2xl"
      >
        {/* IDE-style Header */}
        <div className="bg-zinc-800 border-b border-green-500/20 px-4 py-2 flex items-center justify-between">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <span className="text-xs text-gray-400 font-mono">
            Kiro-CI Security Demo
          </span>
          <div className="w-16"></div>
        </div>

        {/* Split Screen Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-x divide-green-500/20">
          {/* Left Panel: Code Editor */}
          <div className="bg-black p-6 min-h-[400px]">
            <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span>Vulnerable.sol</span>
            </div>

            <div className="font-mono text-sm space-y-1">
              {displayedCode.map((line, index) => (
                <motion.div
                  key={index}
                  className={`py-1 px-3 rounded transition-all ${getHighlightClass(
                    line.highlight
                  )}`}
                  animate={
                    state === "detecting" && line.highlight === "red"
                      ? { opacity: [1, 0.5, 1] }
                      : {}
                  }
                  transition={
                    state === "detecting" && line.highlight === "red"
                      ? { repeat: Infinity, duration: 0.8 }
                      : {}
                  }
                >
                  <span className="text-gray-500 mr-4 select-none">
                    {(index + 1).toString().padStart(2, " ")}
                  </span>
                  <span
                    className={
                      line.highlight && line.highlight !== "none"
                        ? ""
                        : "text-gray-300"
                    }
                  >
                    {line.text || " "}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Panel: Terminal */}
          <div className="bg-black p-6 min-h-[400px]">
            <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
              <TerminalIcon className="w-3 h-3" />
              <span>Terminal</span>
            </div>

            <div className="font-mono text-sm space-y-2">
              <AnimatePresence mode="popLayout">
                {terminalLines.map((line, index) => (
                  <motion.div
                    key={`${index}-${line}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`${
                      line.includes("ERROR") || line.includes("🚨")
                        ? "text-red-400"
                        : line.includes("✅") || line.includes("🎉")
                        ? "text-green-400"
                        : line.includes("🤖")
                        ? "text-blue-400"
                        : "text-gray-400"
                    }`}
                  >
                    {line}
                  </motion.div>
                ))}
              </AnimatePresence>

              {isRunning && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="text-green-400"
                >
                  ▊
                </motion.span>
              )}
            </div>
          </div>
        </div>

        {/* Control Bar */}
        <div className="bg-zinc-900 border-t border-green-500/20 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {state === "idle" && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span>Vulnerability Detected</span>
              </div>
            )}
            {state === "detecting" && (
              <div className="flex items-center gap-2 text-sm text-red-400">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <AlertCircle className="w-4 h-4" />
                </motion.div>
                <span>Analyzing Code...</span>
              </div>
            )}
            {state === "fixing" && (
              <div className="flex items-center gap-2 text-sm text-yellow-400">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <Shield className="w-4 h-4" />
                </motion.div>
                <span>Applying Security Patch...</span>
              </div>
            )}
            {state === "verified" && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span>Verified & Attested On-Chain</span>
              </div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startSimulation}
            disabled={isRunning}
            className={`flex items-center gap-3 px-6 py-3 rounded-lg font-bold transition-all ${
              isRunning
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-green-500 text-black hover:bg-green-400 hover:shadow-[0_0_20px_rgba(0,255,65,0.6)]"
            }`}
          >
            <Play className="w-5 h-5" />
            {isRunning ? "Running..." : "RUN SECURITY SCAN"}
          </motion.button>
        </div>

        {/* Verification Badge Overlay (dismissible) */}
        <AnimatePresence>
          {state === "verified" && badgeVisible && (
            <motion.div
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, rotate: 180, opacity: 0 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-auto"
            >
              <div className="relative">
                <div className="bg-green-500 text-black px-12 py-6 rounded-2xl border-4 border-green-400 shadow-[0_0_60px_rgba(0,255,65,0.8)] transform rotate-12">
                  <div className="flex flex-col items-center gap-2">
                    <Shield className="w-16 h-16" />
                    <span className="text-3xl font-bold">VERIFIED SAFE</span>
                    <span className="text-sm opacity-80">
                      On-Chain Attestation
                    </span>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setBadgeVisible(false)}
                  aria-label="Close badge"
                  className="absolute -top-6 -right-6 bg-black/60 hover:bg-black/80 text-green-300 p-2 rounded-full border border-green-500/40 shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center text-sm text-gray-500"
      >
        <p>
          👆 Click "RUN SECURITY SCAN" to see how Kiro-CI automatically detects
          and fixes vulnerabilities
        </p>
      </motion.div>
    </div>
  );
}
