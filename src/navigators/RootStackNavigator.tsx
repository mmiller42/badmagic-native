import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";

import { authController } from "../controllers/AuthController";
import { AuthenticatedStackNavigator } from "./AuthenticatedStackNavigator";
import { UnauthenticatedStackNavigator } from "./UnauthenticatedStackNavigator";

export type RootStackParamsList = {
  AuthenticatedStack: undefined;
  UnauthenticatedStack: undefined;
};

const { Screen, Navigator, Group } =
  createNativeStackNavigator<RootStackParamsList>();

export function RootStackNavigator() {
  const [session, setSession] = useState(authController.session);

  useEffect(() => {
    return authController.subscribe("session", setSession);
  }, []);

  useEffect(() => {
    console.log("session:", session);
  }, [session]);

  return session === undefined ? null : (
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
