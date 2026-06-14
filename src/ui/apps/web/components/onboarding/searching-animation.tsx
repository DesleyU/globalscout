"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  DATABASE_SOURCES,
  SEARCH_MESSAGES,
} from "@/features/onboarding/player/constants";

type SearchingAnimationProps = {
  onComplete: () => void;
  canFinish?: boolean;
  minimumDurationMs?: number;
};

export function SearchingAnimation({
  onComplete,
  canFinish = false,
  minimumDurationMs = 2500,
}: SearchingAnimationProps) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const messageTimer = window.setInterval(() => {
      setMessageIndex((index) => (index + 1) % SEARCH_MESSAGES.length);
    }, 900);

    const progressTimer = window.setInterval(() => {
      setProgress((value) => Math.min(value + 2, 90));
    }, 60);

    const minTimer = window.setTimeout(() => {
      setMinTimeElapsed(true);
    }, minimumDurationMs);

    return () => {
      window.clearInterval(messageTimer);
      window.clearInterval(progressTimer);
      window.clearTimeout(minTimer);
    };
  }, [minimumDurationMs]);

  useEffect(() => {
    if (!minTimeElapsed || !canFinish) {
      return;
    }

    setProgress(100);

    const completeTimer = window.setTimeout(() => {
      onCompleteRef.current();
    }, 400);

    return () => {
      window.clearTimeout(completeTimer);
    };
  }, [minTimeElapsed, canFinish]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 px-4">
      <div className="relative mb-12">
        <div className="flex h-40 w-40 items-center justify-center rounded-full bg-blue-600/20">
          <div className="absolute flex h-28 w-28 animate-ping items-center justify-center rounded-full bg-blue-600/30" />
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-600/40">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 shadow-2xl">
              <Search className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>
      </div>

      <h2 className="mb-3 text-center text-2xl font-bold text-white">
        Searching Football Databases
      </h2>

      <div className="mb-8 flex h-7 items-center justify-center">
        <p
          key={messageIndex}
          className="animate-pulse text-center text-lg text-blue-300"
        >
          {minTimeElapsed && !canFinish
            ? "Finishing search..."
            : SEARCH_MESSAGES[messageIndex]}
        </p>
      </div>

      <Progress value={progress} className="mb-4 h-2 w-72 bg-white/10" />
      <p className="text-sm text-gray-500">{progress}%</p>

      <div className="mt-12 flex items-center gap-6">
        {DATABASE_SOURCES.map((source) => (
          <div key={source} className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
              <Trophy className="h-5 w-5 text-gray-400" />
            </div>
            <span className="text-xs text-gray-500">{source}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
