import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

import { authenticate } from "../../api/auth";
import { authController } from "../../controllers/AuthController";
import { credentialsController } from "../../controllers/CredentialsController";
import { UnauthenticatedStackScreenProps } from "../UnauthenticatedStackNavigator";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        textContentType="username"
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        textContentType="password"
      />
      <Button
        disabled={!email || !password}
        title="Log In"
        onPress={async () => {
          try {
            const session = await authenticate({ email, password });
            await credentialsController.updateCredentials({ email, password });
            authController.updateSession(session);
          } catch (e) {
            console.error(e);
          }
        }}
      />
    </View>
  );
}
