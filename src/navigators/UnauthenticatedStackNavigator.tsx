import React from "react";
import {
  NativeStackScreenProps,
  createNativeStackNavigator,
} from "@react-navigation/native-stack";
import { LoginScreen } from "./UnauthenticatedStackNavigator/LoginScreen";
import { NavigationProp, useNavigation } from "@react-navigation/native";

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
