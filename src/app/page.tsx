"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

export default function LobbyPage() {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  const handleJoin = () => {
    if (!playerName.trim() || !roomCode.trim()) return;
    setIsJoining(true);

    // Store player identity in localStorage
    let playerId = localStorage.getItem("mao_player_id");
    if (!playerId) {
      playerId = uuidv4();
      localStorage.setItem("mao_player_id", playerId);
    }
    localStorage.setItem("mao_player_name", playerName.trim());

    router.push(`/game/${roomCode.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center felt-texture p-4">
      {/* Background decorative cards */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-20 h-28 rounded-lg card-back-pattern opacity-10"
            initial={{ rotate: 0, y: 0 }}
            animate={{
              rotate: [0, 5, -5, 0],
              y: [0, -10, 10, 0],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              top: `${15 + i * 15}%`,
              left: `${5 + i * 16}%`,
              transform: `rotate(${-30 + i * 12}deg)`,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <motion.h1
            className="text-6xl font-extrabold tracking-tight"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-gold-400 via-yellow-300 to-gold-600 bg-clip-text text-transparent">
              MAO
            </span>
          </motion.h1>
          <motion.p
            className="text-slate-400 mt-2 text-sm tracking-widest uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Sandbox Multijoueur
          </motion.p>
          <motion.div
            className="flex justify-center gap-3 mt-4 text-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="text-card-red">♥</span>
            <span className="text-card-white">♠</span>
            <span className="text-card-red">♦</span>
            <span className="text-card-white">♣</span>
          </motion.div>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 card-shadow"
        >
          <div className="space-y-5">
            {/* Player Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Ton pseudo
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Ex: Lucas"
                maxLength={20}
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-gold-400/60 focus:ring-1 focus:ring-gold-400/30 transition-all"
              />
            </div>

            {/* Room Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Code de partie
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Ex: MAO123"
                maxLength={10}
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-gold-400/60 focus:ring-1 focus:ring-gold-400/30 transition-all font-mono tracking-widest text-center text-lg"
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
            </div>

            {/* Join Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleJoin}
              disabled={!playerName.trim() || !roomCode.trim() || isJoining}
              className="btn-shine w-full py-3.5 bg-gradient-to-r from-gold-500 to-gold-600 text-slate-900 font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:from-gold-400 hover:to-gold-500 cursor-pointer"
            >
              {isJoining ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    ♠
                  </motion.span>
                  Connexion...
                </span>
              ) : (
                "Rejoindre la table"
              )}
            </motion.button>
          </div>

          <p className="text-center text-slate-500 text-xs mt-5">
            Entre le même code qu&apos;un ami pour rejoindre sa table.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
