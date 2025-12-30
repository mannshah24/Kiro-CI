"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Terminal,
  Bot,
  Shield,
  Copy,
  Check,
  Github,
  BookOpen,
} from "lucide-react";
import DemoSimulation from "../components/DemoSimulation";

interface Attestation {
  uid: string;
  projectName: string;
  commitHash: string;
  timestamp: number;
  testsPassed: boolean;
  txHash: string;
}

export default function KiroLandingPage() {
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Poll for new attestations every 2 seconds
  useEffect(() => {
    const fetchAttestations = async () => {
      try {
        const response = await fetch("/api/attestations");
        const data = await response.json();

        if (data.attestations) {
          setAttestations(data.attestations);
          setLastUpdate(new Date());
          setIsOnline(true);
        }
      } catch (error) {
        console.error("Failed to fetch attestations:", error);
        setIsOnline(false);
      }
    };

    fetchAttestations();
    const interval = setInterval(fetchAttestations, 2000);

    return () => clearInterval(interval);
  }, []);

  const truncateHash = (hash: string) => {
    if (hash.length <= 10) return hash;
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  return (
    <div className="min-h-screen bg-black text-gray-300">
      {/* Header is rendered globally in layout */}

      {/* Animated Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <TypewriterHero />

          <p className="text-xl text-gray-400 mb-12 leading-relaxed">
            Autonomous AI agents fix security bugs in your smart contracts.
            <br />
            Every fix is cryptographically attested on Base.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a
              href="https://github.com/mannshah24/Kiro-CI/blob/main/.kiro/HERO"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary group"
            >
              <BookOpen className="w-5 h-5" />
              View Documentation
            </a>
            <a
              href="https://github.com/mannshah24/Kiro-CI"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary group"
            >
              <Github className="w-5 h-5" />
              Star on GitHub
            </a>
          </div>

          {/* Installation Terminal */}
          <InstallationTerminal />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-green-400 text-center mb-12 glow-green">
          How It Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <HowItWorksCard
            icon={<Terminal className="w-8 h-8" />}
            step="01"
            title="Install Hook"
            description="Add Kiro-CI to your git workflow. The agent activates on every commit."
          />
          <HowItWorksCard
            icon={<Bot className="w-8 h-8" />}
            step="02"
            title="Agent Fixes Bugs"
            description="AI analyzes your Solidity code, detects vulnerabilities, and patches them automatically."
          />
          <HowItWorksCard
            icon={<Shield className="w-8 h-8" />}
            step="03"
            title="Verified on Base"
            description="Every successful fix gets an EAS attestation minted on-chain as proof."
          />
        </div>
      </section>

      {/* Live Simulation Section */}
      <section className="container mx-auto px-6 py-16 bg-gradient-to-b from-black to-zinc-900">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-green-400 mb-3 glow-green">
            See It In Action
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Watch how Kiro-CI detects vulnerabilities, applies fixes, and
            creates on-chain attestations in real-time.
          </p>
        </div>

        <DemoSimulation />
      </section>

      {/* Live Feed Section */}
      <section id="live-feed" className="container mx-auto px-6 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-green-400 mb-3 glow-green">
            Global Verification Stream (Live)
          </h2>
          <p className="text-gray-500">
            Real-time attestations from developers using Kiro-CI worldwide
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-4">
          <AnimatePresence>
            {attestations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border border-zinc-700 bg-zinc-900/50 rounded-lg p-12 text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 mb-4">
                  <Terminal className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-gray-500 mb-4">
                  Waiting for attestations... Run the agent to see your first
                  verification here.
                </p>
                <code className="text-sm text-green-400 bg-black px-4 py-2 rounded border border-green-500/30 inline-block">
                  npx kiro-ci init
                </code>
              </motion.div>
            ) : (
              attestations.map((attestation, index) => (
                <AttestationCard
                  key={attestation.uid}
                  attestation={attestation}
                  index={index}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-green-500/20 bg-zinc-900/50 mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>Built with 🌑 by the Kiro Community • Powered by EAS on Base</p>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/mannshah24/Kiro-CI"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-green-400 transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://base-sepolia.easscan.org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-green-400 transition-colors"
              >
                EAS Explorer
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Typewriter Hero Component
function TypewriterHero() {
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const phrases = [
    "The First Trustless DevOps Pipeline...",
    "Powered by Kiro.",
  ];
  const typingSpeed = 100;
  const deletingSpeed = 50;
  const pauseTime = 2000;

  useEffect(() => {
    const handleTyping = () => {
      const currentPhrase = phrases[loopNum % phrases.length];

      if (isDeleting) {
        setText(currentPhrase.substring(0, text.length - 1));

        if (text.length === 0) {
          setIsDeleting(false);
          setLoopNum(loopNum + 1);
        }
      } else {
        setText(currentPhrase.substring(0, text.length + 1));

        if (text === currentPhrase) {
          setTimeout(() => setIsDeleting(true), pauseTime);
          return;
        }
      }
    };

    const timer = setTimeout(
      handleTyping,
      isDeleting ? deletingSpeed : typingSpeed
    );
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum]);

  return (
    <h1 className="text-5xl md:text-6xl font-bold text-green-400 mb-6 glow-green min-h-[120px] flex items-center justify-center">
      {text}
      <span className="animate-pulse">|</span>
    </h1>
  );
}

// Installation Terminal Component
function InstallationTerminal() {
  const [copied, setCopied] = useState(false);
  const command = "npx kiro-ci init";

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-zinc-900 border border-green-500/30 rounded-lg overflow-hidden shadow-2xl"
      >
        {/* Terminal Header */}
        <div className="bg-zinc-800 border-b border-green-500/20 px-4 py-2 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <span className="text-xs text-gray-500 ml-2 font-mono">terminal</span>
        </div>

        {/* Terminal Body */}
        <div className="p-6 font-mono">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-green-400">$</span>
              <code className="text-green-400 text-lg">{command}</code>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded text-green-400 hover:bg-green-500/20 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="text-sm">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="text-sm">Copy</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// How It Works Card
function HowItWorksCard({
  icon,
  step,
  title,
  description,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative bg-zinc-900 border border-green-500/20 rounded-lg p-8 hover:border-green-500/40 transition-all group"
    >
      <div className="absolute -top-4 left-6 bg-black px-3 py-1 border border-green-500/30 rounded text-green-400 text-xs font-bold">
        {step}
      </div>

      <div className="flex flex-col items-center text-center">
        <div className="text-green-400 mb-4 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

// Attestation Card Component
function AttestationCard({
  attestation,
  index,
}: {
  attestation: Attestation;
  index: number;
}) {
  const truncateHash = (hash: string) => {
    if (hash.length <= 10) return hash;
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="border border-green-500/20 bg-zinc-900/50 rounded-lg p-6 hover:border-green-500/40 transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h4 className="text-lg font-bold text-green-400">
              {attestation.projectName}
            </h4>
            {attestation.testsPassed && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold">
                ✅ VERIFIED
              </span>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Commit:</span>
              <code className="text-green-400 bg-black px-2 py-1 rounded border border-zinc-700">
                {truncateHash(attestation.commitHash)}
              </code>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-500">Timestamp:</span>
              <span className="text-gray-400">
                {new Date(attestation.timestamp).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-500">Attestation:</span>
              <a
                href={`https://base-sepolia.easscan.org/attestation/view/${attestation.uid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                {truncateHash(attestation.uid)}
              </a>
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500">
            {formatDistanceToNow(attestation.timestamp, { addSuffix: true })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
