import React from "react";
import { Button, Text, View } from "react-native";
import { AuthenticatedStackScreenProps } from "../AuthenticatedStackNavigator";
import { resetInternetCredentials } from "react-native-keychain";

export function EndpointsScreen({
  navigation,
}: AuthenticatedStackScreenProps<"Endpoints">) {
  return (
    <View>
      <Button
        title="Endpoint"
        onPress={() => navigation.navigate("Endpoint")}
      />
      <Button
        title="Log Out"
        onPress={() => resetInternetCredentials("BADMAGIC_QA")}
      />
    </View>
  );
}
