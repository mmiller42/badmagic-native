import React, { useEffect, useState } from "react";
import {
  NativeStackScreenProps,
  createNativeStackNavigator,
} from "@react-navigation/native-stack";
import {
  LoginParamsList,
  LoginScreen,
} from "./UnauthenticatedStackNavigator/LoginScreen";
import {
  EndpointsParamsList,
  EndpointsScreen,
} from "./AuthenticatedStackNavigator/EndpointsScreen";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { AuthenticatedStackNavigator } from "./AuthenticatedStackNavigator";
import { UnauthenticatedStackNavigator } from "./UnauthenticatedStackNavigator";
import { authController } from "../controllers/AuthController";

export type RootStackParamsList = {
  AuthenticatedStack: undefined;
  UnauthenticatedStack: undefined;
};

const { Screen, Navigator, Group } =
  createNativeStackNavigator<RootStackParamsList>();

export function RootStackNavigator() {
  const [session, setSession] = useState(authController.session);

  useEffect(() => {
    return authController.subscribe(setSession);
  }, []);

  useEffect(() => {
    console.log("session:", session);
  }, [session]);

  return (
    <Navigator initialRouteName="UnauthenticatedStack">
      <Group screenOptions={{ headerShown: false }}>
        {session ? (
          <Screen
            name="AuthenticatedStack"
            component={AuthenticatedStackNavigator}
          />
        ) : (
          <Screen
            name="UnauthenticatedStack"
            component={UnauthenticatedStackNavigator}
          />
        )}
      </Group>
    </Navigator>
  );
}
