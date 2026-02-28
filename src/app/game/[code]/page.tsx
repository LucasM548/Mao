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
            <div className="min-h-screen flex items-center justify-center felt-texture p-4 relative overflow-hidden">
                {/* Background elements */}
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-3xl" />
                    {/* Table outline */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-[50%] border-4 border-amber-900/20" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-2xl p-8 max-w-md w-full relative"
                >
                    {/* Table header */}
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold mb-2">
                            <span className="text-shimmer text-3xl">Salle d&apos;attente</span>
                        </h2>
                        <div className="inline-flex items-center gap-2 bg-slate-800/60 px-4 py-2 rounded-full border border-slate-700/50">
                            <span className="text-slate-400 text-sm">Code:</span>
                            <span className="font-mono text-gold-400 text-lg font-bold">{roomCode}</span>
                            <button 
                                onClick={() => navigator.clipboard.writeText(roomCode)}
                                className="text-slate-500 hover:text-gold-400 transition-colors cursor-pointer"
                                title="Copier le code"
                            >
                                📋
                            </button>
                        </div>
                    </div>

                    {/* Player list with avatars */}
                    <div className="space-y-3 mb-6">
                        <AnimatePresence>
                            {players.map((p, idx) => (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    transition={{ delay: idx * 0.1, type: "spring" }}
                                    className={`flex items-center gap-4 px-5 py-4 rounded-xl transition-all ${
                                        p.id === playerId
                                            ? "bg-gradient-to-r from-gold-400/20 to-gold-500/10 border border-gold-400/40"
                                            : "bg-slate-800/40 border border-slate-700/30"
                                    }`}
                                >
                                    {/* Avatar */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                                        p.id === playerId
                                            ? "bg-gradient-to-br from-gold-400 to-gold-600 text-slate-900"
                                            : "bg-slate-700 text-slate-300"
                                    }`}>
                                        {p.player.name.charAt(0).toUpperCase()}
                                    </div>
                                    
                                    {/* Name & role */}
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-slate-200">{p.player.name}</span>
                                        {p.id === playerId && (
                                            <span className="text-xs text-gold-400 ml-2">(toi)</span>
                                        )}
                                    </div>
                                    
                                    {/* Role badge */}
                                    {idx === 0 && (
                                        <span className="px-2 py-1 text-xs bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">
                                            Hôte
                                        </span>
                                    )}
                                    
                                    {/* Suit icon */}
                                    <span className="text-lg">
                                        {["♠", "♥", "♦", "♣"][idx % 4]}
                                    </span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <p className="text-center text-slate-500 text-sm mb-6">
                        {players.length} joueur{players.length > 1 ? "s" : ""} à table
                    </p>

                    {/* Deck selector (host only) */}
                    {isHost && (
                        <div className="mb-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                            <p className="text-sm text-slate-400 mb-3 text-center">Nombre de paquets</p>
                            <div className="flex justify-center gap-3">
                                {[1, 2, 3, 4].map((n) => (
                                    <motion.button
                                        key={n}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleDeckChange(n)}
                                        className={`w-12 h-12 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                                            selectedDecks === n
                                                ? "bg-gradient-to-r from-gold-400 to-gold-500 text-slate-900 shadow-lg shadow-gold-400/30"
                                                : "bg-slate-700/60 text-slate-300 hover:bg-slate-600"
                                        }`}
                                    >
                                        {n}
                                    </motion.button>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 text-center mt-2">
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
                            className="btn-shine w-full py-4 bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 text-slate-900 font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-gold-400/30 transition-all cursor-pointer text-lg"
                        >
                            {players.length < 2 ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span>⏳</span>
                                    <span>En attente de joueurs...</span>
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <span>🃏</span>
                                    <span>Lancer la partie</span>
                                </span>
                            )}
                        </motion.button>
                    ) : (
                        <div className="text-center py-4">
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="text-slate-400 text-sm"
                            >
                                En attente de l&apos;hôte pour lancer la partie...
                            </motion.div>
                        </div>
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
