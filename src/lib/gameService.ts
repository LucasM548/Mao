import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    onSnapshot,
    Timestamp,
    Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { Card, createMultiDeck, shuffleDeck } from "./cards";

export interface Player {
    name: string;
    hand: Card[];
    order: number;
    revealedCards: string[]; // IDs of cards visible to others
}

export interface ActionRecord {
    type: "draw" | "play" | "give" | "takeFromDiscard" | "forceDraw";
    playerId: string;
    targetPlayerId?: string;
    card?: Card;
    cardIndex?: number;
    previousDeck?: Card[];
    previousDiscard?: Card[];
    previousPlayers?: Record<string, Player>;
}

export interface GameState {
    deck: Card[];
    discard: Card[];
    players: Record<string, Player>;
    lastPlayedBy: string | null;
    lastActionAt: Timestamp | null;
    createdAt: Timestamp;
    started: boolean;
    numDecks: number;
    actionHistory: ActionRecord[];
}

// ─── Room Lifecycle ─────────────────────────────────────────────

export async function createOrJoinRoom(
    roomCode: string,
    playerId: string,
    playerName: string
): Promise<void> {
    const roomRef = doc(db, "rooms", roomCode);
    const roomSnap = await getDoc(roomRef);

    if (roomSnap.exists()) {
        const data = roomSnap.data() as GameState;
        if (data.players[playerId]) return;

        const playerCount = Object.keys(data.players).length;
        const updatedPlayers = {
            ...data.players,
            [playerId]: {
                name: playerName,
                hand: [],
                order: playerCount,
                revealedCards: [],
            },
        };
        await updateDoc(roomRef, { players: updatedPlayers });
    } else {
        const deck = shuffleDeck(createMultiDeck(1));
        const newRoom: GameState = {
            deck,
            discard: [],
            players: {
                [playerId]: {
                    name: playerName,
                    hand: [],
                    order: 0,
                    revealedCards: [],
                },
            },
            lastPlayedBy: null,
            lastActionAt: null,
            createdAt: Timestamp.now(),
            started: false,
            numDecks: 1,
            actionHistory: [],
        };
        await setDoc(roomRef, newRoom);
    }
}

export async function setNumDecks(roomCode: string, numDecks: number): Promise<void> {
    const roomRef = doc(db, "rooms", roomCode);
    const deck = shuffleDeck(createMultiDeck(numDecks));
    await updateDoc(roomRef, { numDecks, deck });
}

// ─── Real-time Subscription ─────────────────────────────────────

export function subscribeToRoom(
    roomCode: string,
    callback: (state: GameState | null) => void
): Unsubscribe {
    const roomRef = doc(db, "rooms", roomCode);
    return onSnapshot(roomRef, (snap) => {
        if (snap.exists()) {
            callback(snap.data() as GameState);
        } else {
            callback(null);
        }
    });
}

// ─── Auto-reshuffle helper ──────────────────────────────────────

function reshuffleDeckIfNeeded(
    data: GameState
): { deck: Card[]; discard: Card[] } {
    let deck = [...data.deck];
    let discard = [...data.discard];

    if (deck.length === 0 && discard.length > 0) {
        const topCard = discard.pop()!;
        deck = shuffleDeck(discard);
        discard = [topCard];
    }

    return { deck, discard };
}

// ─── Save action to history (keep last 30 — lighter docs) ───────

function pushAction(history: ActionRecord[], action: ActionRecord): ActionRecord[] {
    const newHistory = [...history, action];
    if (newHistory.length > 30) {
        return newHistory.slice(-30);
    }
    return newHistory;
}

// ─── Game Actions ────────────────────────────────────────────────

export async function startGame(roomCode: string, numDecks?: number): Promise<void> {
    const roomRef = doc(db, "rooms", roomCode);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const data = snap.data() as GameState;
    const deckCount = numDecks || data.numDecks || 1;
    const deck = shuffleDeck(createMultiDeck(deckCount));
    const players = { ...data.players };

    for (const pid of Object.keys(players)) {
        const hand = deck.splice(0, 7);
        players[pid] = { ...players[pid], hand, revealedCards: [] };
    }

    await updateDoc(roomRef, {
        deck,
        players,
        started: true,
        numDecks: deckCount,
        lastPlayedBy: null,
        lastActionAt: Timestamp.now(),
        actionHistory: [],
    });
}

export async function drawCard(
    roomCode: string,
    playerId: string
): Promise<void> {
    const roomRef = doc(db, "rooms", roomCode);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const data = snap.data() as GameState;
    const { deck, discard } = reshuffleDeckIfNeeded(data);
    const players = { ...data.players };

    if (deck.length === 0) return;

    const card = deck.shift()!;
    players[playerId] = {
        ...players[playerId],
        hand: [...players[playerId].hand, card],
    };

    const action: ActionRecord = {
        type: "draw",
        playerId,
        card,
        previousDeck: data.deck,
        previousDiscard: data.discard,
        previousPlayers: data.players,
    };

    await updateDoc(roomRef, {
        deck,
        discard,
        players,
        lastPlayedBy: playerId,
        lastActionAt: Timestamp.now(),
        actionHistory: pushAction(data.actionHistory || [], action),
    });
}

