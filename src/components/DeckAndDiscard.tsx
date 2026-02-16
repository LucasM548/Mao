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
    // Show last 4: the top card fully visible + 3 peeking out to the left
    const visibleDiscard = discard.slice(-4);

    return (
        <div className="flex items-center justify-center gap-12">
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
                            className="absolute top-[3px] left-[3px] w-[90px] h-[126px] rounded-lg card-back-pattern opacity-40"
                            style={{ border: "1px solid rgba(100,116,139,0.2)" }}
                        />
                    )}
                    {deckCount > 1 && (
                        <div
                            className="absolute top-[1.5px] left-[1.5px] w-[90px] h-[126px] rounded-lg card-back-pattern opacity-60"
                            style={{ border: "1px solid rgba(100,116,139,0.2)" }}
                        />
                    )}
                    {deckCount > 0 ? (
                        <Card faceDown />
                    ) : (
                        <div className="w-[90px] h-[126px] rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center">
                            <span className="text-slate-500 text-xs">Vide</span>
                        </div>
                    )}
                </motion.div>
                <span className="text-xs text-slate-400 font-medium">
                    Pioche ({deckCount})
                </span>
            </div>

            {/* Discard pile — spread horizontally, most recent on top/right */}
            <div className="flex flex-col items-center gap-3">
                <motion.div
                    whileHover={discard.length > 0 ? { scale: 1.05 } : {}}
                    whileTap={discard.length > 0 ? { scale: 0.95 } : {}}
                    onClick={discard.length > 0 ? onTakeFromDiscard : undefined}
                    className={`relative ${discard.length > 0 ? "cursor-pointer" : ""}`}
                    style={{
                        // Reserve width for the spread cards
                        width: `${90 + (Math.max(visibleDiscard.length - 1, 0)) * 24}px`,
                        height: "126px",
                    }}
                >
                    <AnimatePresence mode="popLayout">
                        {visibleDiscard.length > 0 ? (
                            visibleDiscard.map((card, idx) => {
                                // Spread left to right: oldest on the left, most recent on the right
                                const offsetX = idx * 24;
                                return (
                                    <motion.div
                                        key={card.id}
                                        initial={{ scale: 0.5, opacity: 0, x: offsetX + 40 }}
                                        animate={{
                                            scale: 1,
                                            opacity: 1,
                                            x: offsetX,
                                            rotate: 0,
                                        }}
                                        exit={{ scale: 0.5, opacity: 0, y: -40 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                        className="absolute top-0 left-0"
                                        style={{ zIndex: idx }}
                                    >
                                        <Card card={card} />
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="w-[90px] h-[126px] rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center">
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
