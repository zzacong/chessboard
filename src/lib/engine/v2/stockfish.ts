type Listener = (line: string) => void;

export interface SearchOptions {
  skillLevel: number; // 0–20
  depth?: number; // default 12
}

export class StockfishEngine {
  private worker: Worker;
  private listeners = new Set<Listener>();
  private booted: Promise<void>;
  private currentSkill = -1;
  private cancelCurrentSearch: (() => void) | null = null;

  constructor() {
    const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
    const workerUrl = new URL("stockfish/stockfish-18-lite-single.js", baseUrl);
    const wasmUrl = new URL("stockfish/stockfish-18-lite-single.wasm", baseUrl);
    workerUrl.hash = encodeURIComponent(wasmUrl.href);

    this.worker = new Worker(workerUrl);
    this.worker.onmessage = (e: MessageEvent) => {
      const line = typeof e.data === "string" ? e.data : (e.data?.data as string);
      if (typeof line !== "string") return;
      for (const l of this.listeners) l(line);
    };
    this.booted = this.expect("uciok", () => this.send("uci"));
  }

  private send(cmd: string) {
    this.worker.postMessage(cmd);
  }

  private expect(token: string, kick: () => void): Promise<void> {
    return new Promise((resolve) => {
      const onLine: Listener = (line) => {
        if (line.startsWith(token)) {
          this.listeners.delete(onLine);
          resolve();
        }
      };
      this.listeners.add(onLine);
      kick();
    });
  }

  private isReady(): Promise<void> {
    return this.expect("readyok", () => this.send("isready"));
  }

  async getBestMove(fen: string, opts: SearchOptions): Promise<string | null> {
    await this.booted;

    if (opts.skillLevel !== this.currentSkill) {
      this.send(`setoption name Skill Level value ${opts.skillLevel}`);
      this.currentSkill = opts.skillLevel;
    }

    this.send(`position fen ${fen}`);
    await this.isReady();

    const limit = `depth ${opts.depth ?? 12}`;

    return new Promise((resolve) => {
      const onLine: Listener = (line) => {
        if (!line.startsWith("bestmove")) return;
        this.listeners.delete(onLine);
        this.cancelCurrentSearch = null;
        const move = line.split(/\s+/)[1];
        resolve(!move || move === "(none)" ? null : move);
      };
      this.listeners.add(onLine);

      this.cancelCurrentSearch = () => {
        this.listeners.delete(onLine);
        this.cancelCurrentSearch = null;
        this.send("stop");
        resolve(null);
      };

      this.send(`go ${limit}`);
    });
  }

  cancelSearch() {
    this.cancelCurrentSearch?.();
  }

  newGame() {
    this.send("ucinewgame");
  }

  terminate() {
    this.listeners.clear();
    this.worker.terminate();
  }
}

let engine: StockfishEngine | null = null;

export function getStockfish(): StockfishEngine {
  engine ??= new StockfishEngine();
  return engine;
}
