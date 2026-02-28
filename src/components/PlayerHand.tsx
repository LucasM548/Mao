"use client";

import { Card as CardType } from "@/lib/cards";
import Card from "./Card";
import { AnimatePresence } from "framer-motion";

interface PlayerHandProps {
    hand: CardType[];
    selectedIndex: number | null;
    revealedCardIds: string[];
    onSelectCard: (index: number) => void;
    onToggleReveal: (cardId: string) => void;
}

export default function PlayerHand({
    hand,
    selectedIndex,
    revealedCardIds,
    onSelectCard,
    onToggleReveal,
}: PlayerHandProps) {
    // Calculate dynamic overlap based on card count
    const maxVisibleWidth = typeof window !== "undefined" ? window.innerWidth - 40 : 800;
    const cardWidth = 90; // matches Card component width
    const minOverlap = -30;
    const neededWidth = hand.length * cardWidth + (hand.length - 1) * minOverlap;
    const overlap = neededWidth > maxVisibleWidth
        ? -Math.min(cardWidth - 16, (hand.length * cardWidth - maxVisibleWidth) / (hand.length - 1 || 1))
        : minOverlap;

    return (
        <div className="py-5 px-4 overflow-x-auto">
            <div className="flex items-end justify-center" style={{ minHeight: "7rem" }}>
                <AnimatePresence>
                    {hand.map((card, idx) => (
                        <div
                            key={card.id}
                            style={{
                                marginLeft: idx === 0 ? 0 : `${overlap}px`,
                                zIndex: selectedIndex === idx ? 100 : idx,
                                position: "relative",
                            }}
                        >
                            <Card
                                card={card}
                                selected={selectedIndex === idx}
                                revealed={revealedCardIds.includes(card.id)}
                                onClick={() => onSelectCard(idx)}
                                onRightClick={() => onToggleReveal(card.id)}
                                index={idx}
                            />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
            {hand.length > 0 && (
                <p className="text-center text-slate-500 text-[10px] mt-2">
                    Clic droit sur une carte pour la montrer / cacher
                </p>
            )}
        </div>
    );
}
