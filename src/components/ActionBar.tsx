"use client";

import { motion } from "framer-motion";

interface ActionBarProps {
    hasSelectedCard: boolean;
    onPlayCard: () => void;
    showGiveMode: boolean;
    onToggleGiveMode: () => void;
    onCancelSelection: () => void;
    onUndo: () => void;
    onSortHand: () => void;
    sortMode: "suit" | "rank";
    canUndo: boolean;
}

export default function ActionBar({
    hasSelectedCard,
    onPlayCard,
    showGiveMode,
    onToggleGiveMode,
    onCancelSelection,
    onUndo,
    onSortHand,
    sortMode,
    canUndo,
}: ActionBarProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 py-3 px-4 flex-wrap"
        >
            {hasSelectedCard ? (
                <>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onPlayCard}
                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl text-sm hover:from-emerald-400 hover:to-emerald-500 transition-all cursor-pointer"
                        style={{ boxShadow: "0 2px 8px rgba(16,185,129,0.3)" }}
                    >
                        🃏 Jouer
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onToggleGiveMode}
                        className={`px-5 py-2.5 font-semibold rounded-xl text-sm transition-all cursor-pointer ${showGiveMode
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                            }`}
                    >
                        🎁 Donner
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onCancelSelection}
                        className="px-4 py-2.5 bg-slate-700/50 text-slate-400 font-medium rounded-xl text-sm hover:bg-slate-600/50 transition-all cursor-pointer"
                    >
                        ✕
                    </motion.button>
                </>
            ) : (
                <>
                    {/* Sort hand */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onSortHand}
                        className="px-4 py-2.5 bg-gradient-to-r from-purple-500/80 to-purple-600/80 text-white font-semibold rounded-xl text-sm hover:from-purple-400/80 hover:to-purple-500/80 transition-all cursor-pointer"
                    >
                        {sortMode === "suit" ? "♠ Par Couleur" : "🔢 Par Valeur"}
                    </motion.button>

                    {/* Undo */}
                    <motion.button
                        whileHover={canUndo ? { scale: 1.05 } : {}}
                        whileTap={canUndo ? { scale: 0.95 } : {}}
                        onClick={onUndo}
                        disabled={!canUndo}
                        className="px-4 py-2.5 bg-gradient-to-r from-amber-500/80 to-amber-600/80 text-white font-semibold rounded-xl text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:from-amber-400/80 hover:to-amber-500/80 transition-all cursor-pointer"
                    >
                        ↩ Annuler
                    </motion.button>
                </>
            )}
        </motion.div>
    );
}
