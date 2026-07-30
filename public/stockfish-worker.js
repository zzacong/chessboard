/**
 * Stockfish Web Worker (classic, non-module)
 *
 * Loads the Stockfish 18 Lite single-threaded engine via importScripts,
 * communicates over UCI, and returns { bestMove, id } — the same shape
 * as the v1 minimax worker so the store's onmessage handler is shared.
 *
 * Message in:  { fen: string, skillLevel: number, id: number }
 * Message out: { bestMove: string, id: number }
 */

/* global Stockfish */

importScripts("/stockfish/stockfish-18-lite-single.js");

/** @type {ReturnType<typeof Stockfish> | null} */
var engine = null;

/** @type {number | null} */
var pendingId = null;

function getEngine() {
  if (engine) return engine;
  engine = Stockfish();
  engine.onmessage = function (line) {
    if (typeof line === "object" && line.data) line = line.data;
    if (typeof line !== "string") return;

    var match = line.match(/^bestmove\s+(\S+)/);
    if (!match) return;

    var move = match[1];
    if (move === "(none)") move = "";

    var id = pendingId;
    pendingId = null;
    self.postMessage({ bestMove: move, id: id });
  };
  // Initialise UCI
  engine.postMessage("uci");
  engine.postMessage("isready");
  return engine;
}

self.onmessage = function (e) {
  var fen = e.data.fen;
  var skillLevel = e.data.skillLevel;
  var id = e.data.id;

  pendingId = id;

  var eng = getEngine();
  eng.postMessage("ucinewgame");
  eng.postMessage("setoption name Skill Level value " + skillLevel);
  eng.postMessage("position fen " + fen);
  eng.postMessage("go depth 15");
};
