import React from "react";
import { Button, Text } from "react-native";
import { AuthenticatedStackScreenProps } from "../AuthenticatedStackNavigator";

export function EndpointScreen({
  navigation,
}: AuthenticatedStackScreenProps<"Endpoint">) {
  return (
    <Button
      title="Endpoints"
      onPress={() => navigation.navigate("Endpoints")}
    />
  );
}
