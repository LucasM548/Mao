"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    GameState,
    createOrJoinRoom,
    subscribeToRoom,
    startGame,
    getOrderedPlayers,
    setNumDecks,
} from "@/lib/gameService";
import GameBoard from "@/components/GameBoard";

export default function GamePage() {
    const params = useParams();
    const roomCode = (params.code as string) || "";
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [playerId, setPlayerId] = useState<string>("");
    const [joining, setJoining] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDecks, setSelectedDecks] = useState(1);

    // Join room on mount
    useEffect(() => {
        const pid = localStorage.getItem("mao_player_id");
        const pname = localStorage.getItem("mao_player_name");

        if (!pid || !pname) {
            setError("Retourne à l'accueil pour entrer ton pseudo.");
            setJoining(false);
            return;
        }

        setPlayerId(pid);

        createOrJoinRoom(roomCode, pid, pname)
            .then(() => setJoining(false))
            .catch((err) => {
                console.error(err);
                setError("Erreur de connexion à la partie.");
                setJoining(false);
            });
    }, [roomCode]);

    // Subscribe to real-time updates
    useEffect(() => {
        if (!roomCode || joining) return;

        const unsubscribe = subscribeToRoom(roomCode, (state) => {
            setGameState(state);
        });

        return () => unsubscribe();
    }, [roomCode, joining]);

    const handleStartGame = useCallback(() => {
        startGame(roomCode, selectedDecks);
    }, [roomCode, selectedDecks]);

    const handleDeckChange = useCallback(
        (num: number) => {
            setSelectedDecks(num);
            setNumDecks(roomCode, num);
        },
        [roomCode]
    );

    // ─── Loading / Error states ─────────────────
    if (joining) {
        return (
            <div className="min-h-screen flex items-center justify-center felt-texture">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="text-4xl"
                >
                    ♠
                </motion.div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center felt-texture">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <a
                        href="/"
                        className="px-6 py-2 bg-gold-400 text-slate-900 font-bold rounded-xl hover:bg-gold-300 transition-colors"
                    >
                        Retour à l&apos;accueil
                    </a>
                </div>
            </div>
        );
    }

    if (!gameState) {
        return (
            <div className="min-h-screen flex items-center justify-center felt-texture">
                <p className="text-slate-400">Partie introuvable...</p>
            </div>
        );
    }

    // ─── Waiting lobby ──────────────────────────

    if (!gameState.started) {
        const players = getOrderedPlayers(gameState.players);
        const isHost = players[0]?.id === playerId;

        return (
            <div className="min-h-screen flex items-center justify-center felt-texture p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 card-shadow max-w-md w-full"
                >
                    <h2 className="text-2xl font-bold text-center mb-1">
                        <span className="bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">
                            Salle d&apos;attente
                        </span>
                    </h2>
                    <p className="text-center text-slate-500 text-sm mb-6">
                        Code :{" "}
                        <span className="font-mono text-gold-400 bg-slate-800 px-2 py-0.5 rounded">
                            {roomCode}
                        </span>
                    </p>

                    {/* Player list */}
                    <div className="space-y-2 mb-6">
                        <AnimatePresence>
                            {players.map((p, idx) => (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl ${p.id === playerId
                                            ? "bg-gold-400/10 border border-gold-400/30"
                                            : "bg-slate-800/50 border border-slate-700/30"
                                        }`}
                                >
                                    <span className="text-lg">
                                        {["♠", "♥", "♦", "♣"][idx % 4]}
                                    </span>
                                    <span className="text-sm font-medium text-slate-200">{p.player.name}</span>
                                    {p.id === playerId && (
                                        <span className="text-xs text-gold-400 ml-auto">(toi)</span>
                                    )}
                                    {idx === 0 && (
                                        <span className="text-xs text-slate-500 ml-auto">Hôte</span>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <p className="text-center text-slate-500 text-xs mb-4">
                        {players.length} joueur{players.length > 1 ? "s" : ""} connecté{players.length > 1 ? "s" : ""}
                    </p>

                    {/* Deck selector (host only) */}
                    {isHost && (
                        <div className="mb-4">
                            <p className="text-sm text-slate-400 mb-2 text-center">Nombre de paquets (52 cartes)</p>
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4].map((n) => (
                                    <motion.button
                                        key={n}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleDeckChange(n)}
                                        className={`w-10 h-10 rounded-lg font-bold text-sm transition-all cursor-pointer ${selectedDecks === n
                                                ? "bg-gradient-to-r from-gold-400 to-gold-500 text-slate-900"
                                                : "bg-slate-700/60 text-slate-300 hover:bg-slate-600"
                                            }`}
                                    >
                                        {n}
                                    </motion.button>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 text-center mt-1">
                                {selectedDecks * 52} cartes au total
                            </p>
                        </div>
                    )}

                    {isHost ? (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleStartGame}
                            disabled={players.length < 2}
                            className="btn-shine w-full py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-slate-900 font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:from-gold-400 hover:to-gold-500 transition-all cursor-pointer"
                        >
                            {players.length < 2 ? "En attente de joueurs..." : "🃏 Lancer la partie"}
                        </motion.button>
                    ) : (
                        <p className="text-center text-slate-400 text-sm">
                            En attente de l&apos;hôte pour lancer la partie...
                        </p>
                    )}
                </motion.div>
            </div>
        );
    }

    // ─── Game Board ─────────────────────────────

    return (
        <GameBoard
            roomCode={roomCode}
            playerId={playerId}
            gameState={gameState}
        />
    );
}
