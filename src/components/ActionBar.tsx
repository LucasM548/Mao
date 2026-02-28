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
            className="flex items-center justify-center gap-3 py-4 px-4 flex-wrap bg-slate-900/40 backdrop-blur-sm border-t border-slate-700/30"
        >
            {hasSelectedCard ? (
                <>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onPlayCard}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 text-white font-bold rounded-xl text-sm hover:shadow-lg hover:shadow-emerald-500/30 transition-all cursor-pointer flex items-center gap-2"
                        style={{ boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}
                    >
                        <span>🃏</span>
                        <span>Jouer</span>
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onToggleGiveMode}
                        className={`px-6 py-3 font-bold rounded-xl text-sm transition-all cursor-pointer flex items-center gap-2 ${
                            showGiveMode
                                ? "bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/30"
                                : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:shadow-lg"
                        }`}
                    >
                        <span>🎁</span>
                        <span>Donner</span>
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onCancelSelection}
                        className="px-4 py-3 bg-slate-700/60 text-slate-400 font-medium rounded-xl text-sm hover:bg-red-500/20 hover:text-red-400 transition-all cursor-pointer border border-slate-600/30 hover:border-red-500/30"
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
                        className="px-5 py-3 bg-gradient-to-r from-purple-500/90 to-purple-600/90 text-white font-semibold rounded-xl text-sm hover:shadow-lg hover:shadow-purple-500/30 transition-all cursor-pointer flex items-center gap-2"
                    >
                        <span>{sortMode === "suit" ? "♠" : "🔢"}</span>
                        <span>{sortMode === "suit" ? "Couleur" : "Valeur"}</span>
                    </motion.button>

                    {/* Undo */}
                    <motion.button
                        whileHover={canUndo ? { scale: 1.05 } : {}}
                        whileTap={canUndo ? { scale: 0.95 } : {}}
                        onClick={onUndo}
                        disabled={!canUndo}
                        className="px-5 py-3 bg-gradient-to-r from-amber-500/90 to-amber-600/90 text-white font-semibold rounded-xl text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-amber-500/30 transition-all cursor-pointer flex items-center gap-2"
                    >
                        <span>↩</span>
                        <span>Annuler</span>
                    </motion.button>
                </>
            )}
        </motion.div>
    );
}
