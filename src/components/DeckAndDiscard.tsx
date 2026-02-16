"use client";

import { Card as CardType } from "@/lib/cards";
import Card from "./Card";
import { motion, AnimatePresence } from "framer-motion";

interface DeckAndDiscardProps {
    deckCount: number;
    discard: CardType[];
    onDrawCard: () => void;
    onTakeFromDiscard: () => void;
}

export default function DeckAndDiscard({
    deckCount,
    discard,
    onDrawCard,
    onTakeFromDiscard,
}: DeckAndDiscardProps) {
    // Show last 4 cards, most recent last (on top)
    const visibleDiscard = discard.slice(-4);

    return (
        <div className="flex items-center justify-center gap-16">
            {/* Deck (draw pile) */}
            <div className="flex flex-col items-center gap-3">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onDrawCard}
                    className="relative cursor-pointer"
                >
                    {deckCount > 2 && (
                        <div
                            className="absolute top-[3px] left-[3px] w-[4.5rem] h-[6.25rem] rounded-xl card-back-pattern opacity-40"
                            style={{ border: "1px solid rgba(100,116,139,0.2)" }}
                        />
                    )}
                    {deckCount > 1 && (
                        <div
                            className="absolute top-[1.5px] left-[1.5px] w-[4.5rem] h-[6.25rem] rounded-xl card-back-pattern opacity-60"
                            style={{ border: "1px solid rgba(100,116,139,0.2)" }}
                        />
                    )}
                    {deckCount > 0 ? (
                        <Card faceDown />
                    ) : (
                        <div className="w-[4.5rem] h-[6.25rem] rounded-xl border-2 border-dashed border-slate-600 flex items-center justify-center">
                            <span className="text-slate-500 text-xs">Vide</span>
                        </div>
                    )}
                </motion.div>
                <span className="text-xs text-slate-400 font-medium">
                    Pioche ({deckCount})
                </span>
            </div>

            {/* Discard pile — stacked, most recent on top */}
            <div className="flex flex-col items-center gap-3">
                <motion.div
                    whileHover={discard.length > 0 ? { scale: 1.05 } : {}}
                    whileTap={discard.length > 0 ? { scale: 0.95 } : {}}
                    onClick={discard.length > 0 ? onTakeFromDiscard : undefined}
                    className={`relative w-[4.5rem] h-[6.25rem] ${discard.length > 0 ? "cursor-pointer" : ""
                        }`}
                    style={{
                        // Extra space below for stacked cards
                        marginBottom: visibleDiscard.length > 1 ? `${(visibleDiscard.length - 1) * 6}px` : 0,
                    }}
                >
                    <AnimatePresence mode="popLayout">
                        {visibleDiscard.length > 0 ? (
                            visibleDiscard.map((card, idx) => {
                                const reverseIdx = visibleDiscard.length - 1 - idx;
                                // Older cards shift down, most recent (last in array) is on top at y=0
                                return (
                                    <motion.div
                                        key={card.id}
                                        initial={{ scale: 0.5, opacity: 0, y: -40 }}
                                        animate={{
                                            scale: 1,
                                            opacity: reverseIdx === 0 ? 0.3 : reverseIdx === 1 ? 0.5 : reverseIdx === 2 ? 0.75 : 1,
                                            y: reverseIdx * 6,
                                            x: reverseIdx * 2,
                                            rotate: reverseIdx * -2,
                                        }}
                                        exit={{ scale: 0.5, opacity: 0, y: 40 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                        className="absolute top-0 left-0"
                                        style={{
                                            zIndex: idx, // higher idx = more recent = higher z
                                        }}
                                    >
                                        <Card card={card} />
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="w-[4.5rem] h-[6.25rem] rounded-xl border-2 border-dashed border-slate-600 flex items-center justify-center">
                                <span className="text-slate-500 text-xs">Défausse</span>
                            </div>
                        )}
                    </AnimatePresence>
                </motion.div>
                <span className="text-xs text-slate-400 font-medium">
                    Défausse ({discard.length})
                </span>
            </div>
        </div>
    );
}
