type Listener = (line: string) => void;

export interface SearchOptions {
  skillLevel?: number; // 0–20
  depth?: number;
  movetime?: number; // ms
  elo?: number; // optional, overrides skillLevel feel
}

export class StockfishEngine {
  private worker: Worker;
  private listeners = new Set<Listener>();
  private booted: Promise<void>;
  private currentSkill = -1;

  constructor(url = `${import.meta.env.BASE_URL}stockfish/stockfish-18-lite-single.js`) {
    this.worker = new Worker(url);
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

  private isReady() {
    return this.expect("readyok", () => this.send("isready"));
  }

  async getBestMove(fen: string, opts: SearchOptions): Promise<string | null> {
    await this.booted;

    if (opts.elo !== undefined) {
      this.send("setoption name UCI_LimitStrength value true");
      this.send(`setoption name UCI_Elo value ${opts.elo}`);
    } else if (opts.skillLevel !== undefined && opts.skillLevel !== this.currentSkill) {
      this.send("setoption name UCI_LimitStrength value false");
      this.send(`setoption name Skill Level value ${opts.skillLevel}`);
      this.currentSkill = opts.skillLevel;
    }

    this.send(`position fen ${fen}`);
    await this.isReady();

    const limit =
      opts.movetime !== undefined ? `movetime ${opts.movetime}` : `depth ${opts.depth ?? 12}`;

    return new Promise((resolve) => {
      const onLine: Listener = (line) => {
        if (!line.startsWith("bestmove")) return;
        this.listeners.delete(onLine);
        const move = line.split(/\s+/)[1];
        resolve(!move || move === "(none)" ? null : move);
      };
      this.listeners.add(onLine);
      this.send(`go ${limit}`);
    });
  }

  stop() {
    this.send("stop");
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
