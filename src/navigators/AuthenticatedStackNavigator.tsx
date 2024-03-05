import React from "react";
import {
  NativeStackScreenProps,
  createNativeStackNavigator,
} from "@react-navigation/native-stack";
import { EndpointsScreen } from "./AuthenticatedStackNavigator/EndpointsScreen";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { EndpointScreen } from "./AuthenticatedStackNavigator/EndpointScreen";

export type AuthenticatedStackParamsList = {
  Endpoints: undefined;
  Endpoint: undefined;
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
    <Navigator initialRouteName="Endpoints">
      <Screen name="Endpoints" component={EndpointsScreen} />
      <Screen name="Endpoint" component={EndpointScreen} />
    </Navigator>
  );
}
