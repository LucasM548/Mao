"use client";

import { useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";

interface StopwatchProps {
    lastActionAt: Timestamp | null;
    lastPlayerName: string | null;
}

export default function Stopwatch({ lastActionAt, lastPlayerName }: StopwatchProps) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!lastActionAt) {
            setElapsed(0);
            return;
        }

        const interval = setInterval(() => {
            const startMs = lastActionAt.toMillis();
            const diff = Math.floor((Date.now() - startMs) / 1000);
            setElapsed(diff);
        }, 1000);

        return () => clearInterval(interval);
    }, [lastActionAt]);

    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    return (
        <div className="flex flex-col items-center gap-1">
            <span className="text-2xl font-bold tabular-nums text-gold-400">
                {timeStr}
            </span>
            {lastPlayerName && (
                <span className="text-xs text-slate-400">
                    Dernier : <span className="text-gold-400 font-semibold">{lastPlayerName}</span>
                </span>
            )}
        </div>
    );
}
