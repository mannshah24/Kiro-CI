"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { JsonRpcProvider } from "ethers";
import { ExternalLink } from "lucide-react";

export default function NetworkStatus() {
  const RPC =
    process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://sepolia.base.org";
  const [block, setBlock] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);

  const EAS_ADDR = process.env.NEXT_PUBLIC_EAS_REGISTRY || "";
  const easLink = EAS_ADDR
    ? EAS_ADDR.startsWith("http")
      ? EAS_ADDR
      : `https://base-sepolia.easscan.org/address/${EAS_ADDR}`
    : "https://base-sepolia.easscan.org";

  useEffect(() => {
    let mounted = true;
    const provider = new JsonRpcProvider(RPC);

    const fetchBlock = async () => {
      try {
        const bn = await provider.getBlockNumber();
        if (!mounted) return;
        setBlock(bn);
        setConnected(true);
      } catch (err) {
        if (!mounted) return;
        setConnected(false);
      }
    };

    // initial fetch
    fetchBlock();

    // poll every 4 seconds
    const id = setInterval(fetchBlock, 4000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="flex justify-end pr-6 pt-6">
      <div className="bg-zinc-900/70 border border-green-500/20 px-4 py-2 rounded-lg backdrop-blur flex items-start gap-3 w-72">
        <div className="flex flex-col">
          <motion.span
            className={`w-3 h-3 rounded-full ${
              connected ? "bg-green-400" : "bg-red-500"
            }`}
            animate={
              connected
                ? { opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }
                : { opacity: [1, 0.6, 1] }
            }
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-green-400">
              BASE SEPOLIA: {connected ? "CONNECTED" : "DISCONNECTED"}
            </div>
            <button
              onClick={() => window.open(easLink, "_blank")}
              title="Open EAS Registry"
              className="text-green-300 hover:text-white p-1 rounded"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-gray-500 mt-1">Oracle: EAS Registry</div>

          <div className="mt-2 text-xs text-green-300 font-mono">
            {connected ? (
              <span>● LIVE | Block: #{block?.toLocaleString()}</span>
            ) : (
              <span className="text-red-400">● OFFLINE</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
