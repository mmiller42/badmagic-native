import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button, ScrollView, Text, TextInput, View } from "react-native";

import { Param, routeToUri, workspace } from "../../utils/badmagic";
import {
  AuthenticatedStackParamsList,
  AuthenticatedStackScreenProps,
} from "../AuthenticatedStackNavigator";
import { useBadMagicRoute, useBadMagicUri } from "../../hooks/badmagic";

type Params = Record<string, string>;

export function EndpointScreen({
  navigation,
  route: { params },
}: AuthenticatedStackScreenProps<"Endpoint">) {
  const { navigate } =
    useNavigation<NativeStackNavigationProp<AuthenticatedStackParamsList>>();

  const route = useBadMagicRoute(params.path);

  useEffect(() => {
    if (route) {
      navigation.setOptions({ title: route.name });
    }
  }, [route, navigation]);

  const [routeParams, setRouteParams] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (route?.routeParams ?? []).map(({ name, defaultValue }) => [
        name,
        defaultValue,
      ])
    )
  );
  const [qsParams, setQsParams] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (route?.qsParams ?? []).map(({ name, defaultValue }) => [
        name,
        defaultValue,
      ])
    )
  );

  const uri = useBadMagicUri(route, routeParams, qsParams);

  const disabled = useMemo(
    () => Object.values(routeParams).some((param) => !param.trim()),
    [routeParams]
  );

  return !route ? null : (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flexGrow: 1 }}
        contentContainerStyle={{ padding: 16 }}
      >
        <View style={{ gap: 16 }}>
          <Text style={{ fontSize: 18 }}>{uri}</Text>
          <View style={{ gap: 8, padding: 16 }}>
            {route.routeParams.map((param) => (
              <ParamField
                key={param.name}
                param={param}
                params={routeParams}
                setParams={setRouteParams}
              />
            ))}
            {route.qsParams.map((param) => (
              <ParamField
                key={param.name}
                param={param}
                params={qsParams}
                setParams={setQsParams}
              />
            ))}
          </View>
        </View>
      </ScrollView>
      <View>
        <Button
          title="Submit"
          onPress={() => {
            navigate("Result", {
              queryKey: [route.path, routeParams, qsParams],
            });
          }}
          disabled={disabled}
        />
      </View>
    </View>
  );
}

function ParamField({
  param: { name, placeholder, description },
  params,
  setParams,
}: {
  param: Param;
  params: Params;
  setParams: Dispatch<SetStateAction<Params>>;
}) {
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flexGrow: 1 }}>
          <Text>{name}</Text>
        </View>
        <View style={{ flexBasis: 200 }}>
          <TextInput
            placeholder={placeholder}
            value={params[name]}
            onChangeText={(value) =>
              setParams((params) => ({ ...params, [name]: value }))
            }
          />
        </View>
      </View>
      {description ? <Text>{description}</Text> : null}
    </View>
  );
}
