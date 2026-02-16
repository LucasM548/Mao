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
            className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${isLastPlayed
                    ? "bg-gold-400/10 border border-gold-400/30"
                    : "bg-slate-800/40 border border-slate-700/30"
                } ${onClick ? "cursor-pointer hover:bg-slate-700/40" : ""} ${isTarget ? "ring-2 ring-emerald-400 bg-emerald-400/10" : ""
                }`}
        >
            {/* Name & last-played indicator */}
            <div className="flex items-center gap-2">
                {isLastPlayed && (
                    <motion.div
                        className="w-2 h-2 rounded-full bg-gold-400"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                )}
                <span className={`text-sm font-semibold ${isLastPlayed ? "text-gold-400" : "text-slate-300"}`}>
                    {player.name}
                </span>
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
                    <span className="text-xs text-slate-400 ml-1">+{cardCount - 10}</span>
                )}
            </div>

            {/* Card count */}
            <span className="text-xs text-slate-400">
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
                    className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/30 transition-all cursor-pointer border border-red-500/30"
                >
                    ⚡ Forcer pioche
                </motion.button>
            )}
        </motion.div>
    );
}
