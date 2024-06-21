import { useMemo } from "react";

import { Route, routeToUri, workspace } from "../utils/badmagic";

export function useBadMagicRoute(path: string): Route | undefined {
  return useMemo(() => {
    return workspace.routes.find((route) => route.path === path);
  }, [path]);
}

export function useBadMagicUri(
  route: Route | undefined,
  routeParams: Record<string, string>,
  qsParams: Record<string, string>
): string | undefined {
  return useMemo(
    () => (route?.path ? routeToUri(route.path, routeParams, qsParams) : ""),
    [route?.path, routeParams, qsParams]
  );
}
