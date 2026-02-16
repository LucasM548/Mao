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

    // Use optimistic hand if available, otherwise use Firestore state
    const displayHand = optimisticHand ?? myPlayer?.hand ?? [];
    const displayDeckCount = optimisticDeckCount ?? gameState.deck.length;

    // Last played info
    const lastPlayerName = gameState.lastPlayedBy
        ? gameState.players[gameState.lastPlayedBy]?.name || null
        : null;

    const canUndo = (gameState.actionHistory?.length || 0) > 0;

    // ─── Optimistic helper ──────────────────────────────

    const clearOptimistic = useCallback(() => {
        if (optimisticTimer.current) clearTimeout(optimisticTimer.current);
        setOptimisticHand(null);
        setOptimisticDeckCount(null);
    }, []);

    const applyOptimistic = useCallback((hand: CardType[], deckCount: number) => {
        setOptimisticHand(hand);
        setOptimisticDeckCount(deckCount);
        // Clear optimistic state after 3s (Firestore should have synced by then)
        if (optimisticTimer.current) clearTimeout(optimisticTimer.current);
        optimisticTimer.current = setTimeout(clearOptimistic, 3000);
    }, [clearOptimistic]);

    // ─── Actions ────────────────────────────────────────

    const handleDrawCard = useCallback(() => {
        // Optimistic: instantly show one more card placeholder
        if (myPlayer && gameState.deck.length > 0) {
            const fakeCard = gameState.deck[0]; // peek at top card
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
        // Optimistic: remove card from hand
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
            // Optimistic: remove card from hand
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
            applyOptimistic(
                [...myPlayer.hand, lastCard],
                gameState.deck.length
            );
        }
        gameService.takeFromDiscard(roomCode, playerId);
    }, [roomCode, playerId, myPlayer, gameState.discard, gameState.deck.length, applyOptimistic]);

    const handleForceDrawCard = useCallback(
        (targetId: string) => {
            // Optimistic: update deck count
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

    // Clear optimistic state when Firestore syncs
    // (React will re-render with new gameState, optimistic will expire via timer)

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
                className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-700/30"
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

            {/* Opponents area */}
            <div className="flex-shrink-0 px-4 sm:px-6 py-3">
                <div className="flex flex-wrap justify-center gap-3">
                    {opponents.map((op) => (
                        <OpponentDisplay
                            key={op.id}
                            playerId={op.id}
                            player={op.player}
                            isLastPlayed={gameState.lastPlayedBy === op.id}
                            isTarget={giveMode}
                            onClick={giveMode ? () => handleGiveCard(op.id) : undefined}
                            onForceDraw={() => handleForceDrawCard(op.id)}
                        />
                    ))}
                </div>
                {giveMode && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-blue-400 text-sm mt-2"
                    >
                        Clique sur un joueur pour lui donner la carte sélectionnée
                    </motion.p>
                )}
            </div>

            {/* Central area (deck + discard) */}
            <div className="flex-1 flex items-center justify-center">
                <DeckAndDiscard
                    deckCount={displayDeckCount}
                    discard={gameState.discard}
                    onDrawCard={handleDrawCard}
                    onTakeFromDiscard={handleTakeFromDiscard}
                />
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
