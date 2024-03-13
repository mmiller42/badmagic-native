/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import React from "react";
import { useColorScheme } from "react-native";

import { credentialsController } from "./controllers/CredentialsController";
import { RootStackNavigator } from "./navigators/RootStackNavigator";

credentialsController.initialize();

export function App() {
  const scheme = useColorScheme();
  return (
    <NavigationContainer theme={scheme === "dark" ? DarkTheme : DefaultTheme}>
      <RootStackNavigator />
    </NavigationContainer>
  );
}
