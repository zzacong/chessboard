import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";

import "../index.css";

import { useChessStore } from "@/store/chessStore";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const theme = useChessStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:text-text focus:ring-2 focus:ring-accent focus:outline-none"
      >
        Skip to content
      </a>
      <Outlet />
      {/* <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      /> */}
    </>
  );
}
