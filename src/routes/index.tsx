import { createFileRoute, useRouter } from "@tanstack/react-router";

import type { Difficulty, GameMode, PieceColor } from "@/types";

import { SetupScreen } from "@/components/SetupScreen";
import { useChessStore } from "@/store/chessStore";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  const resetGame = useChessStore((s) => s.resetGame);
  const router = useRouter();

  function handleStart(color: PieceColor, diff: Difficulty, mode: GameMode, diffBlack: Difficulty) {
    resetGame(color, diff, mode, diffBlack);
    void router.navigate({ to: "/game" });
  }

  return <SetupScreen onStart={handleStart} />;
}
