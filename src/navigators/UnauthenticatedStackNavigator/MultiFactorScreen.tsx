import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { Button, Keyboard, TextInput, ToastAndroid, View } from "react-native";

import {
  BadCredentialsError,
  BadLoginRequestBaseError,
  TokensResponse,
  twoFactorAuthenticate,
} from "../../api/auth";
import { authController } from "../../controllers/AuthController";
import { credentialsController } from "../../controllers/CredentialsController";
import { UnauthenticatedStackParamsList } from "../UnauthenticatedStackNavigator";
import { usePopMultiFactorState } from "./providers/multiFactorAtom";

export function MultiFactorScreen() {
  const [token, setToken] = useState("");
  const state = usePopMultiFactorState();
  const { goBack } =
    useNavigation<NativeStackNavigationProp<UnauthenticatedStackParamsList>>();

  return (
    <View>
      <TextInput
        placeholder="One-Time Code"
        value={token}
        onChangeText={setToken}
        keyboardType="decimal-pad"
        textContentType="oneTimeCode"
        maxLength={6}
      />
      <Button
        disabled={!state || token.length !== 6 || !/^\d{6}$/.test(token)}
        title="Log In"
        onPress={async () => {
          Keyboard.dismiss();
          const { email, password, tfa_api_token } = state!;
          let session: TokensResponse;

          try {
            session = await twoFactorAuthenticate({ tfa_api_token, token });
          } catch (e) {
            if (e instanceof BadLoginRequestBaseError) {
              ToastAndroid.show(e.constructor.name, ToastAndroid.LONG);

              if (!(e instanceof BadCredentialsError)) {
                goBack();
              }
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
