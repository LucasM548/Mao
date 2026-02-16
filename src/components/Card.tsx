"use client";

import { Card as CardType, getCardImageUrl, CARD_BACK_URL } from "@/lib/cards";
import { motion } from "framer-motion";
import Image from "next/image";

interface CardProps {
    card?: CardType;
    faceDown?: boolean;
    onClick?: () => void;
    onRightClick?: () => void;
    selected?: boolean;
    revealed?: boolean;
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
    const width = small ? 50 : 90;
    const height = small ? 70 : 126;
    const w = small ? "w-[50px]" : "w-[90px]";
    const h = small ? "h-[70px]" : "h-[126px]";

    if (faceDown || !card) {
        return (
            <motion.div
                layoutId={layoutId}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={onClick}
                className={`${w} ${h} rounded-lg flex-shrink-0 overflow-hidden`}
                style={{
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)",
                    cursor: onClick ? "pointer" : "default",
                }}
            >
                <Image
                    src={CARD_BACK_URL}
                    alt="Card back"
                    width={width}
                    height={height}
                    className="w-full h-full object-cover"
                    draggable={false}
                    unoptimized
                />
            </motion.div>
        );
    }

    const imageUrl = getCardImageUrl(card);

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
            className={`${w} ${h} rounded-lg flex-shrink-0 select-none relative overflow-hidden ${onClick ? "cursor-pointer" : ""
                }`}
            style={{
                border: revealed
                    ? "2px solid #3b82f6"
                    : selected
                        ? "2px solid #d4a34a"
                        : "1px solid rgba(0,0,0,0.1)",
                boxShadow: revealed
                    ? "0 0 12px rgba(59,130,246,0.5), 0 4px 12px rgba(0,0,0,0.15)"
                    : selected
                        ? "0 0 12px rgba(212,163,74,0.4), 0 4px 12px rgba(0,0,0,0.15)"
                        : "0 2px 8px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)",
            }}
        >
            <Image
                src={imageUrl}
                alt={`${card.rank} of ${card.suit}`}
                width={width}
                height={height}
                className="w-full h-full object-cover"
                draggable={false}
                unoptimized
            />

            {/* Revealed indicator */}
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
