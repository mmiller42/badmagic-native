import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { Button, TextInput, ToastAndroid, View } from "react-native";

import {
  authenticate,
  BadLoginRequestBaseError,
  TokensResponse,
  TwoFactorCodeRequiredError,
} from "../../api/auth";
import { authController } from "../../controllers/AuthController";
import { credentialsController } from "../../controllers/CredentialsController";
import { UnauthenticatedStackParamsList } from "../UnauthenticatedStackNavigator";
import { useSetMultiFactorState } from "./providers/multiFactorAtom";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const setMultiFactorState = useSetMultiFactorState();
  const { navigate } =
    useNavigation<NativeStackNavigationProp<UnauthenticatedStackParamsList>>();

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
          let session: TokensResponse;

          try {
            session = await authenticate({ email, password });
          } catch (e) {
            if (e instanceof TwoFactorCodeRequiredError) {
              const { tfa_api_token } = e;
              setMultiFactorState({ email, password, tfa_api_token });
              navigate("MultiFactor");
              return;
            } else if (e instanceof BadLoginRequestBaseError) {
              ToastAndroid.show(e.constructor.name, ToastAndroid.LONG);
              return;
            } else {
              throw e;
            }
          }

          await credentialsController.updateCredentials({ email, password });
          authController.updateSession(session);
        }}
      />
    </View>
  );
}
