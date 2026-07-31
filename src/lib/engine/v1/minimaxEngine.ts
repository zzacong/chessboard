import type { Engine, EngineOptions } from "../index";

interface WorkerResponse {
  bestMove: string;
  id: number;
}

export class MinimaxEngine implements Engine {
  private worker: Worker;
  private pending = new Map<number, (move: string | null) => void>();
  private nextId = 0;

  constructor() {
    this.worker = new Worker(new URL("./minimaxWorker.ts", import.meta.url), {
      type: "module",
    });

    this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { bestMove, id } = e.data;
      const resolve = this.pending.get(id);
      if (!resolve) return;
      this.pending.delete(id);
      resolve(bestMove || null);
    };

    this.worker.onerror = (event) => {
      console.error("Minimax worker error:", event);
      for (const resolve of this.pending.values()) resolve(null);
      this.pending.clear();
    };
  }

  getBestMove(fen: string, opts: EngineOptions): Promise<string | null> {
    const id = ++this.nextId;
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      this.worker.postMessage({ fen, depth: opts.depth, id });
    });
  }

  cancelSearch(): void {
    // Minimax runs synchronously in the worker; it cannot be interrupted.
    // Stale results are discarded by the store's pendingMsgId guard.
  }

  newGame(): void {
    // Minimax is stateless — no reset needed.
  }

  terminate() {
    this.pending.clear();
    this.worker.terminate();
  }
}

let engine: MinimaxEngine | null = null;

export function getMinimax(): MinimaxEngine {
  engine ??= new MinimaxEngine();
  return engine;
}
