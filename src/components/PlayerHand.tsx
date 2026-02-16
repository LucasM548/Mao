"use client";

import { Card as CardType } from "@/lib/cards";
import Card from "./Card";
import { AnimatePresence } from "framer-motion";

interface PlayerHandProps {
    hand: CardType[];
    selectedIndex: number | null;
    onSelectCard: (index: number) => void;
}

export default function PlayerHand({ hand, selectedIndex, onSelectCard }: PlayerHandProps) {
    // Calculate dynamic overlap based on card count
    const maxVisibleWidth = typeof window !== "undefined" ? window.innerWidth - 40 : 800;
    const cardWidth = 72; // 4.5rem = 72px
    const minOverlap = -30;
    const neededWidth = hand.length * cardWidth + (hand.length - 1) * minOverlap;
    const overlap = neededWidth > maxVisibleWidth
        ? -Math.min(cardWidth - 16, (hand.length * cardWidth - maxVisibleWidth) / (hand.length - 1 || 1))
        : minOverlap;

    return (
        <div className="py-4 px-4 overflow-x-auto">
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
                                onClick={() => onSelectCard(idx)}
                                index={idx}
                            />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
