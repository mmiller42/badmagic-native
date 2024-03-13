import { NavigationProp, useNavigation } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import React from "react";

import { LoginScreen } from "./UnauthenticatedStackNavigator/LoginScreen";

export type UnauthenticatedStackParamsList = {
  Login: undefined;
};

export type UnauthenticatedStackScreenProps<
  TRoute extends keyof UnauthenticatedStackParamsList
> = NativeStackScreenProps<UnauthenticatedStackParamsList, TRoute>;

export function useUnauthenticatedStackNavigation(): NavigationProp<UnauthenticatedStackParamsList> {
  return useNavigation<NavigationProp<UnauthenticatedStackParamsList>>();
}

const { Screen, Navigator } =
  createNativeStackNavigator<UnauthenticatedStackParamsList>();

export function UnauthenticatedStackNavigator() {
  return (
    <Navigator initialRouteName="Login">
      <Screen name="Login" component={LoginScreen} />
    </Navigator>
  );
}
