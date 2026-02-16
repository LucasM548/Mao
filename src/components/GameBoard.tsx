"use client";

import { useState, useCallback } from "react";
import { GameState, getOrderedPlayers } from "@/lib/gameService";
import { sortBySuit, sortByRank } from "@/lib/cards";
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
    const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
    const [giveMode, setGiveMode] = useState(false);
    const [sortMode, setSortMode] = useState<"suit" | "rank">("suit");

    const myPlayer = gameState.players[playerId];
    const orderedPlayers = getOrderedPlayers(gameState.players);
    const opponents = orderedPlayers.filter((p) => p.id !== playerId);

    // Last played info
    const lastPlayerName = gameState.lastPlayedBy
        ? gameState.players[gameState.lastPlayedBy]?.name || null
        : null;

    const canUndo = (gameState.actionHistory?.length || 0) > 0;

    // ─── Actions ────────────────────────────────────────

    const handleDrawCard = useCallback(() => {
        gameService.drawCard(roomCode, playerId);
    }, [roomCode, playerId]);

    const handlePlayCard = useCallback(() => {
        if (selectedCardIndex === null) return;
        gameService.playCard(roomCode, playerId, selectedCardIndex);
        setSelectedCardIndex(null);
        setGiveMode(false);
    }, [roomCode, playerId, selectedCardIndex]);

    const handleGiveCard = useCallback(
        (toId: string) => {
            if (selectedCardIndex === null) return;
            gameService.giveCard(roomCode, playerId, toId, selectedCardIndex);
            setSelectedCardIndex(null);
            setGiveMode(false);
        },
        [roomCode, playerId, selectedCardIndex]
    );

    const handleTakeFromDiscard = useCallback(() => {
        gameService.takeFromDiscard(roomCode, playerId);
    }, [roomCode, playerId]);

    const handleForceDrawCard = useCallback(
        (targetId: string) => {
            gameService.forceDrawCard(roomCode, targetId);
        },
        [roomCode]
    );

    const handleUndo = useCallback(() => {
        gameService.undoLastAction(roomCode);
    }, [roomCode]);

    const handleSortHand = useCallback(() => {
        if (!myPlayer) return;
        const newSort = sortMode === "suit" ? "rank" : "suit";
        setSortMode(newSort);
        const sorted = newSort === "suit"
            ? sortBySuit(myPlayer.hand)
            : sortByRank(myPlayer.hand);
        gameService.updatePlayerHand(roomCode, playerId, sorted);
        setSelectedCardIndex(null);
    }, [roomCode, playerId, myPlayer, sortMode]);

    const handleSelectCard = useCallback((index: number) => {
        setSelectedCardIndex((prev) => (prev === index ? null : index));
        setGiveMode(false);
    }, []);

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
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-300">{myPlayer.name}</span>
                    <span className="text-xs text-slate-500">
                        ({myPlayer.hand.length})
                    </span>
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
                    deckCount={gameState.deck.length}
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
                    hand={myPlayer.hand}
                    selectedIndex={selectedCardIndex}
                    onSelectCard={handleSelectCard}
                />
            </div>
        </div>
    );
}
