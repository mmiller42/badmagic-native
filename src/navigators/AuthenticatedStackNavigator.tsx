import { NavigationProp, useNavigation } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import React from "react";

import { EndpointScreen } from "./AuthenticatedStackNavigator/EndpointScreen";
import { EndpointsScreen } from "./AuthenticatedStackNavigator/EndpointsScreen";
import { QueryClientProvider } from "../providers/QueryClientProvider";

export type AuthenticatedStackParamsList = {
  Endpoints: undefined;
  Endpoint: { path: string };
};

export type AuthenticatedStackScreenProps<
  TRoute extends keyof AuthenticatedStackParamsList
> = NativeStackScreenProps<AuthenticatedStackParamsList, TRoute>;

export function useAuthenticatedStackNavigation(): NavigationProp<AuthenticatedStackParamsList> {
  return useNavigation<NavigationProp<AuthenticatedStackParamsList>>();
}

const { Screen, Navigator } =
  createNativeStackNavigator<AuthenticatedStackParamsList>();

export function AuthenticatedStackNavigator() {
  return (
    <QueryClientProvider>
      <Navigator initialRouteName="Endpoints">
        <Screen
          name="Endpoints"
          component={EndpointsScreen}
          options={{ headerShown: false }}
        />
        <Screen name="Endpoint" component={EndpointScreen} />
      </Navigator>
    </QueryClientProvider>
  );
}
