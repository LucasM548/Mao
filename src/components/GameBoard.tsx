"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { GameState, getOrderedPlayers } from "@/lib/gameService";
import { sortBySuit, sortByRank, Card as CardType } from "@/lib/cards";
import * as gameService from "@/lib/gameService";
import PlayerHand from "./PlayerHand";
import OpponentDisplay from "./OpponentDisplay";
import DeckAndDiscard from "./DeckAndDiscard";
import Stopwatch from "./Stopwatch";
import ActionBar from "./ActionBar";
import { motion } from "framer-motion";

interface GameBoardProps {
    roomCode: string;
    playerId: string;
    gameState: GameState;
}

/**
 * Position opponents around the top/sides like seated at a table.
 * Current player is always at the bottom (their hand).
 * Opponents are spread across top and sides based on count.
 */
function getOpponentPositions(count: number): { top: number[]; left: number[]; right: number[] } {
    if (count === 0) return { top: [], left: [], right: [] };
    if (count === 1) return { top: [0], left: [], right: [] };
    if (count === 2) return { top: [], left: [0], right: [1] };
    if (count === 3) return { top: [1], left: [0], right: [2] };
    if (count === 4) return { top: [1, 2], left: [0], right: [3] };
    if (count === 5) return { top: [1, 2, 3], left: [0], right: [4] };
    // 6+: fill top, then sides
    const leftCount = Math.floor((count - 1) / 3);
    const rightCount = Math.floor((count - 1) / 3);
    const topCount = count - leftCount - rightCount;
    const indices = Array.from({ length: count }, (_, i) => i);
    return {
        left: indices.slice(0, leftCount),
        top: indices.slice(leftCount, leftCount + topCount),
        right: indices.slice(leftCount + topCount),
    };
}

