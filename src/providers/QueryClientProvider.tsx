import NetInfo from "@react-native-community/netinfo";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import {
  focusManager,
  onlineManager,
  QueryClient,
  QueryFunctionContext,
} from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import React, { ReactNode, useEffect, useState } from "react";
import { AppState } from "react-native";

import pkg from "../../package.json";
import { authController } from "../controllers/AuthController";
import AsyncStorage from "../modules/asyncStorage";
import { authenticated } from "../utils/axios";
import { routeToUri } from "../utils/badmagic";
import { isAxiosError } from "axios";

export type ApiQueryKey<
  TRoute extends string = string,
  TRouteParams extends Record<string, string> = Record<string, string>,
  TQueryParams extends Record<string, string> = Record<string, string>
> = readonly [
  route: TRoute,
  routeParams: TRouteParams,
  queryParams: TQueryParams
];

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24 * 2, // 48 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
      queryFn: async (context) => {
        const { queryKey } = context as QueryFunctionContext<
          ApiQueryKey,
          never
        >;
        const [route, routeParams, queryParams] = queryKey;
        const response = await authenticated.get(
          routeToUri(route, routeParams, queryParams)
        );
        return response.data;
      },
      retry: (failureCount, error) => {
        if (
          isAxiosError(error) &&
          error.response &&
          error.response.status >= 400 &&
          error.response.status < 500
        ) {
          return false;
        }

        return failureCount < 3;
      },
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(Boolean(state.isConnected));
  });
});

focusManager.setEventListener((setFocused) => {
  const subscription = AppState.addEventListener("change", (state) => {
    setFocused(state === "active");
  });

  return () => {
    subscription.remove();
  };
});

export function QueryClientProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<number | null>(
    authController.session?.user_id ?? null
  );

  useEffect(() => {
    return authController.subscribe("session", (session) => {
      setUserId(session?.user_id ?? null);
    });
  });

  return !userId ? null : (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        buster: `${pkg.version}:${userId}`,
        persister,
        maxAge: 1000 * 60 * 60 * 24 * 2, // 48 hours
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