export async function playCard(
    roomCode: string,
    playerId: string,
    cardIndex: number
): Promise<void> {
    const roomRef = doc(db, "rooms", roomCode);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const data = snap.data() as GameState;
    const players = { ...data.players };
    const hand = [...players[playerId].hand];
    const card = hand.splice(cardIndex, 1)[0];
    const discard = [...data.discard, card];

    // Remove from revealed if it was revealed
    const revealedCards = (players[playerId].revealedCards || []).filter(
        (id) => id !== card.id
    );

    const action: ActionRecord = {
        type: "play",
        playerId,
        card,
        cardIndex,
        previousDeck: data.deck,
        previousDiscard: data.discard,
        previousPlayers: data.players,
    };

    players[playerId] = { ...players[playerId], hand, revealedCards };
    await updateDoc(roomRef, {
        players,
        discard,
        lastPlayedBy: playerId,
        lastActionAt: Timestamp.now(),
        actionHistory: pushAction(data.actionHistory || [], action),
    });
}

export async function giveCard(
    roomCode: string,
    fromId: string,
    toId: string,
    cardIndex: number
): Promise<void> {
    const roomRef = doc(db, "rooms", roomCode);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const data = snap.data() as GameState;
    const players = { ...data.players };

    const fromHand = [...players[fromId].hand];
    const card = fromHand.splice(cardIndex, 1)[0];
    const toHand = [...players[toId].hand, card];

    // Remove from revealed
    const revealedCards = (players[fromId].revealedCards || []).filter(
        (id) => id !== card.id
    );

    const action: ActionRecord = {
        type: "give",
        playerId: fromId,
        targetPlayerId: toId,
        card,
        cardIndex,
        previousDeck: data.deck,
        previousDiscard: data.discard,
        previousPlayers: data.players,
    };

    players[fromId] = { ...players[fromId], hand: fromHand, revealedCards };
    players[toId] = { ...players[toId], hand: toHand };

    await updateDoc(roomRef, {
        players,
        lastPlayedBy: fromId,
        lastActionAt: Timestamp.now(),
        actionHistory: pushAction(data.actionHistory || [], action),
    });
}

export async function takeFromDiscard(
    roomCode: string,
    playerId: string
): Promise<void> {
    const roomRef = doc(db, "rooms", roomCode);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const data = snap.data() as GameState;
    const discard = [...data.discard];

    if (discard.length === 0) return;

    const card = discard.pop()!;
    const players = { ...data.players };
    players[playerId] = {
        ...players[playerId],
        hand: [...players[playerId].hand, card],
    };

    const action: ActionRecord = {
        type: "takeFromDiscard",
        playerId,
        card,
        previousDeck: data.deck,
        previousDiscard: data.discard,
        previousPlayers: data.players,
    };

    await updateDoc(roomRef, {
        players,
        discard,
        lastPlayedBy: playerId,
        lastActionAt: Timestamp.now(),
        actionHistory: pushAction(data.actionHistory || [], action),
    });
}

export async function forceDrawCard(
    roomCode: string,
    targetPlayerId: string
): Promise<void> {
    const roomRef = doc(db, "rooms", roomCode);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const data = snap.data() as GameState;
    const { deck, discard } = reshuffleDeckIfNeeded(data);
    const players = { ...data.players };

    if (deck.length === 0) return;

    const card = deck.shift()!;
    players[targetPlayerId] = {
        ...players[targetPlayerId],
        hand: [...players[targetPlayerId].hand, card],
    };

    const action: ActionRecord = {
        type: "forceDraw",
        playerId: targetPlayerId,
        card,
        previousDeck: data.deck,
        previousDiscard: data.discard,
        previousPlayers: data.players,
    };

    await updateDoc(roomRef, {
        deck,
        discard,
        players,
        lastActionAt: Timestamp.now(),
        actionHistory: pushAction(data.actionHistory || [], action),
    });
}

// ─── Card Reveal Toggle ─────────────────────────────────────────

export async function toggleRevealCard(
    roomCode: string,
    playerId: string,
    cardId: string
): Promise<void> {
    const roomRef = doc(db, "rooms", roomCode);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const data = snap.data() as GameState;
    const players = { ...data.players };
    const player = players[playerId];
    const revealed = player.revealedCards || [];

    const isRevealed = revealed.includes(cardId);
    players[playerId] = {
        ...player,
        revealedCards: isRevealed
            ? revealed.filter((id) => id !== cardId)
            : [...revealed, cardId],
    };

    await updateDoc(roomRef, { players });
}

// ─── Undo ────────────────────────────────────────────────────────

export async function undoLastAction(roomCode: string): Promise<void> {
    const roomRef = doc(db, "rooms", roomCode);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const data = snap.data() as GameState;
    const history = [...(data.actionHistory || [])];

    if (history.length === 0) return;

    const lastAction = history.pop()!;

    await updateDoc(roomRef, {
        deck: lastAction.previousDeck || data.deck,
        discard: lastAction.previousDiscard || data.discard,
        players: lastAction.previousPlayers || data.players,
        actionHistory: history,
        lastActionAt: Timestamp.now(),
    });
}

// ─── Sort hand ──────────────────────────────────────────────────

export async function updatePlayerHand(
    roomCode: string,
    playerId: string,
    newHand: Card[]
): Promise<void> {
    const roomRef = doc(db, "rooms", roomCode);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const data = snap.data() as GameState;
    const players = { ...data.players };
    players[playerId] = { ...players[playerId], hand: newHand };

    await updateDoc(roomRef, { players });
}

// ─── Helpers ─────────────────────────────────────────────────────

export function getOrderedPlayers(
    players: Record<string, Player>
): { id: string; player: Player }[] {
    return Object.entries(players)
        .map(([id, player]) => ({ id, player }))
        .sort((a, b) => a.player.order - b.player.order);
}