export default function GameBoard({ roomCode, playerId, gameState }: GameBoardProps) {
    const router = useRouter();
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
    const [giveMode, setGiveMode] = useState(false);
    const [sortMode, setSortMode] = useState<"suit" | "rank">("suit");

    // Optimistic local overrides
    const [optimisticHand, setOptimisticHand] = useState<CardType[] | null>(null);
    const [optimisticDeckCount, setOptimisticDeckCount] = useState<number | null>(null);
    const optimisticTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const myPlayer = gameState.players[playerId];
    const orderedPlayers = getOrderedPlayers(gameState.players);
    const opponents = orderedPlayers.filter((p) => p.id !== playerId);

    const displayHand = optimisticHand ?? myPlayer?.hand ?? [];
    const displayDeckCount = optimisticDeckCount ?? gameState.deck.length;

    const lastPlayerName = gameState.lastPlayedBy
        ? gameState.players[gameState.lastPlayedBy]?.name || null
        : null;

    const canUndo = (gameState.actionHistory?.length || 0) > 0;

    // Opponent positions
    const positions = getOpponentPositions(opponents.length);

    // ─── Optimistic helper ──────────────────────────────

    const clearOptimistic = useCallback(() => {
        if (optimisticTimer.current) clearTimeout(optimisticTimer.current);
        setOptimisticHand(null);
        setOptimisticDeckCount(null);
    }, []);

    const applyOptimistic = useCallback((hand: CardType[], deckCount: number) => {
        setOptimisticHand(hand);
        setOptimisticDeckCount(deckCount);
        if (optimisticTimer.current) clearTimeout(optimisticTimer.current);
        optimisticTimer.current = setTimeout(clearOptimistic, 3000);
    }, [clearOptimistic]);

    // ─── Actions ────────────────────────────────────────

    const handleDrawCard = useCallback(() => {
        if (myPlayer && gameState.deck.length > 0) {
            const fakeCard = gameState.deck[0];
            if (fakeCard) {
                applyOptimistic(
                    [...myPlayer.hand, fakeCard],
                    gameState.deck.length - 1
                );
            }
        }
        gameService.drawCard(roomCode, playerId);
    }, [roomCode, playerId, myPlayer, gameState.deck, applyOptimistic]);

    const handlePlayCard = useCallback(() => {
        if (selectedCardIndex === null || !myPlayer) return;
        const newHand = [...myPlayer.hand];
        newHand.splice(selectedCardIndex, 1);
        applyOptimistic(newHand, gameState.deck.length);
        gameService.playCard(roomCode, playerId, selectedCardIndex);
        setSelectedCardIndex(null);
        setGiveMode(false);
    }, [roomCode, playerId, selectedCardIndex, myPlayer, gameState.deck.length, applyOptimistic]);

    const handleGiveCard = useCallback(
        (toId: string) => {
            if (selectedCardIndex === null || !myPlayer) return;
            const newHand = [...myPlayer.hand];
            newHand.splice(selectedCardIndex, 1);
            applyOptimistic(newHand, gameState.deck.length);
            gameService.giveCard(roomCode, playerId, toId, selectedCardIndex);
            setSelectedCardIndex(null);
            setGiveMode(false);
        },
        [roomCode, playerId, selectedCardIndex, myPlayer, gameState.deck.length, applyOptimistic]
    );

    const handleTakeFromDiscard = useCallback(() => {
        if (gameState.discard.length > 0 && myPlayer) {
            const lastCard = gameState.discard[gameState.discard.length - 1];
            applyOptimistic([...myPlayer.hand, lastCard], gameState.deck.length);
        }
        gameService.takeFromDiscard(roomCode, playerId);
    }, [roomCode, playerId, myPlayer, gameState.discard, gameState.deck.length, applyOptimistic]);

    const handleForceDrawCard = useCallback(
        (targetId: string) => {
            if (gameState.deck.length > 0) {
                setOptimisticDeckCount(gameState.deck.length - 1);
                if (optimisticTimer.current) clearTimeout(optimisticTimer.current);
                optimisticTimer.current = setTimeout(clearOptimistic, 3000);
            }
            gameService.forceDrawCard(roomCode, targetId);
        },
        [roomCode, gameState.deck.length, clearOptimistic]
    );

    const handleUndo = useCallback(() => {
        clearOptimistic();
        gameService.undoLastAction(roomCode);
    }, [roomCode, clearOptimistic]);

    const handleSortHand = useCallback(() => {
        if (!myPlayer) return;
        const newSort = sortMode === "suit" ? "rank" : "suit";
        setSortMode(newSort);
        const sorted = newSort === "suit"
            ? sortBySuit(myPlayer.hand)
            : sortByRank(myPlayer.hand);
        applyOptimistic(sorted, gameState.deck.length);
        gameService.updatePlayerHand(roomCode, playerId, sorted);
        setSelectedCardIndex(null);
    }, [roomCode, playerId, myPlayer, sortMode, gameState.deck.length, applyOptimistic]);

    const handleToggleReveal = useCallback(
        (cardId: string) => {
            gameService.toggleRevealCard(roomCode, playerId, cardId);
        },
        [roomCode, playerId]
    );

    const handleSelectCard = useCallback((index: number) => {
        setSelectedCardIndex((prev) => (prev === index ? null : index));
        setGiveMode(false);
    }, []);

    const handleLeave = useCallback(() => {
        if (!confirm("Quitter la partie ?")) return;
        gameService.leaveRoom(roomCode, playerId);
        router.push("/");
    }, [roomCode, playerId, router]);

    // ─── Render opponent ────────────────────────────────

    const renderOpponent = (idx: number) => {
        const op = opponents[idx];
        if (!op) return null;
        return (
            <OpponentDisplay
                key={op.id}
                playerId={op.id}
                player={op.player}
                isLastPlayed={gameState.lastPlayedBy === op.id}
                isTarget={giveMode}
                onClick={giveMode ? () => handleGiveCard(op.id) : undefined}
                onForceDraw={() => handleForceDrawCard(op.id)}
            />
        );
    };

    if (!myPlayer) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-slate-400">Chargement...</p>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col felt-texture overflow-hidden">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between px-4 sm:px-6 py-2 border-b border-slate-700/30"
            >
                <div className="flex items-center gap-3">
                    <h1 className="text-lg font-bold bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">
                        MAO
                    </h1>
                    <span className="text-xs text-slate-500 font-mono bg-slate-800/50 px-2 py-1 rounded hidden sm:inline">
                        {roomCode}
                    </span>
                </div>
                <Stopwatch
                    lastActionAt={gameState.lastActionAt}
                    lastPlayerName={lastPlayerName}
                />
                <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-300">{myPlayer.name}</span>
                    <span className="text-xs text-slate-500">
                        ({displayHand.length})
                    </span>
                    <button
                        onClick={handleLeave}
                        className="px-2.5 py-1.5 bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/30 transition-all cursor-pointer border border-red-500/30"
                        title="Quitter la partie"
                    >
                        🚪
                    </button>
                </div>
            </motion.div>

            {/* Table area: opponents positioned around deck/discard */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Top opponents */}
                {positions.top.length > 0 && (
                    <div className="flex-shrink-0 flex items-start justify-center gap-3 px-4 py-2">
                        {positions.top.map((idx) => renderOpponent(idx))}
                    </div>
                )}

                {/* Middle row: left opponents | deck/discard | right opponents */}
                <div className="flex-1 flex items-center justify-center gap-4 px-2 min-h-0">
                    {/* Left opponents */}
                    {positions.left.length > 0 && (
                        <div className="flex flex-col items-center gap-3 flex-shrink-0">
                            {positions.left.map((idx) => renderOpponent(idx))}
                        </div>
                    )}

                    {/* Center: deck + discard */}
                    <div className="flex items-center justify-center">
                        <DeckAndDiscard
                            deckCount={displayDeckCount}
                            discard={gameState.discard}
                            onDrawCard={handleDrawCard}
                            onTakeFromDiscard={handleTakeFromDiscard}
                        />
                    </div>

                    {/* Right opponents */}
                    {positions.right.length > 0 && (
                        <div className="flex flex-col items-center gap-3 flex-shrink-0">
                            {positions.right.map((idx) => renderOpponent(idx))}
                        </div>
                    )}
                </div>

                {giveMode && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-blue-400 text-sm py-1"
                    >
                        Clique sur un joueur pour lui donner la carte sélectionnée
                    </motion.p>
                )}
            </div>

            {/* Action bar */}
            <ActionBar
                hasSelectedCard={selectedCardIndex !== null}
                onPlayCard={handlePlayCard}
                showGiveMode={giveMode}
                onToggleGiveMode={() => setGiveMode(!giveMode)}
                onCancelSelection={() => {
                    setSelectedCardIndex(null);
                    setGiveMode(false);
                }}
                onUndo={handleUndo}
                onSortHand={handleSortHand}
                sortMode={sortMode}
                canUndo={canUndo}
            />

            {/* Player hand */}
            <div className="flex-shrink-0 border-t border-slate-700/30 bg-slate-900/40 backdrop-blur-sm">
                <PlayerHand
                    hand={displayHand}
                    selectedIndex={selectedCardIndex}
                    revealedCardIds={myPlayer.revealedCards || []}
                    onSelectCard={handleSelectCard}
                    onToggleReveal={handleToggleReveal}
                />
            </div>
        </div>
    );
}
