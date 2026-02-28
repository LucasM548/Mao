"use client";

import { Player } from "@/lib/gameService";
import Card from "./Card";
import { motion } from "framer-motion";

interface OpponentDisplayProps {
    playerId: string;
    player: Player;
    isLastPlayed: boolean;
    isTarget?: boolean;
    onClick?: () => void;
    onForceDraw?: () => void;
}

export default function OpponentDisplay({
    player,
    isLastPlayed,
    isTarget = false,
    onClick,
    onForceDraw,
}: OpponentDisplayProps) {
    const cardCount = player.hand.length;
    const revealedIds = player.revealedCards || [];

    return (
        <motion.div
            whileHover={onClick ? { scale: 1.05 } : {}}
            onClick={onClick}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${
                isLastPlayed
                    ? "bg-gradient-to-r from-gold-400/20 to-gold-500/10 border border-gold-400/40 shadow-lg shadow-gold-400/10"
                    : "bg-slate-800/40 border border-slate-700/30"
            } ${onClick ? "cursor-pointer hover:bg-slate-700/50 hover:shadow-lg" : ""} ${
                isTarget ? "ring-2 ring-emerald-400 bg-emerald-400/10 shadow-lg shadow-emerald-400/20" : ""
            }`}
        >
            {/* Name & last-played indicator */}
            <div className="flex items-center gap-2">
                {isLastPlayed && (
                    <motion.div
                        className="w-2.5 h-2.5 rounded-full bg-gold-400"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                )}
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-bold text-slate-200">
                        {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`text-sm font-bold ${isLastPlayed ? "text-gold-400" : "text-slate-200"}`}>
                        {player.name}
                    </span>
                </div>
            </div>

            {/* Cards — revealed ones show face-up */}
            <div className="flex items-center gap-0.5">
                {player.hand.slice(0, 10).map((card, i) => {
                    const isRevealed = revealedIds.includes(card.id);
                    return (
                        <div key={card.id} style={{ marginLeft: i === 0 ? 0 : -6 }}>
                            {isRevealed ? (
                                <Card card={card} small index={i} />
                            ) : (
                                <Card faceDown small index={i} />
                            )}
                        </div>
                    );
                })}
                {cardCount > 10 && (
                    <span className="text-xs text-slate-400 ml-2 font-medium">+{cardCount - 10}</span>
                )}
            </div>

            {/* Card count */}
            <span className="text-xs text-slate-500 font-medium">
                {cardCount} carte{cardCount !== 1 ? "s" : ""}
            </span>

            {/* Force draw button */}
            {onForceDraw && !onClick && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onForceDraw();
                    }}
                    className="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/30 transition-all cursor-pointer border border-red-500/30"
                >
                    ⚡ Forcer pioche
                </motion.button>
            )}
        </motion.div>
    );
}
