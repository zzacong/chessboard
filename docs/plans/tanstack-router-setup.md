# TanStack Router Setup

## Overview

Introduce file-based client-side routing via TanStack Router to replace the current
`gameStarted` boolean-state screen switching in `App.tsx`. Two routes:

- `/` — renders `SetupScreen`
- `/game` — renders the chess game UI (header + board + sidebar); protected by a
  `beforeLoad` guard that redirects to `/` if the game has not been started

The Zustand store already holds all game state (`playerColor`, `difficulty`, etc.).
The guard reads from the store to decide whether `/game` is accessible.

---

## Sub-Tasks

### 1. Install dependencies and wire up the Vite plugin

**Intent**  
Add the required packages and configure Vite so that TanStack Router can generate
route types automatically from the file system.

**Expected Outcomes**

- `@tanstack/react-router` and `@tanstack/router-plugin` are listed in `package.json`
- `vite.config.ts` includes `TanStackRouterVite()` plugin (before the React plugin)
- Running `pnpm dev` triggers the code-generation step without error

**Todo List**

1. Install `@tanstack/react-router` (dependency) and `@tanstack/router-plugin`
   (dev dependency) via pnpm.
2. In `vite.config.ts`, import `TanStackRouterVite` from `@tanstack/router-plugin/vite`
   and add it as the first entry in the `plugins` array.

**Relevant Context**

- `vite.config.ts` — add the plugin here
- `package.json` — tracks the new packages

**Status** — `[ ] pending`

---

### 2. Create the route file tree under `src/routes/`

**Intent**  
Define the two routes as files. TanStack Router's file-based convention maps the
file system to URL segments. A root layout wraps both routes.

**Expected Outcomes**

- `src/routes/__root.tsx` — root layout / `<Outlet>` wrapper
- `src/routes/index.tsx` — renders `<SetupScreen>` (the `/` route)
- `src/routes/game.tsx` — renders the game UI (the `/game` route), with a
  `beforeLoad` guard that redirects unauthenticated/unstarted sessions to `/`
- TanStack Router codegen produces `src/routeTree.gen.ts` on first `pnpm dev` run

**Todo List**

1. Create `src/routes/__root.tsx` with a `createRootRoute` that renders
   `<Outlet />` (minimal wrapper — no extra DOM needed here).
2. Create `src/routes/index.tsx` with a `createFileRoute('/')` that:
   - Renders `<SetupScreen>` and passes an `onStart` handler.
   - The `onStart` handler calls `resetGame(...)` from the store and then
     navigates to `/game` using `router.navigate`.
3. Create `src/routes/game.tsx` with a `createFileRoute('/game')` that:
   - In `beforeLoad`, reads `gameStarted` from the Zustand store (or a
     dedicated `isGameStarted()` helper). If the game has not been configured,
     throws a `redirect({ to: '/' })`.
   - Renders the game UI (header + `<Board>` + `<StatusBar>` + `<Sidebar>`).
   - Wires a "New Game" action that navigates back to `/`.

**Relevant Context**

- `src/components/SetupScreen.tsx` — currently accepts `onStart` prop; keep that
  interface unchanged.
- `src/store/chessStore.ts` — `resetGame` is the action to call on start; the
  store's `fen` field (or a new thin `gameStarted` selector) can serve as the
  guard signal. Use `fen !== new Chess().fen() || gameMode has been explicitly
set` — or, simpler, add a boolean `gameStarted` flag to the Zustand store.
- `src/App.tsx` — the game UI markup lives here and will move to `game.tsx`.

**Status** — `[ ] pending`

---

### 3. Bootstrap the router in `main.tsx` and clean up `App.tsx`

**Intent**  
Replace the `<App>` tree in `main.tsx` with a `<RouterProvider>`, and either
remove `App.tsx` entirely or reduce it to a trivial re-export so no dead code
remains.

**Expected Outcomes**

- `main.tsx` creates the router from the generated `routeTree.gen.ts` and renders
  `<RouterProvider router={router} />`
- `App.tsx` is deleted (or emptied to a no-op if a default export is still
  expected elsewhere — it is not; nothing imports `App` except `main.tsx`)
- `pnpm check` passes with no type errors, lint warnings, or test failures

**Todo List**

1. In `main.tsx`:
   - Import `createRouter` and `RouterProvider` from `@tanstack/react-router`.
   - Import the generated `routeTree` from `./routeTree.gen`.
   - Create the router: `const router = createRouter({ routeTree })`.
   - Declare the module-augmentation for `Register` (TanStack Router's type-safety
     pattern: `declare module '@tanstack/react-router' { interface Register { router: typeof router } }`).
   - Replace `<App />` with `<RouterProvider router={router} />`.
2. Delete `src/App.tsx` (nothing else imports it after step 1).
3. Run `pnpm check` and fix any type, lint, or import-order issues surfaced.

**Relevant Context**

- `src/main.tsx` — entry point to modify
- `src/App.tsx` — to be deleted
- `tsconfig.app.json` — `"include": ["src"]` already covers `routeTree.gen.ts`

**Status** — `[ ] pending`

---

### 4. Add a `gameStarted` flag to the Zustand store

**Intent**  
The `/game` route guard needs a clean signal from the store. Rather than
inferring "started" from FEN values, add an explicit `gameStarted: boolean`
field that `resetGame` sets to `true` and that can be read synchronously in
`beforeLoad`.

**Expected Outcomes**

- `chessStore.ts` exposes a `gameStarted` boolean (initially `false`)
- `resetGame` sets `gameStarted: true`
- The `beforeLoad` guard in `game.tsx` reads
  `useChessStore.getState().gameStarted` to decide whether to redirect

**Todo List**

1. Add `gameStarted: boolean` to `ChessState` in `chessStore.ts` (default `false`).
2. In `resetGame`, include `gameStarted: true` in the `set({...})` call.
3. Update the guard in `src/routes/game.tsx` (created in sub-task 2) to use
   this field.

**Relevant Context**

- `src/store/chessStore.ts` — `ChessState`, `resetGame`

**Note** — This sub-task should be implemented **before** sub-task 2 (route
files), so the guard can reference the flag. Ordering in the implementation
should be: 4 → 2 → 1 → 3.

**Status** — `[ ] pending`
