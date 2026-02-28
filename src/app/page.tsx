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
    <div className="min-h-screen flex items-center justify-center felt-texture p-4 relative overflow-hidden">
      {/* Animated background cards */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-24 h-36 rounded-xl card-back-pattern opacity-10"
            initial={{ rotate: 0, y: 0, x: 0 }}
            animate={{
              rotate: [0, 8, -8, 0],
              y: [0, -15, 15, 0],
              x: [0, 5, -5, 0],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
            style={{
              top: `${10 + i * 12}%`,
              left: `${3 + i * 13}%`,
              transform: `rotate(${-35 + i * 10}deg)`,
            }}
          />
        ))}
      </div>

      {/* Ambient light effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo / Title */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative inline-block mb-4"
          >
            <div className="absolute inset-0 bg-gold-400/20 blur-2xl rounded-full" />
            <h1 className="relative text-7xl font-black tracking-wider text-shimmer">
              MAO
            </h1>
          </motion.div>
          <motion.p
            className="text-slate-400 text-sm tracking-[0.3em] uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Sandbox Multijoueur
          </motion.p>
          <motion.div
            className="flex justify-center gap-4 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[
              { suit: "♥", color: "text-red-500" },
              { suit: "♠", color: "text-slate-200" },
              { suit: "♦", color: "text-red-500" },
              { suit: "♣", color: "text-slate-200" },
            ].map((item, i) => (
              <motion.div
                key={item.suit}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className={`text-3xl ${item.color}`}
              >
                {item.suit}
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-8"
        >
          <div className="space-y-6">
            {/* Player Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Ton pseudo
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Ex: Lucas"
                maxLength={20}
                className="w-full px-5 py-4 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-gold-400/60 focus:ring-2 focus:ring-gold-400/20 transition-all text-lg"
              />
            </div>

            {/* Room Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Code de partie
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Ex: MAO123"
                maxLength={10}
                className="w-full px-5 py-4 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-gold-400/60 focus:ring-2 focus:ring-gold-400/20 transition-all font-mono tracking-widest text-center text-xl"
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
            </div>

            {/* Join Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleJoin}
              disabled={!playerName.trim() || !roomCode.trim() || isJoining}
              className="btn-shine w-full py-4 bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 text-slate-900 font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-gold-400/30 cursor-pointer text-lg"
            >
              {isJoining ? (
                <span className="flex items-center justify-center gap-3">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="text-xl"
                  >
                    ♠
                  </motion.span>
                  <span>Connexion...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>🎴</span>
                  <span>Rejoindre la table</span>
                </span>
              )}
            </motion.button>
          </div>

          <p className="text-center text-slate-500 text-xs mt-6">
            Entre le même code qu&apos;un ami pour rejoindre sa table.
          </p>
        </motion.div>

        {/* Decorative footer */}
        <motion.p
          className="text-center text-slate-600 text-xs mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Un jeu de cartes déjanté
        </motion.p>
      </motion.div>
    </div>
  );
}
