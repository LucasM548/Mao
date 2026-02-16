export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

export interface Card {
    suit: Suit;
    rank: Rank;
    id: string; // unique identifier e.g. "hearts-A-0" (last number is deck index)
}

export const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
export const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export const SUIT_SYMBOLS: Record<Suit, string> = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
};

export const SUIT_COLORS: Record<Suit, string> = {
    hearts: "#dc2626",
    diamonds: "#dc2626",
    clubs: "#000000",
    spades: "#000000",
};

// Suit sort order for organizing by suit
export const SUIT_ORDER: Record<Suit, number> = {
    hearts: 0,
    diamonds: 1,
    clubs: 2,
    spades: 3,
};

// Rank sort order for organizing by value
export const RANK_ORDER: Record<Rank, number> = {
    "A": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
    "8": 8, "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13,
};

export function createDeck(deckIndex: number = 0): Card[] {
    const deck: Card[] = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ suit, rank, id: `${suit}-${rank}-${deckIndex}` });
        }
    }
    return deck;
}

export function createMultiDeck(numDecks: number): Card[] {
    const allCards: Card[] = [];
    for (let i = 0; i < numDecks; i++) {
        allCards.push(...createDeck(i));
    }
    return allCards;
}

export function shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export function sortBySuit(cards: Card[]): Card[] {
    return [...cards].sort((a, b) => {
        const suitDiff = SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
        if (suitDiff !== 0) return suitDiff;
        return RANK_ORDER[a.rank] - RANK_ORDER[b.rank];
    });
}

export function sortByRank(cards: Card[]): Card[] {
    return [...cards].sort((a, b) => {
        const rankDiff = RANK_ORDER[a.rank] - RANK_ORDER[b.rank];
        if (rankDiff !== 0) return rankDiff;
        return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
    });
}
