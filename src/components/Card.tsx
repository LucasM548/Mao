"use client";

import { Card as CardType, SUIT_SYMBOLS, SUIT_COLORS } from "@/lib/cards";
import { motion } from "framer-motion";

interface CardProps {
    card?: CardType;
    faceDown?: boolean;
    onClick?: () => void;
    onRightClick?: () => void;
    selected?: boolean;
    revealed?: boolean; // shown to others (owner's view: indicator overlay)
    small?: boolean;
    index?: number;
    layoutId?: string;
}

export default function Card({
    card,
    faceDown = false,
    onClick,
    onRightClick,
    selected = false,
    revealed = false,
    small = false,
    index = 0,
    layoutId,
}: CardProps) {
    const w = small ? "w-[2.75rem]" : "w-[4.5rem]";
    const h = small ? "h-[3.75rem]" : "h-[6.25rem]";

    if (faceDown || !card) {
        return (
            <motion.div
                layoutId={layoutId}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={onClick}
                className={`${w} ${h} rounded-xl card-back-pattern flex-shrink-0 border border-slate-500/30`}
                style={{
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)",
                    cursor: onClick ? "pointer" : "default",
                }}
            />
        );
    }

    const symbol = SUIT_SYMBOLS[card.suit];
    const isRed = card.suit === "hearts" || card.suit === "diamonds";
    const cardColor = isRed ? "#dc2626" : "#000000";

    return (
        <motion.div
            layoutId={layoutId || card.id}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{
                scale: 1,
                opacity: 1,
                y: selected ? -16 : 0,
            }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            whileHover={onClick ? { y: -8, scale: 1.05 } : {}}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: index * 0.03 }}
            onClick={onClick}
            onContextMenu={onRightClick ? (e) => {
                e.preventDefault();
                onRightClick();
            } : undefined}
            className={`${w} ${h} rounded-xl bg-white flex-shrink-0 flex flex-col justify-between select-none relative overflow-hidden ${onClick ? "cursor-pointer" : ""
                } ${selected ? "ring-2 ring-gold-400" : ""}`}
            style={{
                color: cardColor,
                border: revealed
                    ? "2px solid #3b82f6"
                    : selected
                        ? "2px solid #d4a34a"
                        : "1px solid #d1d5db",
                boxShadow: revealed
                    ? "0 0 12px rgba(59,130,246,0.5), 0 4px 12px rgba(0,0,0,0.15)"
                    : selected
                        ? "0 0 12px rgba(212,163,74,0.4), 0 4px 12px rgba(0,0,0,0.15)"
                        : "0 2px 8px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)",
            }}
        >
            {/* Top-left rank + suit */}
            <div
                className="flex flex-col items-start leading-none"
                style={{ padding: small ? "2px 3px" : "4px 6px" }}
            >
                <span
                    className="font-bold"
                    style={{ fontSize: small ? "10px" : "15px", color: cardColor }}
                >
                    {card.rank}
                </span>
                <span style={{ fontSize: small ? "9px" : "13px", color: cardColor }}>
                    {symbol}
                </span>
            </div>

            {/* Center suit (large) */}
            <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                    fontSize: small ? "20px" : "32px",
                    color: cardColor,
                    opacity: 0.9,
                }}
            >
                {symbol}
            </div>

            {/* Bottom-right rank + suit (rotated 180°) */}
            <div
                className="flex flex-col items-end leading-none rotate-180"
                style={{ padding: small ? "2px 3px" : "4px 6px" }}
            >
                <span
                    className="font-bold"
                    style={{ fontSize: small ? "10px" : "15px", color: cardColor }}
                >
                    {card.rank}
                </span>
                <span style={{ fontSize: small ? "9px" : "13px", color: cardColor }}>
                    {symbol}
                </span>
            </div>

            {/* Revealed indicator (eye icon) */}
            {revealed && (
                <div
                    className="absolute top-0 right-0 bg-blue-500 text-white rounded-bl-lg flex items-center justify-center"
                    style={{
                        width: small ? "14px" : "20px",
                        height: small ? "14px" : "20px",
                        fontSize: small ? "8px" : "11px",
                    }}
                >
                    👁
                </div>
            )}
        </motion.div>
    );
}
