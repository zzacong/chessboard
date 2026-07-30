import { createFileRoute, redirect } from "@tanstack/react-router";

import { GameLayout } from "@/components/GameLayout";
import { getChessState } from "@/store/chessStore";

export const Route = createFileRoute("/v1/game")({
  beforeLoad: () => {
    const { gameStarted } = getChessState();
    if (!gameStarted) {
      throw redirect({ to: "/" });
    }
  },
  component: () => <GameLayout badge="v1 · Minimax" />,
});
